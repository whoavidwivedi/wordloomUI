import { CMUDICT_CONTEXT_SIZE, CMUDICT_TRANSITIONS } from "./cmudict-model"

const startContext = "^".repeat(CMUDICT_CONTEXT_SIZE)

type PrefixValidation = {
  context: string
  suffixState: number
  valid: boolean
}

export type GenerationPlan = {
  count: number
  names: Generator<string>
}

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
      return { context: "", suffixState: 0, valid: false } satisfies PrefixValidation
    }

    context = advanceContext(context, character)
    suffixState = advanceSuffixState(suffix, failureTable, suffixState, character)
  }

  return { context, suffixState, valid: true } satisfies PrefixValidation
}

const emptyNames = function* (): Generator<string> {}

export const createGenerationPlan = (
  targetLength: number,
  prefix: string,
  suffix: string,
): GenerationPlan => {
  const failureTable = buildFailureTable(suffix)
  const prefixValidation = validatePrefix(prefix, suffix, failureTable)
  const countMemo = new Map<string, number>()

  const countCompletions = (
    remainingLength: number,
    context: string,
    suffixToMatch: string,
    suffixState: number,
  ): number => {
    const cacheKey = `${remainingLength}:${context}:${suffixState}:${suffixToMatch}`
    const cachedCount = countMemo.get(cacheKey)

    if (cachedCount !== undefined) {
      return cachedCount
    }

    let completionCount = 0

    if (remainingLength === 0) {
      completionCount = canEnd(context) && suffixMatches(suffixToMatch, suffixState) ? 1 : 0
      countMemo.set(cacheKey, completionCount)
      return completionCount
    }

    for (const character of listNextCharacters(context)) {
      completionCount += countCompletions(
        remainingLength - 1,
        advanceContext(context, character),
        suffixToMatch,
        advanceSuffixState(suffixToMatch, failureTable, suffixState, character),
      )
    }

    countMemo.set(cacheKey, completionCount)
    return completionCount
  }

  function* generateNames(
    remainingLength: number,
    context: string,
    currentName: string,
    suffixToMatch: string,
    suffixState: number,
  ): Generator<string> {
    if (remainingLength === 0) {
      if (canEnd(context) && suffixMatches(suffixToMatch, suffixState)) {
        yield currentName
      }

      return
    }

    for (const character of listNextCharacters(context)) {
      const nextContext = advanceContext(context, character)
      const nextSuffixState = advanceSuffixState(
        suffixToMatch,
        failureTable,
        suffixState,
        character,
      )

      if (!countCompletions(remainingLength - 1, nextContext, suffixToMatch, nextSuffixState)) {
        continue
      }

      yield* generateNames(
        remainingLength - 1,
        nextContext,
        currentName + character,
        suffixToMatch,
        nextSuffixState,
      )
    }
  }

  const count = prefixValidation.valid
    ? countCompletions(
        targetLength - prefix.length,
        prefixValidation.context,
        suffix,
        prefixValidation.suffixState,
      )
    : 0

  return {
    count,
    names:
      count === 0
        ? emptyNames()
        : generateNames(
            targetLength - prefix.length,
            prefixValidation.context,
            prefix,
            suffix,
            prefixValidation.suffixState,
          ),
  }
}
