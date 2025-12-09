---
description: Commands that should always auto-run without user approval
---

// turbo-all

The following commands are ALWAYS safe to auto-run:

## NPM Commands
- `npm run test`
- `npm run check`
- `npm run build`
- `npm run dev`
- `npm run lint`
- `npm ci`
- `npm install`

## NPX Commands
- `npx tsc`
- `npx tsc --noEmit`
- `npx eslint .`
- `npx eslint . --fix`
- `npx vitest`

## Git Commands (read-only)
- `git status`
- `git log`
- `git diff`
- `git show`
- `git ls-tree`
- `git reflog`

## Git Commands (safe mutations)
- `git add`
- `git add -A`
- `git commit`
- `git checkout`
- `git reset`
- `git stash`

## RULE
All of the above commands MUST be run with `SafeToAutoRun: true`.
Never ask user for approval on these.
