import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
  ipAddress?: string
) {
  const email = claims["email"];
  const phone = claims["phone_number"]; // Replit Auth may provide this
  
  // Check if user is banned before allowing login/registration
  const banCheck = await storage.checkIfBanned(email, phone, ipAddress);
  if (banCheck.isBanned) {
    throw new Error(`Account access denied. ${banCheck.reason ? `Reason: ${banCheck.reason}` : 'Please contact support.'}`);
  }
  
  // Check if user exists and has a banned/kicked status
  const existingUser = await storage.getUser(claims["sub"]);
  if (existingUser && (existingUser.status === "banned" || existingUser.status === "kicked" || existingUser.status === "suspended")) {
    throw new Error(`Account is ${existingUser.status}. ${existingUser.statusReason || 'Please contact support.'}`);
  }
  
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  // In local development (outside Replit), REPL_ID won't be set.
  // In that case, skip setting up Replit Auth entirely.
  if (!process.env.REPL_ID) {
    console.log("Replit Auth disabled: REPL_ID is not set. Skipping auth setup.");
    return;
  }

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      // Note: IP address is not easily available in this context, but we check email/phone
      await upsertUser(tokens.claims());
      verified(null, user);
    } catch (error: any) {
      // Return error to prevent login
      verified(error, false);
    }
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // When Replit Auth is disabled (no REPL_ID), treat all users as authenticated.
  // This is only for local development.
  if (!process.env.REPL_ID) {
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if user is banned/suspended/kicked (enforce immediately)
  const userId = user.claims?.sub;
  if (userId) {
    try {
      const dbUser = await storage.getUser(userId);
      if (dbUser && (dbUser.status === "banned" || dbUser.status === "kicked" || dbUser.status === "suspended")) {
        // Force logout and destroy session
        return new Promise((resolve) => {
          req.logout((err) => {
            if (req.session) {
              req.session.destroy(() => {
                res.clearCookie('connect.sid');
                res.status(403).json({ 
                  message: `Account is ${dbUser.status}. ${dbUser.statusReason || 'Please contact support.'}` 
                });
                resolve(undefined);
              });
            } else {
              res.clearCookie('connect.sid');
              res.status(403).json({ 
                message: `Account is ${dbUser.status}. ${dbUser.statusReason || 'Please contact support.'}` 
              });
              resolve(undefined);
            }
          });
        });
      }
    } catch (error) {
      console.error("Error checking user status:", error);
    }
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
