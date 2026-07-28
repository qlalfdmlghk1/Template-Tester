#!/usr/bin/env node
/**
 * PreToolUse hook: `gh pr create` 직전에 CHANGELOG `[Unreleased]` 갱신 여부 점검 (경고 전용, 차단 X).
 *
 * Keep a Changelog 를 운영하는 저장소에서 PR 만들 때 CHANGELOG 갱신을 깜빡하는 것을 막는 리마인더.
 *
 * ⚠️ self-adapting: 루트에 `CHANGELOG.md` 가 없는 프로젝트(대부분의 앱)에서는 즉시 통과한다.
 * 그래서 표준 배포물을 적용한 다른 프로젝트에는 영향이 없다.
 * (`check-commit-typecheck.js` 가 type-check 스크립트 없으면 통과하는 것과 동일한 원칙.)
 *
 * stdin PreToolUse JSON:
 *   { "tool_name": "Bash", "tool_input": { "command": "gh pr create ..." }, "cwd": "..." }
 *
 * 종료 코드: 항상 0 (경고 전용 — 흐름을 막지 않음).
 */

import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}

const command = input?.tool_input?.command ?? ''

// `gh pr create` 매칭 (앞에 공백/세미콜론/&&/|/( 허용)
const isPrCreate = /(?:^|[\s;&|(])gh\s+pr\s+create(?:\s|$)/.test(command)
if (!isPrCreate) process.exit(0)

const cwd = input?.cwd ?? process.cwd()

// CHANGELOG 를 운영하지 않는 프로젝트는 통과 — 배포물이 일반 프로젝트에 영향 주지 않도록
if (!existsSync(`${cwd}/CHANGELOG.md`)) process.exit(0)

// 대상 브랜치 추출 (--target-branch). 없으면 dev → main 순으로 시도.
const m = command.match(/--target-branch[=\s]+"?([^"\s]+)/)
const candidates = m ? [`origin/${m[1]}`, m[1]] : ['origin/dev', 'origin/main', 'dev', 'main']

function changedFiles(base) {
  try {
    // execFileSync(셸 미경유) — 명령 문자열에서 추출한 base에 셸 메타문자가 섞여도 주입 불가
    return execFileSync('git', ['diff', `${base}...HEAD`, '--name-only'], {
      cwd,
      encoding: 'utf8',
      timeout: 10000,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return null
  }
}

let files = null
for (const base of candidates) {
  files = changedFiles(base)
  if (files !== null) break
}

// diff 계산 실패 시 조용히 통과 (경고 전용이라 오탐으로 흐름 방해 X)
if (files === null) process.exit(0)

const touched = files.split('\n').some((f) => /(^|\/)CHANGELOG\.md$/.test(f.trim()))
if (!touched) {
  process.stderr.write(
    '⚠️  이 브랜치 변경에 CHANGELOG.md 가 없습니다 — `## [Unreleased]` 에 항목을 추가했는지 확인하세요.\n' +
      '    (경고일 뿐 차단 아님. 변경이 정말 이력에 남길 필요 없으면 무시하세요.)\n',
  )
}

process.exit(0)
