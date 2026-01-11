# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts the Next.js App Router entry (`layout.tsx`, `page.tsx`) that coordinates WebSocket control, MJPEG overlays, and global styles.
- `components/` holds reusable UI such as `CameraSection.tsx` and `ControlPanel.tsx`; keep new visual primitives here and import via `@/components/...`.
- `types/robot.ts` centralizes telemetry and detection contracts—extend these types first so downstream components receive consistent props.
- `db/schema.js` plus `drizzle.config.js` define the PostgreSQL schema; Drizzle CLI will emit migrations into `drizzle/` when you run it.
- `.env` carries `NEXT_PUBLIC_MJPEG_URL`, `NEXT_PUBLIC_PI_WS`, `NEXT_PUBLIC_DETECT_URL`, and `DATABASE_URL`; `public/` stores static assets while `.next/` is disposable build output.

## Build, Test, and Development Commands
- `npm run dev` starts the Next 16 dev server with hot reload; it expects the `NEXT_PUBLIC_*` URLs and database string to be defined.
- `npm run build` performs the production bundle, full type-check, and route analysis; treat it as the release gate.
- `npm run start` serves the built app from `.next/` and mirrors how deployments behave.
- `npm run lint` executes `eslint-config-next` (Core Web Vitals + TypeScript) and is the current CI signal.
- `npx drizzle-kit push:pg` (reads `drizzle.config.js`) syncs `db/schema.js` to the Postgres instance pointed at by `DATABASE_URL`.

## Coding Style & Naming Conventions
- TypeScript runs in strict mode with `noEmit`; export typed helpers instead of `any`, and reuse shapes from `types/`.
- Components/files use PascalCase (`SensorsPanel.tsx`), hooks/utilities use camelCase, and string unions like `DetectionStatus` remain PascalCase identifiers.
- Indent with two spaces, prefer double quotes, and let Tailwind utility strings describe layout; ESLint will flag deviations.
- Use the `@/` alias for absolute imports, reserving relative paths for same-folder files to avoid brittle traversals.

## Testing Guidelines
- There is no wired runner yet—add `next/jest` plus `@testing-library/react` when you touch behavior-heavy areas and script it as `npm test`.
- Co-locate specs as `*.test.tsx` next to the component or hook, mocking WebSocket/fetch boundaries to keep tests deterministic.
- Target ≥80% statement coverage for new modules; outline any intentional gaps in the PR checklist.
- Until Jest lands, pair `npm run lint` with manual verification in `npm run dev` and note the tested flows explicitly.

## Commit & Pull Request Guidelines
- Follow the existing terse, imperative history (`init drizzle`, `code decoupled & reorganized`): lead with a verb, sentence case, ≤72 characters.
- Reference linked issues in the PR body, summarize the user-facing impact, and list environment or schema updates (e.g., new `NEXT_PUBLIC_*` keys).
- Attach UI screenshots or screen recordings whenever components change, and describe how reviewers can reproduce the change locally.
- Confirm `npm run lint`, upcoming `npm test`, and any `npx drizzle-kit push:pg` runs before requesting review; failed commands should block merging.
