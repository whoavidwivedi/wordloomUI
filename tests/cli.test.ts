import { describe, expect, it } from "bun:test"
import { resolve } from "node:path"

import packageJson from "../package.json"

const CLI = ["node", resolve("dist/index.mjs")]

async function run(args: string[]) {
  const proc = Bun.spawn([...CLI, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  })

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])

  return {
    exitCode: await proc.exited,
    output: stdout + stderr,
  }
}

describe("starter template CLI", () => {
  it("shows help when no command is provided", async () => {
    const { output, exitCode } = await run([])

    expect(exitCode).toBe(0)
    expect(output).toContain("TypeScript CLI Starter Template")
    expect(output).toContain("hello [name]")
    expect(output).toContain("info")
  })

  it("shows the package version", async () => {
    const { output, exitCode } = await run(["--version"])

    expect(exitCode).toBe(0)
    expect(output.trim()).toBe(`${packageJson.name}@${packageJson.version}`)
  })

  it("runs the sample hello command", async () => {
    const { output, exitCode } = await run(["hello", "Codex"])

    expect(exitCode).toBe(0)
    expect(output.trim()).toBe("Hello, Codex!")
  })

  it("fails cleanly for unknown commands", async () => {
    const { output, exitCode } = await run(["unknown-command"])

    expect(exitCode).toBe(1)
    expect(output).toContain("Unknown command: unknown-command")
    expect(output).toContain('Run "starter-template --help"')
  })
})
