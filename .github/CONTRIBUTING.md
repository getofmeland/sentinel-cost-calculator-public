# Contributing

Thanks for your interest in contributing to the Sentinel Cost Calculator.

## Getting started

1. Fork the repository and create a feature branch from `main`.
2. Run `npm install` and `npm run dev` to start the dev server.
3. Make your changes, run `npm test` and `npm run lint` before pushing.
4. Open a pull request against `main`.

## Guidelines

- **UK English** — all user-facing text uses UK spellings (e.g. "optimise", "colour", "licence").
- **No hardcoded brand colours** — use Tailwind tokens (`text-primary`, `bg-accent`) or read from
  `src/config/brand.ts`. Never inline raw hex values in component JSX.
- **Pricing source references** — if you update pricing data in `src/data/`, include a link to the
  official Microsoft pricing page in your PR description.
- **Tests** — add Vitest tests for any new calculation utility functions in `src/utils/`.
- **No backend** — calculations must remain client-side. The only server code is the Azure Functions
  API in `api/`.

## Claude Code agents

This repository includes Claude Code agents in `.claude/agents/` for:
- `ui-reviewer` — accessibility and brand consistency checks
- `sentinel-pricing` — pricing data validation
- `calculator-tester` — calculation accuracy verification

Run them with `/agents` in Claude Code for a quality check before opening a PR.

## Commit messages

Use short, imperative sentences: `add EUR currency support`, `fix BreakevenChart axis scaling`.
