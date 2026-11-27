// PostToolUse hook (Write|Edit): formats the edited file with the frontend's
// Prettier when the file lives under frontend/. Reads the hook payload on stdin.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

let input = ''
for await (const chunk of process.stdin) input += chunk

let payload
try {
  payload = JSON.parse(input || '{}')
} catch {
  process.exit(0)
}
const file = payload.tool_response?.filePath ?? payload.tool_input?.file_path
if (!file) process.exit(0)

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const frontendDir = path.resolve(projectDir, 'frontend')
const abs = path.resolve(file)
const rel = path.relative(frontendDir, abs)
if (rel.startsWith('..') || path.isAbsolute(rel) || rel.split(path.sep).includes('node_modules')) {
  process.exit(0)
}

const prettierBin = path.join(frontendDir, 'node_modules', 'prettier', 'bin', 'prettier.cjs')
if (!existsSync(prettierBin)) {
  console.error('format-frontend hook: Prettier is not installed in frontend/ (run `npm install -D prettier` there)')
  process.exit(1)
}

execFileSync(process.execPath, [prettierBin, '--write', '--ignore-unknown', abs], {
  cwd: frontendDir,
  stdio: ['ignore', 'ignore', 'inherit'],
})
