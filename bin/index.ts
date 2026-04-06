#!/usr/bin/env node
import { parseArgs } from "node:util"

import packageJson from "../package.json"
import {
  CMUDICT_CONTEXT_SIZE,
  CMUDICT_SOURCE_URL,
  CMUDICT_TRANSITIONS,
  CMUDICT_WORD_COUNT,
} from "./cmudict-model"
import {
  WORDNET_DEFINITION_COUNT,
  WORDNET_DEFINITIONS,
  WORDNET_SOURCE_URL,
} from "./wordnet-definitions"

const commandName = Object.keys(packageJson.bin)[0] ?? "nameforge"
const startContext = "^".repeat(CMUDICT_CONTEXT_SIZE)

const helpMessage = `
${commandName}

Generate lowercase names from a CMUdict-derived English letter-transition model.

Usage:
  ${commandName} [--length <number>] [--starts-with <prefix>] [--ends-with <suffix>]

Examples:
  ${commandName}
  ${commandName} --starts-with no
  ${commandName} --ends-with ut
  ${commandName} --length 6 --starts-with absent

Options:
  -l, --length <number>         Exact name length to generate (2-8, default: 5)
  -s, --starts-with <prefix>    Literal starting prefix to validate and continue from
  -e, --ends-with <suffix>      Literal ending suffix to require
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

const printVersion = () => {
  console.log(`${packageJson.name}@${packageJson.version}`)
}

const printHelp = () => {
  console.log(helpMessage)
}

const exitWithError = (message: string) => {
  console.error(message)
  process.exit(1)
}

const parseLength = (rawLength: string | undefined) => {
  if (!rawLength) {
    return 5
  }

  const length = Number.parseInt(rawLength, 10)

  if (!Number.isInteger(length) || `${length}` !== rawLength || length < 2 || length > 8) {
    exitWithError(`--length must be an integer between 2 and 8`)
  }

  return length
}

const parseLettersOnlyOption = (
  optionName: "--starts-with" | "--ends-with",
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
  parseLettersOnlyOption("--starts-with", rawPrefix, length)

const parseSuffix = (rawSuffix: string | undefined, length: number) =>
  parseLettersOnlyOption("--ends-with", rawSuffix, length)

const listNextCharacters = (context: string) =>
  (CMUDICT_TRANSITIONS.get(context) ?? "").replaceAll("$", "")

const canEnd = (context: string) => (CMUDICT_TRANSITIONS.get(context) ?? "").includes("$")

const advanceContext = (context: string, character: string) =>
  `${context}${character}`.slice(-CMUDICT_CONTEXT_SIZE)

const buildFailureTable = (pattern: string) => {
  if (!pattern) {
    return []
  }

  const failureTable = Array.from({ length: pattern.length }, () => 0)

  for (let index = 1; index < pattern.length; index += 1) {
    let candidateLength = failureTable[index - 1]

    while (candidateLength > 0 && pattern[index] !== pattern[candidateLength]) {
      candidateLength = failureTable[candidateLength - 1]
    }

    if (pattern[index] === pattern[candidateLength]) {
      candidateLength += 1
    }

    failureTable[index] = candidateLength
  }

  return failureTable
}

const advanceSuffixState = (
  pattern: string,
  failureTable: readonly number[],
  currentState: number,
  character: string,
) => {
  if (!pattern) {
    return 0
  }

  let nextState = currentState

  while (nextState > 0 && character !== pattern[nextState]) {
    nextState = failureTable[nextState - 1]
  }

  if (character === pattern[nextState]) {
    nextState += 1
  }

  return nextState
}

const suffixMatches = (suffix: string, suffixState: number) =>
  !suffix || suffixState === suffix.length

const validatePrefix = (prefix: string, suffix: string, failureTable: readonly number[]) => {
  let context = startContext
  let suffixState = 0

  for (const character of prefix) {
    if (!listNextCharacters(context).includes(character)) {
      return { context: "", suffixState: 0, valid: false }
    }

    context = advanceContext(context, character)
    suffixState = advanceSuffixState(suffix, failureTable, suffixState, character)
  }

  return { context, suffixState, valid: true }
}

const countMemo = new Map<string, number>()

const countCompletions = (
  remainingLength: number,
  context: string,
  suffix: string,
  suffixState: number,
  failureTable: readonly number[],
): number => {
  const cacheKey = `${remainingLength}:${context}:${suffixState}:${suffix}`
  const cachedCount = countMemo.get(cacheKey)

  if (cachedCount !== undefined) {
    return cachedCount
  }

  let completionCount = 0

  if (remainingLength === 0) {
    completionCount = canEnd(context) && suffixMatches(suffix, suffixState) ? 1 : 0
    countMemo.set(cacheKey, completionCount)
    return completionCount
  }

  for (const character of listNextCharacters(context)) {
    completionCount += countCompletions(
      remainingLength - 1,
      advanceContext(context, character),
      suffix,
      advanceSuffixState(suffix, failureTable, suffixState, character),
      failureTable,
    )
  }

  countMemo.set(cacheKey, completionCount)
  return completionCount
}

function* generateNames(
  remainingLength: number,
  context: string,
  currentName: string,
  suffix: string,
  suffixState: number,
  failureTable: readonly number[],
): Generator<string> {
  if (remainingLength === 0) {
    if (canEnd(context) && suffixMatches(suffix, suffixState)) {
      yield currentName
    }

    return
  }

  for (const character of listNextCharacters(context)) {
    const nextContext = advanceContext(context, character)
    const nextSuffixState = advanceSuffixState(suffix, failureTable, suffixState, character)

    if (
      !countCompletions(remainingLength - 1, nextContext, suffix, nextSuffixState, failureTable)
    ) {
      continue
    }

    yield* generateNames(
      remainingLength - 1,
      nextContext,
      currentName + character,
      suffix,
      nextSuffixState,
      failureTable,
    )
  }
}

const DEFAULT_OUTPUT_WIDTH = 96
const ANSI_GREEN = "\u001B[32m"
const ANSI_RESET = "\u001B[0m"
const forceColor = process.env.FORCE_COLOR

const formatMeaning = (name: string) => WORDNET_DEFINITIONS.get(name) ?? ""
const colorsEnabled =
  forceColor === undefined
    ? process.env.NO_COLOR === undefined && process.stdout.isTTY
    : forceColor !== "0" && forceColor !== ""

const colorDictionaryWord = (value: string, isDictionaryWord: boolean) =>
  colorsEnabled && isDictionaryWord ? `${ANSI_GREEN}${value}${ANSI_RESET}` : value

const resolveMeaningColumnWidth = (indexColumnWidth: number, nameColumnWidth: number) => {
  const terminalWidth =
    process.stdout.isTTY && typeof process.stdout.columns === "number"
      ? process.stdout.columns
      : DEFAULT_OUTPUT_WIDTH
  const availableWidth = terminalWidth - indexColumnWidth - nameColumnWidth - 10

  return Math.max("meaning".length, availableWidth)
}

const tableBorder = (
  left: string,
  middle: string,
  right: string,
  indexColumnWidth: number,
  nameColumnWidth: number,
  meaningColumnWidth: number,
) =>
  `${left}${"─".repeat(indexColumnWidth + 2)}${middle}${"─".repeat(nameColumnWidth + 2)}${middle}${"─".repeat(meaningColumnWidth + 2)}${right}\n`

const tableLine = (
  index: string,
  name: string,
  meaning: string,
  indexColumnWidth: number,
  nameColumnWidth: number,
  meaningColumnWidth: number,
  highlightName = false,
) => {
  const paddedName = name.padEnd(nameColumnWidth)
  const formattedName = colorDictionaryWord(paddedName, highlightName)

  return `│ ${index.padEnd(indexColumnWidth)} │ ${formattedName} │ ${meaning.padEnd(meaningColumnWidth)} │\n`
}

const wrapCell = (value: string, width: number) => {
  if (!value) {
    return [""]
  }

  const lines = []
  let remaining = value.trim()

  while (remaining.length > width) {
    let splitIndex = remaining.lastIndexOf(" ", width)

    if (splitIndex <= 0) {
      splitIndex = width
    }

    lines.push(remaining.slice(0, splitIndex).trimEnd())
    remaining = remaining.slice(splitIndex).trimStart()
  }

  lines.push(remaining)
  return lines
}

const tableHeader = (
  indexColumnWidth: number,
  nameColumnWidth: number,
  meaningColumnWidth: number,
) => {
  const topBorder = tableBorder(
    "┌",
    "┬",
    "┐",
    indexColumnWidth,
    nameColumnWidth,
    meaningColumnWidth,
  )
  const separator = tableBorder(
    "├",
    "┼",
    "┤",
    indexColumnWidth,
    nameColumnWidth,
    meaningColumnWidth,
  )
  const header = tableLine(
    "",
    "name",
    "meaning",
    indexColumnWidth,
    nameColumnWidth,
    meaningColumnWidth,
  )

  return `${topBorder}${header}${separator}`
}

const tableRow = (
  index: string,
  name: string,
  meaning: string,
  indexColumnWidth: number,
  nameColumnWidth: number,
  meaningColumnWidth: number,
) =>
  wrapCell(meaning, meaningColumnWidth)
    .map((line, lineIndex) =>
      tableLine(
        lineIndex === 0 ? index : "",
        lineIndex === 0 ? name : "",
        line,
        indexColumnWidth,
        nameColumnWidth,
        meaningColumnWidth,
        meaning.length > 0 && lineIndex === 0,
      ),
    )
    .join("")

const writeNames = (targetLength: number, prefix: string, suffix: string) => {
  const failureTable = buildFailureTable(suffix)
  const prefixValidation = validatePrefix(prefix, suffix, failureTable)

  countMemo.clear()

  const totalCount = prefixValidation.valid
    ? countCompletions(
        targetLength - prefix.length,
        prefixValidation.context,
        suffix,
        prefixValidation.suffixState,
        failureTable,
      )
    : 0

  if (totalCount === 0) {
    process.stdout.write("No results found.\n")
    return
  }

  const indexColumnWidth = Math.max(1, `${Math.max(totalCount, 1)}`.length)
  const nameColumnWidth = Math.max("name".length, targetLength)
  const meaningColumnWidth = resolveMeaningColumnWidth(indexColumnWidth, nameColumnWidth)
  const bottomBorder = tableBorder(
    "└",
    "┴",
    "┘",
    indexColumnWidth,
    nameColumnWidth,
    meaningColumnWidth,
  )
  let buffer = tableHeader(indexColumnWidth, nameColumnWidth, meaningColumnWidth)
  let rowIndex = 1

  for (const name of generateNames(
    targetLength - prefix.length,
    prefixValidation.context,
    prefix,
    suffix,
    prefixValidation.suffixState,
    failureTable,
  )) {
    buffer += tableRow(
      `${rowIndex}`,
      name,
      formatMeaning(name),
      indexColumnWidth,
      nameColumnWidth,
      meaningColumnWidth,
    )
    rowIndex += 1

    if (buffer.length >= 65_536) {
      process.stdout.write(buffer)
      buffer = ""
    }
  }

  buffer += bottomBorder
  process.stdout.write(buffer)
}

const main = () => {
  let parsedArgs:
    | ReturnType<
        typeof parseArgs<{
          help: { type: "boolean"; short: "h" }
          version: { type: "boolean"; short: "v" }
          length: { type: "string"; short: "l" }
          "starts-with": { type: "string"; short: "s" }
          "ends-with": { type: "string"; short: "e" }
        }>
      >
    | undefined

  try {
    parsedArgs = parseArgs({
      options: {
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
        length: { type: "string", short: "l" },
        "starts-with": { type: "string", short: "s" },
        "ends-with": { type: "string", short: "e" },
      },
      strict: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse arguments"

    exitWithError(message)
  }

  if (parsedArgs.values.version) {
    printVersion()
    return
  }

  if (parsedArgs.values.help) {
    printHelp()
    return
  }

  const length = parseLength(parsedArgs.values.length)
  const prefix = parsePrefix(parsedArgs.values["starts-with"], length)
  const suffix = parseSuffix(parsedArgs.values["ends-with"], length)

  writeNames(length, prefix, suffix)
}

main()
