# Wayfinder ✈️

Wayfinder is a trip-inspiration app: tell it your budget, your vibe, your home
airport, and how long you want to travel, and it proposes a destination
(plus a couple of alternates) matched to your inputs.

This is currently a **frontend-only** concept demo — trip matching runs
entirely client-side against a curated sample dataset of destinations. No
backend, no live pricing or availability.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Framer Motion
- lucide-react icons

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a production
bundle; `npm run lint` runs Oxlint.

## How matching works

`src/lib/matchTrip.ts` scores every destination in `src/data/destinations.ts`
against the user's vibe selection, budget tier, travel season, and an
estimated flight time from their home airport, then returns the top-scoring
matches.
