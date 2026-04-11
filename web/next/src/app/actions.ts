"use server"

import { createGenerationPlan } from "../../../../bin/name-generator"
import { WORDNET_DEFINITIONS } from "../../../../bin/wordnet-definitions"

export async function generateNamesAction(
  targetLength: number,
  prefix: string,
  suffix: string,
  contains: string,
  skip = 0,
  limit = 500,
) {
  try {
    const mainPlan = createGenerationPlan(targetLength, prefix, suffix, contains)

    if (mainPlan.count === 0) {
      return { count: 0, results: [] }
    }

    const results: { name: string; meaning: string }[] = []
    let skipped = 0
    let fetched = 0

    for (const name of mainPlan.names) {
      if (skipped < skip) {
        skipped++
        continue
      }

      const meaning = WORDNET_DEFINITIONS.get(name) ?? ""
      results.push({ name, meaning })
      fetched++

      if (fetched >= limit) break
    }

    return { count: mainPlan.count, results }
  } catch (error) {
    console.error("Error generating names:", error)
    return { count: 0, results: [] }
  }
}

export async function getLetterOffsetsAction(
  targetLength: number,
  prefix: string,
  suffix: string,
  contains: string,
) {
  try {
    const letters = "abcdefghijklmnopqrstuvwxyz".split("")
    const offsets: Record<string, number> = {}
    let currentOffset = 0

    // If prefix is already multi-character, A-Z jump doesn't make much sense in the UI
    // but we can still return offsets for the next possible characters if we wanted.
    // For now, let's assume this is for "jumping" the first character if no prefix is set,
    // or jumping within a prefix if suitable.

    // We iterate each possible starting character and get its count.
    for (const char of letters) {
      // If a prefix is set, we only care about letters that match the prefix
      if (prefix && !char.startsWith(prefix) && !prefix.startsWith(char)) {
        offsets[char] = -1 // Not reachable
        continue
      }

      // If prefix is length 1, we are already at that letter.
      // If prefix is empty, each letter is a branch.
      const searchPrefix = prefix || char
      if (prefix && prefix.length > 0 && char !== prefix[0]) {
        offsets[char] = -1
        continue
      }

      const plan = createGenerationPlan(targetLength, searchPrefix, suffix, contains)
      if (plan.count > 0) {
        offsets[char] = currentOffset
        currentOffset += plan.count
      } else {
        offsets[char] = -1
      }
    }

    return offsets
  } catch (error) {
    console.error("Error getting letter offsets:", error)
    return {}
  }
}
