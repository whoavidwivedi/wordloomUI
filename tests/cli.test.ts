import { describe, expect, it } from "bun:test"
import { resolve } from "node:path"

import packageJson from "../package.json"

const CLI = ["node", resolve("dist/index.mjs")]

async function run(args: string[], env: Record<string, string> = {}) {
  const mergedEnv = { ...process.env, ...env }

  if (Object.hasOwn(env, "FORCE_COLOR")) {
    delete mergedEnv.NO_COLOR
  }

  const proc = Bun.spawn([...CLI, ...args], {
    env: mergedEnv,
    stdout: "pipe",
    stderr: "pipe",
  })

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])

  return {
    exitCode: await proc.exited,
    stderr,
    stdout,
  }
}

const stripAnsi = (value: string) => value.replaceAll("\u001B[32m", "").replaceAll("\u001B[0m", "")

function parseTableOutput(stdout: string) {
  const lines = stdout.trimEnd().split("\n")
  const bodyLines = lines.slice(3, -1)
  const rows = []
  let currentRow: { index: string; meaning: string; name: string } | null = null

  for (const line of bodyLines) {
    if (!line.startsWith("│")) {
      continue
    }

    const segments = line
      .slice(1, -1)
      .split("│")
      .map((segment) => stripAnsi(segment).trim())
    const [index = "", name = "", meaning = ""] = segments

    if (index) {
      if (currentRow) {
        rows.push(currentRow)
      }

      currentRow = { index, meaning, name }
      continue
    }

    if (currentRow && meaning) {
      currentRow.meaning = `${currentRow.meaning} ${meaning}`.trim()
    }
  }

  if (currentRow) {
    rows.push(currentRow)
  }

  return {
    bottomBorder: lines.at(-1) ?? "",
    header: lines[1] ?? "",
    rows,
    separator: lines[2] ?? "",
    topBorder: lines[0] ?? "",
  }
}

describe("nameforge CLI", () => {
  it("shows help when requested", async () => {
    const { stdout, stderr, exitCode } = await run(["--help"])

    expect(exitCode).toBe(0)
    expect(stderr).toBe("")
    expect(stdout).toContain("CMUdict-derived")
    expect(stdout).toContain("--starts-with <prefix>")
    expect(stdout).toContain("--ends-with <suffix>")
    expect(stdout).toContain("WordNet meanings")
    expect(stdout).toContain("usage examples are removed")
    expect(stdout).toContain("Dictionary matches are colored")
    expect(stdout).toContain("observed 5-gram transitions")
  })

  it("shows the package version", async () => {
    const { stdout, stderr, exitCode } = await run(["--version"])

    expect(exitCode).toBe(0)
    expect(stderr).toBe("")
    expect(stdout.trim()).toBe(`${packageJson.name}@${packageJson.version}`)
  })

  it("renders a console-table-style output for exact-length generation", async () => {
    const { stdout, stderr, exitCode } = await run(["--length", "4"])
    const { bottomBorder, header, rows, separator, topBorder } = parseTableOutput(stdout)

    expect(exitCode).toBe(0)
    expect(stderr).toBe("")
    expect(topBorder).toMatch(/^┌─+┬─+┬─+┐$/)
    expect(header).toContain("│ name")
    expect(header).toContain("│ meaning")
    expect(separator).toMatch(/^├─+┼─+┼─+┤$/)
    expect(bottomBorder).toMatch(/^└─+┴─+┴─+┘$/)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]?.index).toBe("1")
    expect(rows[0]?.name).toBe("aabe")
    expect(rows.at(-1)?.index).toBe(`${rows.length}`)
    expect(rows.at(-1)?.name).toBe("zysk")
    expect(rows.every(({ name }) => /^[a-z]+$/.test(name))).toBe(true)
    expect(rows.every(({ name }) => name.length === 4)).toBe(true)
    expect(rows).toHaveLength(9971)
  })

  it("defaults to length 5 when no arguments are provided", async () => {
    const { stdout, stderr, exitCode } = await run([])
    const { rows } = parseTableOutput(stdout)

    expect(exitCode).toBe(0)
    expect(stderr).toBe("")
    expect(rows[0]?.index).toBe("1")
    expect(rows[0]?.name).toBe("aaber")
    expect(rows.at(-1)?.index).toBe(`${rows.length}`)
    expect(rows.at(-1)?.name).toBe("zynda")
    expect(rows.some(({ name }) => name.startsWith("a"))).toBe(true)
    expect(rows.some(({ name }) => name.startsWith("z"))).toBe(true)
    expect(rows.every(({ name }) => name.length === 5)).toBe(true)
    expect(rows).toHaveLength(44839)
  })

  it("filters generated names by prefix", async () => {
    const { stdout, stderr, exitCode } = await run(["--starts-with", "no"])
    const { rows } = parseTableOutput(stdout)

    expect(exitCode).toBe(0)
    expect(stderr).toBe("")
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]?.index).toBe("1")
    expect(rows[0]?.name).toBe("noack")
    expect(rows.some(({ name }) => name === "nobel")).toBe(true)
    expect(rows.every(({ name }) => name.startsWith("no"))).toBe(true)
    expect(rows.every(({ name }) => name.length === 5)).toBe(true)
    expect(rows).toHaveLength(271)
  })

  it("filters generated names by suffix", async () => {
    const { stdout, stderr, exitCode } = await run(["--ends-with", "ut"])
    const { rows } = parseTableOutput(stdout)

    expect(exitCode).toBe(0)
    expect(stderr).toBe("")
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]?.index).toBe("1")
    expect(rows[0]?.name).toBe("ablut")
    expect(rows.at(-1)?.index).toBe(`${rows.length}`)
    expect(rows.at(-1)?.name).toBe("zovut")
    expect(rows.every(({ name }) => name.endsWith("ut"))).toBe(true)
    expect(rows.every(({ name }) => name.length === 5)).toBe(true)
    expect(rows).toHaveLength(71)
  })

  it("fills the meaning column for WordNet words", async () => {
    const { stdout, stderr, exitCode } = await run(["--length", "6", "--starts-with", "absent"])
    const { rows } = parseTableOutput(stdout)

    expect(exitCode).toBe(0)
    expect(stderr).toBe("")
    expect(rows).toEqual([
      {
        index: "1",
        meaning: "verb: go away or leave; adjective: not being in a specified place",
        name: "absent",
      },
    ])
  })

  it("colors dictionary words when color output is forced", async () => {
    const { stdout, stderr, exitCode } = await run(["--length", "6", "--starts-with", "absent"], {
      FORCE_COLOR: "1",
    })

    expect(exitCode).toBe(0)
    expect(stderr).toBe("")
    expect(stdout).toContain("\u001B[32mabsent\u001B[0m")
  })

  it("leaves the meaning column empty for generated non-dictionary names", async () => {
    const { stdout, stderr, exitCode } = await run(["--length", "6", "--starts-with", "noaked"])
    const { rows } = parseTableOutput(stdout)

    expect(exitCode).toBe(0)
    expect(stderr).toBe("")
    expect(rows).toEqual([{ index: "1", meaning: "", name: "noaked" }])
  })

  it("prints a no-results message when the requested prefix is not supported by the source model", async () => {
    const { stdout, stderr, exitCode } = await run(["--starts-with", "zz"])

    expect(exitCode).toBe(0)
    expect(stderr).toBe("")
    expect(stdout).toBe("No results found.\n")
  })

  it("prints a no-results message when an exact-length prefix conflicts with the suffix", async () => {
    const { stdout, stderr, exitCode } = await run([
      "--length",
      "2",
      "--starts-with",
      "no",
      "--ends-with",
      "ut",
    ])

    expect(exitCode).toBe(0)
    expect(stderr).toBe("")
    expect(stdout).toBe("No results found.\n")
  })

  it("prints a no-results message when a prefix has no valid completion at the target length", async () => {
    const { stdout, stderr, exitCode } = await run(["--starts-with", "vaib"])

    expect(exitCode).toBe(0)
    expect(stderr).toBe("")
    expect(stdout).toBe("No results found.\n")
  })

  it("rejects lengths below the supported range", async () => {
    const { stdout, stderr, exitCode } = await run(["--length", "1"])

    expect(exitCode).toBe(1)
    expect(stdout).toBe("")
    expect(stderr.trim()).toBe("--length must be an integer between 2 and 8")
  })

  it("rejects lengths above the supported range", async () => {
    const { stdout, stderr, exitCode } = await run(["--length", "9"])

    expect(exitCode).toBe(1)
    expect(stdout).toBe("")
    expect(stderr.trim()).toBe("--length must be an integer between 2 and 8")
  })
})
