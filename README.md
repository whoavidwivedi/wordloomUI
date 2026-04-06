# wordloom

**Generate short, word-like lowercase names from real English letter patterns.**

[![Twitter](https://img.shields.io/twitter/follow/nrjdalal?label=%40nrjdalal_dev)](https://twitter.com/nrjdalal)
[![npm](https://img.shields.io/npm/v/wordloom?color=red&logo=npm)](https://www.npmjs.com/package/wordloom)
[![downloads](https://img.shields.io/npm/dt/wordloom?color=red&logo=npm)](https://www.npmjs.com/package/wordloom)
[![stars](https://img.shields.io/github/stars/nrjdalal/wordloom?color=blue)](https://github.com/nrjdalal/wordloom)
[![license](https://img.shields.io/npm/l/wordloom)](https://www.npmjs.com/package/wordloom)

`wordloom` gives you lowercase name ideas in a clean terminal table. If a result is also a real dictionary word, it shows the meaning next to it.

Good for:

- naming side projects, experiments, or folders
- exploring short word-like combinations
- finding names that start, end, or contain a certain pattern
- spotting real dictionary words among generated results

## Quick usage

```sh
npx wordloom
npx wordloom --prefix no
npx wordloom --suffix ut
npx wordloom --contains abse
npx wordloom --length 6 --prefix abs
```

Default length is `5`. Supported lengths are `2` through `8`.

Example:

```sh
npx wordloom --length 6 --contains abse
```

Output:

```text
┌───┬────────┬──────────────────────────────────────────────┐
│   │ name   │ meaning                                      │
├───┼────────┼──────────────────────────────────────────────┤
│ 1 │ abseco │                                              │
│ 2 │ absect │                                              │
│ 3 │ absent │ verb: go away or leave; adjective: not      │
│   │        │ being in a specified place                   │
└───┴────────┴──────────────────────────────────────────────┘
```

If nothing matches, `wordloom` prints:

```text
No results found.
```

## Why wordloom?

- Uses real English letter patterns derived from [CMUdict](https://github.com/cmusphinx/cmudict), instead of fully random strings
- Adds meanings from WordNet when a generated result is also a real dictionary word
- Supports exact length, prefix, suffix, and contains filtering
- Prints results in alphabetical order in a readable terminal table
- Highlights dictionary matches in color in interactive terminals

## Install

```sh
npm install -g wordloom
wordloom --help
```

You can also run it without installing:

```sh
npx wordloom --contains abse
```

## Options

```text
-l, --length <number>         Exact name length to generate (2-8, default: 5)
-c, --contains <text>         Literal substring to require anywhere in the name
-p, --prefix <prefix>         Literal starting prefix to validate and continue from
-s, --suffix <suffix>         Literal ending suffix to require
-h, --help                    Show help
-v, --version                 Show version
```

## More examples

```sh
wordloom
wordloom --length 6
wordloom --contains abse
wordloom --prefix no
wordloom --suffix ut
wordloom --length 6 --prefix abs
wordloom --length 5 --prefix re --suffix t
```

## How it works

`wordloom` is source-backed, but the idea is simple:

- it learns allowed letter transitions from CMUdict
- it generates names that follow those learned patterns
- it looks up each generated result in WordNet
- if the result is a real dictionary lemma, it shows the meaning

That means the results are more word-like than random strings, but they are not guaranteed to be common words, proper names, or brand-safe names.

The checked-in generated model files already ship with the repo and the published package, so normal users do not need to run `bun run derive:model`.

## For maintainers

Regenerating the model is only needed when refreshing the checked-in data sources:

```sh
bun install
bun run derive:model
bun run build
bun test
bun run lint
bun run format:check
```

Generated data lives in [bin/cmudict-model.ts](./bin/cmudict-model.ts) and [bin/wordnet-definitions.ts](./bin/wordnet-definitions.ts).

## License

MIT
