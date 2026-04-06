#!/usr/bin/env node
import { printHelp, printVersion, readCliOptions } from "./cli"
import { createGenerationPlan } from "./name-generator"
import { writeNamesOutput } from "./output"

const main = () => {
  const options = readCliOptions()

  if (options.version) {
    printVersion()
    return
  }

  if (options.help) {
    printHelp()
    return
  }

  const generationPlan = createGenerationPlan(
    options.length,
    options.prefix,
    options.suffix,
    options.contains,
  )

  writeNamesOutput(generationPlan.names, generationPlan.count, options.length)
}

main()
