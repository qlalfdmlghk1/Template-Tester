#!/usr/bin/env node
/**
 * PreToolUse hook: tests/e2e/** 작성 시 안티패턴 경고 (차단 X, 통과 O).
 *
 * ⚠️ 웹(Playwright) 전용 — 경로(tests/e2e/) + Playwright 패턴(.waitForTimeout/.locator)에만
 *    매칭되므로 네이티브(Espresso/XCUITest)·서버(supertest) 스택에서는 자연히 무동작(no-op)한다.
 *
 * E2E 안티패턴 후보를 stderr 경고로 띄운다 (block 아님 — 저작 흐름 방해 X).
 *   - page.waitForTimeout(...)      : 고정 대기 → web-first assertion 으로 대체
 *   - page.locator('<CSS/XPath>')   : 구조 의존 셀렉터 → getByRole/Label/Text/TestId
 *
 * stdin 으로 PreToolUse JSON:
 *   { "tool_name": "Edit"|"Write", "tool_input": { "file_path": "...", "content"|"new_string": "..." } }
 *
 * 종료 코드: 항상 0 (통과). 알림 전용.
 */

import { readFileSync } from 'node:fs'

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}

const filePath = input?.tool_input?.file_path ?? ''
const normalized = filePath.replace(/\\/g, '/')

// tests/e2e 하위 파일에만 적용
if (!normalized.includes('tests/e2e/')) {
  process.exit(0)
}

// Write 는 content, Edit 는 new_string 에 신규 코드가 담긴다
const code = input?.tool_input?.content ?? input?.tool_input?.new_string ?? ''

const findings = []

if (/\.waitForTimeout\s*\(/.test(code)) {
  findings.push('waitForTimeout() — 고정 대기 금지. expect(locator).toBeVisible() 등 web-first assertion 으로 대체')
}

// page.locator / locator 체인에 CSS/XPath 가 들어간 경우 (id/class/태그/xpath 시작)
if (/\.locator\s*\(\s*['"`](\s*\/\/|[.#]|[a-z]+[\s>.[])/i.test(code)) {
  findings.push("locator('<CSS/XPath>') — 구조 의존 셀렉터 금지. getByRole/getByLabel/getByText/getByTestId 사용")
}

if (findings.length > 0) {
  process.stderr.write(
    `⚠️  E2E 안티패턴 감지: ${normalized}\n` +
      findings.map((f) => `    - ${f}`).join('\n') +
      `\n    (경고일 뿐 차단 아님)\n`,
  )
}

process.exit(0)
