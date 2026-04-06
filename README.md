# nameforge

Generate lowercase names from a CMUdict-derived English letter-transition model, with a meaning column sourced from WordNet when a generated name is also a dictionary lemma.

## Quick start

```sh
bun install
bun run build
bun test
node dist/index.mjs --help
```

The checked-in generated model files are already included in the repo and in the published package, so normal users do not need to run `bun run derive:model`.

## Usage

```sh
node dist/index.mjs
node dist/index.mjs --starts-with no
node dist/index.mjs --ends-with ut
node dist/index.mjs --length 6 --starts-with absent
```

`--length` supports values from `2` through `8`. If you omit it, it defaults to `5`.
Results are printed as a console-table-style terminal table with row indexes:

```text
┌───┬────────┬─────────────────────────────────────────────────────────────┐
│   │ name   │ meaning                                                     │
├───┼────────┼─────────────────────────────────────────────────────────────┤
│ 1 │ absent │ verb: go away or leave; adjective: not being in a          │
│   │        │ specified place                                             │
│ 2 │ noaked │                                                             │
└───┴────────┴─────────────────────────────────────────────────────────────┘
```

When the output is shown in an interactive terminal, names that are real WordNet dictionary words are colored. You can force that behavior in non-interactive output with `FORCE_COLOR=1`.
If a query has no matches, the CLI prints `No results found.` instead of an empty table.

## Model

The generator is derived from [CMUdict](https://github.com/cmusphinx/cmudict), the Carnegie Mellon Pronouncing Dictionary maintained by Carnegie Mellon University.

The CLI reads checked-in generated data from [bin/cmudict-model.ts](./bin/cmudict-model.ts) and [bin/wordnet-definitions.ts](./bin/wordnet-definitions.ts), so installed users can run `nameforge` immediately.

`bun run derive:model` is a maintainer workflow. It downloads the current `cmudict.dict` file and Princeton WordNet database, regenerates those checked-in files, and formats the generated output.

This means:

- A generated name is only extended with letter sequences observed in CMUdict-derived data.
- `--starts-with` is treated as a literal prefix, but it still has to be compatible with the source-backed model.
- `--ends-with` is treated as a literal suffix filter on the generated names.
- The `meaning` column is filled from WordNet definitions when the generated name is also a WordNet lemma; WordNet usage examples are removed.

## Options

```sh
--length <number>         Exact name length to generate (2-8, default: 5)
--starts-with <prefix>    Literal starting prefix to validate and continue from
--ends-with <suffix>      Literal ending suffix to require
--help                    Show help
--version                 Show version
```

## Scripts

```sh
bun run derive:model
bun run build
bun run dev
bun run format
bun run format:check
bun run lint
bun test
```
