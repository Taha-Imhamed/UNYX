import { existsSync } from "node:fs"
import { spawnSync } from "node:child_process"
import path from "node:path"

const rootDir = process.cwd()
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm"

function runNpm(args, cwd) {
  const result = spawnSync(npmCmd, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function ensureInstall(label, cwd, sentinel) {
  const target = path.join(cwd, sentinel)
  if (existsSync(target)) {
    return
  }

  console.log(`[bootstrap] Installing ${label} dependencies...`)
  const args = ["install"]
  if (label === "frontend") {
    args.push("--legacy-peer-deps")
  }
  runNpm(args, cwd)
}

ensureInstall("root", rootDir, path.join("node_modules", ".bin", process.platform === "win32" ? "concurrently.cmd" : "concurrently"))
ensureInstall("backend", path.join(rootDir, "backend"), "node_modules")
ensureInstall("frontend", path.join(rootDir, "frontend"), "node_modules")
