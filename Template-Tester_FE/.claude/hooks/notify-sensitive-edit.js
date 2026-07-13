#!/usr/bin/env node
/**
 * PreToolUse hook: 민감 파일 편집 시 경고 알림 (차단 X, 통과 O).
 *
 * `defaultMode: "acceptEdits"`로 편집 프롬프트가 자동 수락되므로,
 * `.env*`, `*secret*`, `*token*`, `*.pem`, `*.key` 같은 민감 파일을
 * 편집할 때 사용자가 인지할 수 있도록 stderr에 경고 한 줄을 띄운다.
 *
 * stdin으로 PreToolUse JSON 입력:
 *   { "tool_name": "Edit"|"Write", "tool_input": { "file_path": "..." }, ... }
 *
 * 종료 코드: 항상 0 (통과). 매칭되어도 차단하지 않음 — 알림 전용.
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
const basename = normalized.split('/').pop() ?? ''

// .env.example 은 공개 템플릿이므로 제외
const isEnvExample = /^\.env\.example$/.test(basename)

// 디자인 토큰 자산(theme/tokens/, design-tokens.json, _tokens.scss 등)은 비밀값이 아니므로 제외
// — 디자인 시스템 작업에서 매 편집마다 경고가 뜨면 진짜 경고가 묻힌다 (오탐 방지)
// ⚠️ 단, 인증 토큰 파일(token.ts, src/auth/tokens/ 등)은 계속 경고해야 하므로 좁게 매칭:
//    디렉토리는 디자인 컨텍스트(theme/design*/style*) 동반 시에만, basename은
//    스타일 확장자(_tokens.scss 등) 또는 design- prefix가 있을 때만 제외한다.
const isDesignToken =
  /(^|\/)(theme|design[^/]*|styles?)\/tokens?\//i.test(normalized) ||
  /(^|\/)design-tokens?(\/|\.)/i.test(normalized) ||
  /^_?tokens?\.(scss|css|less)$/i.test(basename)

const sensitivePatterns = [
  { test: () => !isEnvExample && /^\.env(\.|$)/.test(basename), label: '.env' },
  { test: () => /secret/i.test(basename), label: 'secret' },
  { test: () => !isDesignToken && /token/i.test(basename), label: 'token' },
  { test: () => /\.pem$/i.test(basename), label: '*.pem' },
  { test: () => /\.key$/i.test(basename), label: '*.key' },
  { test: () => /credentials?/i.test(basename), label: 'credential' },
  // 네이티브(Android·iOS) 키·서명·인증서
  { test: () => /\.jks$/i.test(basename), label: '*.jks (Android keystore)' },
  { test: () => /\.keystore$/i.test(basename), label: '*.keystore' },
  { test: () => /\.mobileprovision$/i.test(basename), label: '*.mobileprovision' },
  { test: () => /\.p12$/i.test(basename), label: '*.p12' },
  { test: () => /\.p8$/i.test(basename), label: '*.p8' },
  { test: () => /^GoogleService-Info\.plist$/i.test(basename), label: 'GoogleService-Info.plist' },
]

const matched = sensitivePatterns.find((p) => p.test())

if (matched) {
  process.stderr.write(
    `⚠️  민감 파일 편집 중: ${normalized} (${matched.label} 패턴)\n` +
      `    acceptEdits 모드라 자동 수락됩니다 — 의도한 변경이 맞는지 확인하세요.\n`,
  )
}

process.exit(0)
