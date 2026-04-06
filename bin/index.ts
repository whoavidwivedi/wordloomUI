#!/usr/bin/env node
import { parseArgs } from "node:util"

import packageJson from "../package.json"

const commandName = Object.keys(packageJson.bin)[0] ?? "starter-template"

const helpMessage = `
TypeScript CLI Starter Template

A minimal Bun + TypeScript starter you can copy and shape into a real CLI.

Usage:
  ${commandName} <command> [options]

Commands:
  hello [name]    Print a sample greeting
  info            Show basic runtime information
  help            Show this help message

Options:
  -h, --help      Show help
  -v, --version   Show version
`.trim()

const printVersion = () => {
  console.log(`${packageJson.name}@${packageJson.version}`)
}

const printHelp = () => {
  console.log(helpMessage)
}

const runHello = (name?: string) => {
  console.log(`Hello, ${name?.trim() || "world"}!`)
}

const runInfo = () => {
  const runtime = "Bun" in globalThis ? "bun" : "node"

  console.log(
    [
      `name: ${packageJson.name}`,
      `version: ${packageJson.version}`,
      `runtime: ${runtime}`,
      `platform: ${process.platform}`,
      `cwd: ${process.cwd()}`,
    ].join("\n"),
  )
}

const main = () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  })

  if (values.version) {
    printVersion()
    return
  }

  if (values.help || !positionals.length) {
    printHelp()
    return
  }

  const [command, arg] = positionals

  switch (command) {
    case "hello": {
      runHello(arg)
      return
    }
    case "info": {
      runInfo()
      return
    }
    case "help": {
      printHelp()
      return
    }
    default: {
      console.error(`Unknown command: ${command}`)
      console.error(`Run "${commandName} --help" to see the starter commands.`)
      process.exit(1)
    }
  }
}

main()
