#!/usr/bin/env node
/**
 * PostToolUse hook: Edit|Write 직후 변경 파일을 포맷한다 (실패해도 통과).
 *
 * 스택 중립 동작 (config 우선 → 기본 prettier):
 *   - project.config.md 의 FORMAT_COMMAND 가 있으면, 포맷 대상 확장자(web+native)에 대해
 *     `FORMAT_COMMAND <파일경로>` 를 실행한다 (예: `ktlint --format`, `swiftformat`).
 *   - FORMAT_COMMAND 가 없으면 web 확장자는 prettier 로 포맷, 네이티브 확장자는 skip.
 *
 * settings의 PostToolUse 커맨드는 파일 경로를 환경변수로 받기 어렵고
 * 셸 리다이렉트(`2>/dev/null || true`)는 Windows 기본 셸에서 깨지므로,
 * 다른 훅들처럼 stdin PostToolUse JSON에서 file_path를 파싱한다.
 *
 * stdin JSON:
 *   { "tool_name": "Edit"|"Write", "tool_input": { "file_path": "..." }, "cwd": "..." }
 *
 * 종료 코드: 항상 0 (통과). 포매터 미설치/포맷 실패는 조용히 무시.
 */

import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}

const filePath = input?.tool_input?.file_path ?? ''
if (!filePath) process.exit(0)

const cwd = input?.cwd ?? process.cwd()

// prettier가 다루는 web 확장자
const isWeb = /\.(ts|tsx|js|jsx|mjs|cjs|vue|json|jsonc|scss|css|less|md|ya?ml|html)$/i.test(filePath)
// 네이티브 확장자 (전용 포매터 필요 — FORMAT_COMMAND 설정 시에만 포맷)
const isNative = /\.(kt|kts|java|swift|m|mm|h)$/i.test(filePath)

if (!isWeb && !isNative) process.exit(0)

// ⚠️ SYNC: readConfigValue 는 check-commit-typecheck.js 의 동일 함수와 바이트 단위로 동일 유지할 것
// (config 파싱 계약 — 한쪽만 고치면 훅마다 config를 다르게 읽는 무증상 버그가 난다).
/** project.config.md 에서 `- KEY: value` 한 줄을 읽어 값(뒤 `#` 주석 제거)을 반환. 없으면 ''. */
function readConfigValue(key) {
  const configPath = `${cwd}/.claude/project.config.md`
  if (!existsSync(configPath)) return ''
  try {
    const text = readFileSync(configPath, 'utf8')
    const re = new RegExp(`^\\s*-\\s*${key}\\s*:\\s*(.*)$`, 'm')
    const m = text.match(re)
    if (!m) return ''
    // 뒤따르는 " # 주석" 및 값 없이 주석만 있는 경우(`- KEY: # ...`)를 제거 → 빈 값 처리
    return m[1].replace(/(^|\s)#.*$/, '').trim()
  } catch {
    return ''
  }
}

const formatCmd = readConfigValue('FORMAT_COMMAND')

try {
  if (formatCmd) {
    // FORMAT_COMMAND 를 공백으로 분해해 [bin, ...args] 로 실행 (shell 미사용 → 주입 안전).
    const parts = formatCmd.split(/\s+/).filter(Boolean)
    const [bin, ...args] = parts
    if (bin) execFileSync(bin, [...args, filePath], { stdio: 'ignore', cwd })
  } else if (isWeb) {
    // 기본 경로: web 확장자는 prettier.
    // execFileSync(shell 미사용)라 경로에 공백/특수문자가 있어도 주입 위험 없음.
    // --no-install: 미설치 시 네트워크에서 임의 패키지를 받아 실행하지 않음.
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
    execFileSync(npx, ['--no-install', 'prettier', '--write', '--', filePath], { stdio: 'ignore', cwd })
  }
  // isNative 인데 FORMAT_COMMAND 없음 → 포맷 스킵 (best-effort)
} catch {
  // 포매터 미설치 또는 포맷 실패 — 통과 (포맷은 선택적 보조)
}

process.exit(0)
