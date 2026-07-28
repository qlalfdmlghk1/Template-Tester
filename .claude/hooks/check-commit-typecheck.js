#!/usr/bin/env node
/**
 * PreToolUse hook: `git commit` 실행 직전에 커밋 게이트(타입체크·린트 등)를 강제.
 *
 * 스택 중립 동작 (config 우선 → 감지 → skip):
 *   1) project.config.md 의 COMMIT_GATE_COMMAND 가 있으면 그 명령을 실행 (스택 무관).
 *      - Android `./gradlew ktlintCheck`, iOS `swiftlint lint --strict`, NestJS `npm run typecheck` 등.
 *   2) 없으면 TYPECHECK_COMMAND(레거시) 를 폴백으로 사용.
 *   3) 둘 다 없으면 스택 감지:
 *      - Node + package.json 에 type-check 스크립트 → `npm run type-check`.
 *      - Node 인데 type-check 스크립트 없음 → info 후 skip (레거시/문서 repo).
 *      - package.json 은 없지만 앱 스택(Gradle·Xcode·Nest) 신호가 있으면 → ⚠️ 눈에 보이는 경고.
 *        (skip 은 "검증 0"을 조용히 통과시켜 가장 위험 — 경고로 드러낸다. 차단은 안 함.)
 *      - 앱 신호도 없는 문서/스크립트 repo → 조용히 skip.
 *
 * stdin PreToolUse JSON:
 *   { "tool_name": "Bash", "tool_input": { "command": "git commit ..." }, "cwd": "..." }
 *
 * 종료 코드:
 *   0  통과 / skip / 경고(비차단) / git commit 무관
 *   2  게이트 실패 → Claude 는 stderr 를 받고 수정 시도
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0) // 파싱 실패 시 조용히 통과 (방어)
}

const command = input?.tool_input?.command ?? ''

// `git commit` 매칭 — `git log`, `git commit-tree` 등은 통과
// 앞에 공백/세미콜론/&&/|/( 가 와도 매칭. 환경변수 prefix 허용.
const isGitCommit = /(?:^|[\s;&|(])git\s+commit(?:\s|$)/.test(command)
if (!isGitCommit) {
  process.exit(0)
}

// hook input의 cwd 우선, 없으면 process.cwd()
const cwd = input?.cwd ?? process.cwd()

// ⚠️ SYNC: readConfigValue 는 format-edited.js 의 동일 함수와 바이트 단위로 동일 유지할 것
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

/** 앱 스택 감지 키가 repo 루트에 있는지 확인 → 감지된 스택 라벨 배열. */
function detectAppStacks() {
  const has = (f) => existsSync(`${cwd}/${f}`)
  let entries = []
  try {
    entries = readdirSync(cwd)
  } catch {
    entries = []
  }
  const hasExt = (ext) => entries.some((e) => e.endsWith(ext))

  const stacks = []
  if (
    has('build.gradle') ||
    has('build.gradle.kts') ||
    has('settings.gradle') ||
    has('settings.gradle.kts') ||
    has('libs.versions.toml')
  ) {
    stacks.push('Android(Gradle)')
  }
  if (hasExt('.xcodeproj') || hasExt('.xcworkspace') || has('Package.swift') || has('Podfile')) {
    stacks.push('iOS(Xcode/SPM)')
  }
  if (has('nest-cli.json')) {
    stacks.push('NestJS')
  } else if (has('package.json')) {
    try {
      const pkg = JSON.parse(readFileSync(`${cwd}/package.json`, 'utf8'))
      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }
      if (deps['@nestjs/core']) stacks.push('NestJS')
    } catch {
      /* ignore */
    }
  }
  return stacks
}

/** 게이트 명령 실행. 성공 0, 실패 2. */
function runGate(cmd, label) {
  process.stderr.write(`⏳ Pre-commit 게이트 실행: ${label} (${cmd})\n`)
  try {
    execSync(cmd, { stdio: 'inherit', cwd })
    process.exit(0)
  } catch {
    console.error(`\n❌ Pre-commit 게이트 실패 (${cmd}) — 커밋이 차단됐습니다.`)
    console.error('   에러를 수정한 후 다시 커밋하세요.')
    process.exit(2)
  }
}

// 1) COMMIT_GATE_COMMAND (스택 무관, 최우선)
const gateCmd = readConfigValue('COMMIT_GATE_COMMAND')
if (gateCmd) {
  runGate(gateCmd, 'COMMIT_GATE_COMMAND')
}

// 2) TYPECHECK_COMMAND (레거시 폴백)
const typecheckCmd = readConfigValue('TYPECHECK_COMMAND')
if (typecheckCmd) {
  runGate(typecheckCmd, 'TYPECHECK_COMMAND')
}

// 3) 명령 미설정 → 스택 감지
const appStacks = detectAppStacks()

/** 앱 스택인데 게이트가 없을 때: 조용히 skip하지 않고 경고(비차단). */
function warnNoGate() {
  process.stderr.write(
    `⚠️  ${appStacks.join(', ')} 스택으로 보이는데 커밋 게이트가 설정되지 않았습니다 — 검증 없이 커밋됩니다.\n` +
      '    project.config.md 의 COMMIT_GATE_COMMAND 를 설정하세요 ' +
      '(예: Android `./gradlew ktlintCheck`, iOS `swiftlint lint --strict`).\n',
  )
}

const pkgPath = `${cwd}/package.json`
if (existsSync(pkgPath)) {
  // Node: type-check 스크립트 있으면 실행
  let hasTypeCheck = false
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    hasTypeCheck = Boolean(pkg?.scripts?.['type-check'])
  } catch {
    process.exit(0) // package.json 파싱 실패 시 조용히 통과 (방어)
  }
  if (hasTypeCheck) {
    runGate('npm run type-check', 'npm run type-check')
  }
  // type-check 스크립트 없음: 네이티브 등 앱 스택이 함께 있으면(예: KMP·Capacitor 혼재)
  // info skip이 아니라 경고 — package.json 존재만으로 "검증 0"을 조용히 통과시키지 않는다.
  if (appStacks.length > 0) {
    warnNoGate()
  } else {
    process.stderr.write(
      'ℹ️  package.json에 "type-check" 스크립트가 없어 pre-commit 게이트를 건너뜁니다. ' +
        '(필요하면 project.config.md 의 COMMIT_GATE_COMMAND 설정)\n',
    )
  }
  process.exit(0)
}

// package.json 이 없는 경우 — 앱 스택이면 침묵 통과 대신 경고
if (appStacks.length > 0) {
  warnNoGate()
  process.exit(0)
}

// 앱 신호 없는 문서/스크립트 repo — 조용히 skip
process.exit(0)
