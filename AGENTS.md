# Repository Guidelines

## Project Structure & Module Organization

- Source: `pages/` (routes), `components/` (feature + `ui/` primitives), `hooks/`, `utils/`, `lib/` (e.g., `lib/firebase.ts`), `styles/`, `types/`.
- Assets: `public/` (images, fonts). Global styles in `styles/globals.scss`.
- Type aliases live in `types/types.d.ts`. Use `@/*` path alias from `tsconfig.json`.

## Build, Test, and Development Commands

- Install: `npm install`
- Dev server: `npm start` (Next.js on http://localhost:3000)
- Type-check: `npm run tsc`
- Format: `npm run format`
- Production build: `npx next build` (CI runs this; output is exported to `out/` by the Pages workflow).

## Coding Style & Naming Conventions

- Language: TypeScript (`strict: true`). Prefer typed props and return types.
- Formatting: Prettier with `printWidth: 120`. Run `npm run format` before PRs.
- Components: PascalCase file names (e.g., `components/HighScores.tsx`). Hooks start with `use*` (e.g., `hooks/useFirebaseData.ts`).
- Utilities: camelCase (e.g., `utils/navigation.ts`). Avoid default exports for shared modules.
- Styling: TailwindCSS + SCSS. Keep Tailwind classes readable; extract shared UI into `components/ui/`.

## Commit & Pull Request Guidelines

- Commits: Imperative mood and concise scope (e.g., "Add Compare Players page"). Reference issues/PRs where applicable (e.g., `(#8)`).
- PRs: Clear description, linked issue, screenshots/GIFs for UI changes, and notes on testing and risk. Keep changes focused and small.
- CI: GitHub Actions deploys `main` to GitHub Pages after `next build`.

## Security & Configuration Tips

- Firebase keys are required. Use `.env.local` with `NEXT_PUBLIC_FIREBASE_*` vars; never commit `.env*` files (already gitignored).
- For CI, set GitHub Secrets: `NEXT_PUBLIC_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`.

## Architecture Overview

- Next.js (pages router) + React 18. Data access via Firebase client (`lib/firebase.ts`).
- UI composed from `components/` and `components/ui/`; state kept local to views or derived from Firebase.
