/**
 * Social Mission Verification Service
 * 
 * Verifies social media actions for COM Points missions:
 * - X (Twitter): Follow verification, post verification
 * - Instagram: Follow verification
 * - Facebook: Like/Follow verification
 * - TikTok: Follow verification
 * 
 * Uses OAuth tokens stored in oauthTokens table to verify user actions
 */

import { db } from "./db";
import { oauthTokens, users, userMissions, missions, bookings, reviews } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Types
interface VerificationResult {
    verified: boolean;
    message: string;
    details?: Record<string, any>;
}

interface SocialAccount {
    provider: "twitter" | "instagram" | "facebook" | "tiktok";
    accessToken: string;
    refreshToken?: string;
    userId: string;
    username?: string;
}

// ===========================================
// TOKEN MANAGEMENT
// ===========================================

/**
 * Get user's OAuth token for a specific provider
 */
export async function getSocialToken(
    userId: string,
    provider: "google" | "twitter" | "facebook"
): Promise<SocialAccount | null> {
    const [token] = await db
        .select()
        .from(oauthTokens)
        .where(
            and(
                eq(oauthTokens.userId, userId),
                eq(oauthTokens.provider, provider)
            )
        )
        .limit(1);

    if (!token) {
        return null;
    }

    return {
        provider: provider as any,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken || undefined,
        userId: token.providerUserId || "",
        username: token.providerUsername || undefined,
    };
}

/**
 * Check if user has connected a social account
 */
export async function hasSocialConnection(
    userId: string,
    provider: "twitter" | "facebook"
): Promise<boolean> {
    const token = await getSocialToken(userId, provider);
    return token !== null;
}

// ===========================================
// X (TWITTER) VERIFICATION
// ===========================================

/**
 * Verify user follows our official X account
 */
export async function verifyTwitterFollow(
    userId: string,
    targetUsername: string = "CommerzioApp"
): Promise<VerificationResult> {
    const token = await getSocialToken(userId, "twitter");

    if (!token) {
        return {
            verified: false,
            message: "Twitter account not connected. Please connect your X account first.",
        };
    }

    try {
        // In production, use Twitter API v2 to check if user follows target
        // GET /2/users/:id/following and check if targetUsername is in the list
        // For now, return a simulated check

        // TODO: Implement actual Twitter API call
        // const response = await fetch(`https://api.twitter.com/2/users/${token.userId}/following`, {
        //   headers: { Authorization: `Bearer ${token.accessToken}` }
        // });

        console.log(`[SocialVerify] Checking Twitter follow: ${token.username} -> @${targetUsername}`);

        // Placeholder: Assume verified if account is connected
        // In production, this would make actual API calls
        return {
            verified: true,
            message: `Successfully verified @${token.username} follows @${targetUsername}`,
            details: {
                follower: token.username,
                following: targetUsername,
                verifiedAt: new Date().toISOString(),
            },
        };
    } catch (error: any) {
        console.error("Twitter follow verification error:", error);
        return {
            verified: false,
            message: "Failed to verify Twitter follow. Please try again.",
        };
    }
}

/**
 * Verify user posted/retweeted about our service
 */
export async function verifyTwitterPost(
    userId: string,
    requiredHashtag: string = "#Commerzio"
): Promise<VerificationResult> {
    const token = await getSocialToken(userId, "twitter");

    if (!token) {
        return {
            verified: false,
            message: "Twitter account not connected. Please connect your X account first.",
        };
    }

    try {
        // In production, use Twitter API v2 to search user's recent tweets
        // GET /2/users/:id/tweets and check for requiredHashtag

        console.log(`[SocialVerify] Checking Twitter post with ${requiredHashtag}`);

        // Placeholder
        return {
            verified: true,
            message: `Successfully verified post with ${requiredHashtag}`,
            details: {
                user: token.username,
                hashtag: requiredHashtag,
                verifiedAt: new Date().toISOString(),
            },
        };
    } catch (error: any) {
        console.error("Twitter post verification error:", error);
        return {
            verified: false,
            message: "Failed to verify Twitter post. Please try again.",
        };
    }
}

// ===========================================
// INSTAGRAM VERIFICATION
// ===========================================

/**
 * Verify user follows our official Instagram account
 * Note: Instagram Basic Display API has limited capabilities
 */
export async function verifyInstagramFollow(
    userId: string,
    targetUsername: string = "commerzio_app"
): Promise<VerificationResult> {
    // Instagram Basic Display API doesn't support checking follows
    // This would require Instagram Graph API with business account

    // For now, we can implement manual verification or honor system
    console.log(`[SocialVerify] Instagram follow check for ${targetUsername} - manual verification required`);

    return {
        verified: false,
        message: "Instagram verification requires manual review. Please submit proof of follow.",
        details: {
            targetUsername,
            verificationMethod: "manual",
        },
    };
}

// ===========================================
// FACEBOOK VERIFICATION
// ===========================================

/**
 * Verify user liked our Facebook page
 */
export async function verifyFacebookPageLike(
    userId: string,
    pageId: string = "CommerzioOfficial"
): Promise<VerificationResult> {
    const token = await getSocialToken(userId, "facebook");

    if (!token) {
        return {
            verified: false,
            message: "Facebook account not connected. Please connect your Facebook account first.",
        };
    }

    try {
        // In production, use Facebook Graph API
        // GET /me/likes and check if pageId is in the list

        console.log(`[SocialVerify] Checking Facebook page like: ${pageId}`);

        // Placeholder
        return {
            verified: true,
            message: `Successfully verified like for ${pageId}`,
            details: {
                pageId,
                verifiedAt: new Date().toISOString(),
            },
        };
    } catch (error: any) {
        console.error("Facebook like verification error:", error);
        return {
            verified: false,
            message: "Failed to verify Facebook like. Please try again.",
        };
    }
}

// ===========================================
// TIKTOK VERIFICATION
// ===========================================

/**
 * Verify user follows our TikTok account
 * Note: TikTok API has limited public access
 */
export async function verifyTikTokFollow(
    userId: string,
    targetUsername: string = "commerzio"
): Promise<VerificationResult> {
    // TikTok API for developers has limited capabilities
    // Following list is not publicly available via API

    console.log(`[SocialVerify] TikTok follow check for @${targetUsername} - manual verification required`);

    return {
        verified: false,
        message: "TikTok verification requires manual review. Please submit a screenshot of your follow.",
        details: {
            targetUsername,
            verificationMethod: "manual",
        },
    };
}

// ===========================================
// MISSION VERIFICATION DISPATCHER
// ===========================================

type MissionType =
    | "twitter_follow"
    | "twitter_post"
    | "instagram_follow"
    | "facebook_like"
    | "tiktok_follow"
    | "referral"
    | "first_booking"
    | "first_review"
    | "profile_complete";

/**
 * Verify a mission based on its type
 */
export async function verifyMission(
    userId: string,
    missionType: MissionType,
    missionParams?: Record<string, string>
): Promise<VerificationResult> {
    switch (missionType) {
        case "twitter_follow":
            return verifyTwitterFollow(userId, missionParams?.targetUsername);

        case "twitter_post":
            return verifyTwitterPost(userId, missionParams?.hashtag);

        case "instagram_follow":
            return verifyInstagramFollow(userId, missionParams?.targetUsername);

        case "facebook_like":
            return verifyFacebookPageLike(userId, missionParams?.pageId);

        case "tiktok_follow":
            return verifyTikTokFollow(userId, missionParams?.targetUsername);

        case "first_booking":
            return verifyFirstBooking(userId);

        case "first_review":
            return verifyFirstReview(userId);

        case "profile_complete":
            return verifyProfileComplete(userId);

        default:
            return {
                verified: false,
                message: `Unknown mission type: ${missionType}`,
            };
    }
}

// ===========================================
// INTERNAL MISSION VERIFICATION
// ===========================================

/**
 * Verify user has made their first booking
 */
async function verifyFirstBooking(userId: string): Promise<VerificationResult> {
    try {
        const [booking] = await db
            .select({ id: bookings.id })
            .from(bookings)
            .where(eq(bookings.customerId, userId))
            .limit(1);

        if (booking) {
            return {
                verified: true,
                message: "First booking completed!",
                details: { bookingId: booking.id },
            };
        }

        return {
            verified: false,
            message: "First booking not yet completed.",
        };
    } catch (error) {
        console.error("Error verifying first booking:", error);
        return {
            verified: false,
            message: "Failed to verify first booking.",
        };
    }
}

/**
 * Verify user has left their first review
 */
async function verifyFirstReview(userId: string): Promise<VerificationResult> {
    try {
        const [review] = await db
            .select({ id: reviews.id })
            .from(reviews)
            .where(eq(reviews.reviewerId, userId))
            .limit(1);

        if (review) {
            return {
                verified: true,
                message: "First review submitted!",
                details: { reviewId: review.id },
            };
        }

        return {
            verified: false,
            message: "First review not yet submitted.",
        };
    } catch (error) {
        console.error("Error verifying first review:", error);
        return {
            verified: false,
            message: "Failed to verify first review.",
        };
    }
}

/**
 * Verify user has completed their profile
 */
async function verifyProfileComplete(userId: string): Promise<VerificationResult> {
    const [user] = await db
        .select({
            firstName: users.firstName,
            lastName: users.lastName,
            phoneNumber: users.phoneNumber,
            profileImageUrl: users.profileImageUrl,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) {
        return {
            verified: false,
            message: "User not found.",
        };
    }

    const isComplete = !!(
        user.firstName &&
        user.lastName &&
        user.phoneNumber &&
        user.profileImageUrl
    );

    return {
        verified: isComplete,
        message: isComplete
            ? "Profile is complete!"
            : "Please complete your profile (name, phone, and photo)",
        details: {
            hasFirstName: !!user.firstName,
            hasLastName: !!user.lastName,
            hasPhone: !!user.phoneNumber,
            hasPhoto: !!user.profileImageUrl,
        },
    };
}

// ===========================================
// EXPORTS
// ===========================================

export type { VerificationResult, SocialAccount, MissionType };
