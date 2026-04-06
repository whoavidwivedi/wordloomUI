import { parseArgs } from "node:util"

import packageJson from "../package.json"
import { CMUDICT_CONTEXT_SIZE, CMUDICT_SOURCE_URL, CMUDICT_WORD_COUNT } from "./cmudict-model"
import { WORDNET_DEFINITION_COUNT, WORDNET_SOURCE_URL } from "./wordnet-definitions"

export const commandName = Object.keys(packageJson.bin)[0] ?? "wordloom"

const DEFAULT_LENGTH = 5
const MIN_LENGTH = 2
const MAX_LENGTH = 8

const helpMessage = `
${commandName}

Generate lowercase names from a CMUdict-derived English letter-transition model.

Usage:
  ${commandName} [--length <number>] [--prefix <prefix>] [--suffix <suffix>] [--contains <text>]

Examples:
  ${commandName}
  ${commandName} --prefix no
  ${commandName} --suffix ut
  ${commandName} --contains abs
  ${commandName} --length 6 --prefix absent

Options:
  -l, --length <number>         Exact name length to generate (2-8, default: 5)
  -p, --prefix <prefix>         Literal starting prefix to validate and continue from
  -s, --suffix <suffix>         Literal ending suffix to require
  -c, --contains <text>         Literal substring to require anywhere in the name
  -h, --help                    Show help
  -v, --version                 Show version

Model:
  Derived from ${CMUDICT_WORD_COUNT} lowercase alphabetic word forms in CMUdict.
  Source: ${CMUDICT_SOURCE_URL}
  Next letters are constrained by observed ${CMUDICT_CONTEXT_SIZE + 1}-gram transitions.

Meanings:
  If a generated name is also a WordNet lemma, the meaning column shows its WordNet meanings.
  Derived from ${WORDNET_DEFINITION_COUNT} lowercase lemmas in WordNet.
  Source: ${WORDNET_SOURCE_URL}
  WordNet usage examples are removed from the output.
  Dictionary matches are colored in interactive terminals.
`.trim()

const parseOptions = {
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
  length: { type: "string", short: "l" },
  prefix: { type: "string", short: "p" },
  suffix: { type: "string", short: "s" },
  contains: { type: "string", short: "c" },
} as const

type ParsedValues = {
  contains?: string
  help?: boolean
  length?: string
  prefix?: string
  suffix?: string
  version?: boolean
}

export type CliOptions = {
  contains: string
  help: boolean
  length: number
  prefix: string
  suffix: string
  version: boolean
}

const exitWithError = (message: string): never => {
  console.error(message)
  process.exit(1)
}

const parseLength = (rawLength: string | undefined) => {
  if (!rawLength) {
    return DEFAULT_LENGTH
  }

  const length = Number.parseInt(rawLength, 10)

  if (
    !Number.isInteger(length) ||
    `${length}` !== rawLength ||
    length < MIN_LENGTH ||
    length > MAX_LENGTH
  ) {
    exitWithError(`--length must be an integer between ${MIN_LENGTH} and ${MAX_LENGTH}`)
  }

  return length
}

const parseLettersOnlyOption = (
  optionName: "--contains" | "--prefix" | "--suffix",
  rawValue: string | undefined,
  length: number,
) => {
  if (!rawValue) {
    return ""
  }

  const value = rawValue.trim().toLowerCase()

  if (!value) {
    return ""
  }

  if (!/^[a-z]+$/.test(value)) {
    exitWithError(`${optionName} must contain only letters`)
  }

  if (value.length > length) {
    exitWithError(`${optionName} cannot be longer than --length`)
  }

  return value
}

const parsePrefix = (rawPrefix: string | undefined, length: number) =>
  parseLettersOnlyOption("--prefix", rawPrefix, length)

const parseSuffix = (rawSuffix: string | undefined, length: number) =>
  parseLettersOnlyOption("--suffix", rawSuffix, length)

const parseContains = (rawContains: string | undefined, length: number) =>
  parseLettersOnlyOption("--contains", rawContains, length)

const parseCliArgs = (): ParsedValues => {
  try {
    const { values } = parseArgs({
      options: parseOptions,
      strict: true,
    })

    return values as ParsedValues
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse arguments"

    return exitWithError(message)
  }
}

export const readCliOptions = (): CliOptions => {
  const parsedValues = parseCliArgs()
  const help = parsedValues.help ?? false
  const version = parsedValues.version ?? false

  if (help || version) {
    return {
      contains: "",
      help,
      length: DEFAULT_LENGTH,
      prefix: "",
      suffix: "",
      version,
    }
  }

  const length = parseLength(parsedValues.length)

  return {
    contains: parseContains(parsedValues.contains, length),
    help,
    length,
    prefix: parsePrefix(parsedValues.prefix, length),
    suffix: parseSuffix(parsedValues.suffix, length),
    version,
  }
}

export const printHelp = () => {
  console.log(helpMessage)
}

export const printVersion = () => {
  console.log(`${packageJson.name}@${packageJson.version}`)
}
