# Wayfinder ✈️

Wayfinder is a trip-inspiration app: tell it your budget, your vibe, your home
airport, and when you want to travel, and an agent proposes a destination
(plus a couple of alternates) grounded in real flight data.

## What is this Jack
Wayfinder is an app that helps you book travel. The user enters some inputs, this app then calls to the google flights and hotels API through Serp API, passes that to a single agent on Antrhopic which analyzes the data and user's input and then recommends a plan.

## Ways this can be leveled up
Creating sub agents for activities, flights, and hotels which are managed by a harness

Giving these agents browser control where they actually go book flights

## How it works

1. The frontend pre-filters a curated dataset of 15 destinations
   (`src/data/destinations.ts`) down to 4 candidates using a heuristic scorer
   (`src/lib/matchTrip.ts`) — vibe overlap, budget fit, and season fit.
2. A serverless function (`api/plan-trip.ts`) hands those candidates to
   Claude along with a `search_flights` tool backed by the
   [Duffel](https://duffel.com) flight search API. Claude decides which
   candidate(s) to check real flights for, can pivot to an alternate if a
   route comes back empty, and calls a `finalize_recommendation` tool with
   its pick, a personalized rationale, and a short itinerary.
3. The frontend renders the agent's answer, including real flight price and
   duration when available.

The tool loop (`api/_lib/agent.ts`) is capped at 3 Claude turns and 4 flight
searches per request, so it always terminates quickly with an answer, real
or estimated.

## Stack

- React 19 + TypeScript, Vite, Tailwind CSS v4, Framer Motion
- Vercel serverless function (Node) for the backend
- `@anthropic-ai/sdk` for the Claude tool-use loop
- [Duffel](https://duffel.com) flight search API (use a sandbox `duffel_test_...` token — mock airline data, no real bookings)
- Vitest for the backend's unit tests

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY and DUFFEL_ACCESS_TOKEN
npm run dev                  # frontend only, http://localhost:5173
```

Running the frontend alone won't hit `/api/plan-trip` (there's no server for
it outside Vercel's runtime). To exercise the full flow locally, use the
[Vercel CLI](https://vercel.com/docs/cli):

```bash
vercel dev
```

`npm run build` produces a production bundle, `npm run lint` runs Oxlint,
and `npm run test` runs the backend's Vitest suite (pure control-flow and
data-normalization tests — no network calls, so they run anywhere).

## Deploying

Push to a repo connected to Vercel; `vercel.json` gives `api/plan-trip.ts`
a 60s timeout for the tool-use loop. Set `ANTHROPIC_API_KEY` and
`DUFFEL_ACCESS_TOKEN` as project environment variables.
