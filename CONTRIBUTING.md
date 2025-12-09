# Contributing to Commerzio Services

Thank you for contributing! This guide covers setup, code style, and PR process.

## Development Setup

```bash
# Prerequisites: Node.js 20+, PostgreSQL
git clone https://github.com/your-org/commerzio-services.git
cd commerzio-services
npm install
cp .env.example .env
npm run dev
```

## Project Structure

```
├── client/src/          # React frontend
├── server/              # Express backend
├── shared/schema.ts     # Drizzle ORM schema
└── e2e/                 # Playwright tests
```

## Code Style

- Use TypeScript with strict mode
- Prefer functional components with hooks
- Use Zod for API validation

## Testing

```bash
npm run test      # Unit tests
npm run test:e2e  # E2E tests
npm run check     # Type checking
```

## Commit Format

```
type(scope): description
# types: feat, fix, refactor, docs, test, chore
```

## PR Checklist

- [ ] Tests pass
- [ ] Type checking passes
- [ ] No sensitive data in commits
