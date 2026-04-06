# TypeScript CLI Starter Template

A lightweight Bun + TypeScript template for starting CLI projects without carrying over old product-specific behavior, branding, or release automation.

## What stays

- `bin/index.ts` as a tiny working CLI entrypoint
- `tsdown` for building a single bundled executable
- `bun:test` for fast local tests
- `oxfmt`, `oxlint`, `lefthook`, and `commitlint` for basic hygiene
- GitHub Actions CI that only validates the template

## Quick start

```sh
bun install
bun run build
bun test
node dist/index.mjs --help
```

## Included sample commands

The template ships with intentionally small example commands so the project works immediately:

```sh
node dist/index.mjs hello
node dist/index.mjs hello Codex
node dist/index.mjs info
node dist/index.mjs --version
```

## Recommended first edits

1. Rename the package and bin command in `package.json`.
2. Replace the sample command logic in `bin/index.ts`.
3. Rewrite `tests/cli.test.ts` around your real behavior.
4. Update this README, the license, and any repository metadata you want to publish.
5. Add back release automation only when the project is ready for it.

## Scripts

```sh
bun run build
bun run dev
bun run format
bun run format:check
bun run lint
bun test
```

## Project shape

```text
.
├── .github/workflows/test.yml
├── bin/index.ts
├── tests/cli.test.ts
├── package.json
├── tsconfig.json
└── tsdown.config.ts
```

## Notes

- The package is marked `private` by default to prevent accidental publishes.
- The sample CLI is deliberately small so you can delete or reshape it quickly.
- The previous project-specific logic, fixtures, release workflows, and funding metadata were removed.
