# wordloom

**Find short, pronounceable names for brands, products, and projects.**

[![Twitter](https://img.shields.io/twitter/follow/nrjdalal?label=%40nrjdalal_dev)](https://twitter.com/nrjdalal)
[![npm](https://img.shields.io/npm/v/wordloom?color=red&logo=npm)](https://www.npmjs.com/package/wordloom)
[![downloads](https://img.shields.io/npm/dt/wordloom?color=red&logo=npm)](https://www.npmjs.com/package/wordloom)
[![stars](https://img.shields.io/github/stars/nrjdalal/wordloom?color=blue)](https://github.com/nrjdalal/wordloom)
[![license](https://img.shields.io/npm/l/wordloom)](https://www.npmjs.com/package/wordloom)

Every name `wordloom` generates sounds like it could be a real word — because it follows letter patterns learned from 100k+ English words. If a result _is_ a real word, you see the meaning right next to it.

```sh
npx wordloom --length 6 --contains abse
```

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

## Use it to name anything

- **Startups and brands** — find catchy, memorable names that roll off the tongue
- **Apps and products** — discover short names that feel polished and intentional
- **CLI tools and libraries** — pick something developers will actually remember
- **Side projects and domains** — explore candidates by prefix, suffix, or substring
- **Creative writing** — generate fictional places, characters, or organizations

If a candidate already has a dictionary meaning, `wordloom` tells you — so you can decide whether that helps or hurts your brand.

## Quick start

```sh
npx wordloom
npx wordloom --prefix no
npx wordloom --suffix ut
npx wordloom --contains abse
npx wordloom --length 6 --prefix abs
```

Default length is `5`. Supported lengths are `2` through `8`.

## Why wordloom?

- **Pronounceable, not random** — names follow real English letter transitions derived from [CMUdict](https://github.com/cmusphinx/cmudict), so they sound natural
- **Built-in meaning check** — real dictionary words (via WordNet) show their definitions inline
- **Precise filtering** — lock down length, prefix, suffix, or substring to narrow your search
- **Fast and offline** — the language model ships with the package, no API calls needed
- **Terminal-native** — clean table output with color-highlighted dictionary matches

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
wordloom                              # 5-letter names
wordloom --length 6                   # 6-letter names
wordloom --prefix no                  # names starting with "no"
wordloom --suffix ut                  # names ending in "ut"
wordloom --contains abse              # names containing "abse"
wordloom --length 6 --prefix abs      # combine filters
wordloom --length 5 --prefix re --suffix t
```

## How it works

`wordloom` learns which letters naturally follow each other in English by analyzing 100k+ words from [CMUdict](https://github.com/cmusphinx/cmudict). Every generated name walks these learned transitions, which is why results feel familiar and pronounceable — not like random character soup.

Each result is also checked against [WordNet](https://wordnet.princeton.edu/). If a name happens to be a real dictionary word, the meaning is shown inline so you can make an informed choice.

The language model ships pre-built with the package — no network calls, no API keys, instant results.

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
