import { WORDNET_DEFINITIONS } from "./wordnet-definitions"

const DEFAULT_OUTPUT_WIDTH = 96
const ANSI_GREEN = "\u001B[32m"
const ANSI_RESET = "\u001B[0m"
const forceColor = process.env.FORCE_COLOR

const colorsEnabled =
  forceColor === undefined
    ? process.env.NO_COLOR === undefined && process.stdout.isTTY
    : forceColor !== "0" && forceColor !== ""

const formatMeaning = (name: string) => WORDNET_DEFINITIONS.get(name) ?? ""

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

export const writeNamesOutput = (
  names: Iterable<string>,
  totalCount: number,
  targetLength: number,
) => {
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

  for (const name of names) {
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
