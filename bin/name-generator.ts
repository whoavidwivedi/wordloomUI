import { CMUDICT_CONTEXT_SIZE, CMUDICT_TRANSITIONS } from "./cmudict-model"

const startContext = "^".repeat(CMUDICT_CONTEXT_SIZE)

type PrefixValidation = {
  containsMatched: boolean
  containsState: number
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
    let candidateLength = failureTable[index - 1] ?? 0

    while (candidateLength > 0 && pattern[index] !== pattern[candidateLength]) {
      candidateLength = failureTable[candidateLength - 1] ?? 0
    }

    if (pattern[index] === pattern[candidateLength]) {
      candidateLength += 1
    }

    failureTable[index] = candidateLength
  }

  return failureTable
}

const advancePatternState = (
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
    nextState = failureTable[nextState - 1] ?? 0
  }

  if (character === pattern[nextState]) {
    nextState += 1
  }

  return nextState
}

const suffixMatches = (suffix: string, suffixState: number) =>
  !suffix || suffixState === suffix.length

const containsMatches = (contains: string, containsMatched: boolean) => !contains || containsMatched

const advanceContainsProgress = (
  contains: string,
  failureTable: readonly number[],
  containsMatched: boolean,
  containsState: number,
  character: string,
) => {
  if (!contains || containsMatched) {
    return { matched: containsMatched || !contains, state: 0 }
  }

  const nextState = advancePatternState(contains, failureTable, containsState, character)

  return nextState === contains.length
    ? { matched: true, state: 0 }
    : { matched: false, state: nextState }
}

const validatePrefix = (
  prefix: string,
  suffix: string,
  suffixFailureTable: readonly number[],
  contains: string,
  containsFailureTable: readonly number[],
) => {
  let context = startContext
  let containsMatched = contains.length === 0
  let containsState = 0
  let suffixState = 0

  for (const character of prefix) {
    if (!listNextCharacters(context).includes(character)) {
      return {
        containsMatched: false,
        containsState: 0,
        context: "",
        suffixState: 0,
        valid: false,
      } satisfies PrefixValidation
    }

    context = advanceContext(context, character)
    suffixState = advancePatternState(suffix, suffixFailureTable, suffixState, character)
    const nextContainsProgress = advanceContainsProgress(
      contains,
      containsFailureTable,
      containsMatched,
      containsState,
      character,
    )
    containsMatched = nextContainsProgress.matched
    containsState = nextContainsProgress.state
  }

  return {
    containsMatched,
    containsState,
    context,
    suffixState,
    valid: true,
  } satisfies PrefixValidation
}

const emptyNames = function* (): Generator<string> {}

export const createGenerationPlan = (
  targetLength: number,
  prefix: string,
  suffix: string,
  contains: string,
): GenerationPlan => {
  const suffixFailureTable = buildFailureTable(suffix)
  const containsFailureTable = buildFailureTable(contains)
  const prefixValidation = validatePrefix(
    prefix,
    suffix,
    suffixFailureTable,
    contains,
    containsFailureTable,
  )
  const countMemo = new Map<string, number>()

  const countCompletions = (
    remainingLength: number,
    context: string,
    suffixState: number,
    containsState: number,
    containsMatched: boolean,
  ): number => {
    const cacheKey = `${remainingLength}:${context}:${suffixState}:${containsState}:${containsMatched ? 1 : 0}`
    const cachedCount = countMemo.get(cacheKey)

    if (cachedCount !== undefined) {
      return cachedCount
    }

    let completionCount = 0

    if (remainingLength === 0) {
      completionCount =
        canEnd(context) &&
        suffixMatches(suffix, suffixState) &&
        containsMatches(contains, containsMatched)
          ? 1
          : 0
      countMemo.set(cacheKey, completionCount)
      return completionCount
    }

    for (const character of listNextCharacters(context)) {
      const nextContainsProgress = advanceContainsProgress(
        contains,
        containsFailureTable,
        containsMatched,
        containsState,
        character,
      )
      completionCount += countCompletions(
        remainingLength - 1,
        advanceContext(context, character),
        advancePatternState(suffix, suffixFailureTable, suffixState, character),
        nextContainsProgress.state,
        nextContainsProgress.matched,
      )
    }

    countMemo.set(cacheKey, completionCount)
    return completionCount
  }

  function* generateNames(
    remainingLength: number,
    context: string,
    currentName: string,
    suffixState: number,
    containsState: number,
    containsMatched: boolean,
  ): Generator<string> {
    if (remainingLength === 0) {
      if (
        canEnd(context) &&
        suffixMatches(suffix, suffixState) &&
        containsMatches(contains, containsMatched)
      ) {
        yield currentName
      }

      return
    }

    for (const character of listNextCharacters(context)) {
      const nextContext = advanceContext(context, character)
      const nextSuffixState = advancePatternState(
        suffix,
        suffixFailureTable,
        suffixState,
        character,
      )
      const nextContainsProgress = advanceContainsProgress(
        contains,
        containsFailureTable,
        containsMatched,
        containsState,
        character,
      )

      if (
        !countCompletions(
          remainingLength - 1,
          nextContext,
          nextSuffixState,
          nextContainsProgress.state,
          nextContainsProgress.matched,
        )
      ) {
        continue
      }

      yield* generateNames(
        remainingLength - 1,
        nextContext,
        currentName + character,
        nextSuffixState,
        nextContainsProgress.state,
        nextContainsProgress.matched,
      )
    }
  }

  const count = prefixValidation.valid
    ? countCompletions(
        targetLength - prefix.length,
        prefixValidation.context,
        prefixValidation.suffixState,
        prefixValidation.containsState,
        prefixValidation.containsMatched,
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
            prefixValidation.suffixState,
            prefixValidation.containsState,
            prefixValidation.containsMatched,
          ),
  }
}
