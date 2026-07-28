#!/usr/bin/env node
/**
 * Claude Code Stop / SessionEnd hook — 파일럿 세션 사용량 측정 (Node 버전)
 *
 * 매 턴 응답 완료(Stop) 및 세션 종료(SessionEnd)마다 transcript(.jsonl)를 읽어
 * 토큰/메시지 수를 집계하고, 세션당 한 파일
 * {프로젝트}/docs/pilot-metrics/sessions/{session_id}.json 에 덮어쓴다.
 * → 매 턴 누적 스냅샷을 갱신하므로 "마지막 턴 = 그 세션 최종치"가 된다.
 *   SessionEnd가 (예: VS Code 익스텐션에서) 안 쏘더라도 Stop으로 데이터가 남는다.
 *
 * - 작업 흐름을 바꾸지 않는 "관찰 전용" 훅. 무슨 일이 나도 조용히 exit 0 한다.
 * - 로그는 .claude 밖(docs/)에 쌓으므로 파일럿 종료 후 .claude를 복원해도 유지된다.
 * - node로 바로 실행되도록 순수 JS(.mjs). 빌드/추가 의존성 없음.
 *
 * ⚠️ transcript .jsonl 스키마는 Claude Code 버전마다 다를 수 있다.
 *    처음 도입할 때 실제 transcript 한 줄을 열어 아래 필드명
 *    (type / message.usage.* / content[].type)이 맞는지 한 번만 확인할 것.
 *    (측정 지표 문서의 "0단계: 로그 구조 먼저 확인"과 같은 취지)
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// "본격 작업 진입" 판정에 쓰는 코드 편집 도구들
const EDIT_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);

function readStdin() {
  try {
    // 훅 입력은 stdin(fd 0)으로 들어온다. 동기로 한 번에 읽는다.
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function getPerson(cwd) {
  try {
    const name = execSync("git config user.name", {
      cwd,
      encoding: "utf8",
      timeout: 3000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (name) return name;
  } catch {
    /* git 없음 / 저장소 아님 */
  }
  return process.env.USER || process.env.USERNAME || "unknown";
}

function collect() {
  // 1) 훅 입력(stdin JSON). 깨져도 세션이 있었다는 사실은 남긴다.
  let hookInput = {};
  try {
    hookInput = JSON.parse(readStdin());
  } catch {
    hookInput = {};
  }

  const cwd = hookInput.cwd || process.cwd();
  const sessionId = hookInput.session_id || "";
  const transcriptPath = hookInput.transcript_path || "";
  // 어떤 훅이 이 스냅샷을 마지막으로 갱신했는지 (Stop / SessionEnd) — 디버깅/구분용
  const hookEvent = hookInput.hook_event_name || "";

  // 2) 사람/프로젝트 태그 — within-person 비교의 전제
  // path.basename 이 trailing separator(Windows `\` 포함)를 처리하므로 직접 사용한다.
  // scripts/pilot-core-metrics.mjs 와 project 키 산출 방식을 일치시켜 분석 시 조인이 어긋나지 않게 한다.
  const project = path.basename(cwd) || "unknown";
  const person = getPerson(cwd);

  // 3) transcript 파싱
  const tok = { input: 0, output: 0, cache_creation: 0, cache_read: 0 };
  let userMsgs = 0; // ② 실제 내 입력만 (tool_result 이벤트 제외)
  let assistantMsgs = 0;
  let toolCalls = 0;
  let entryUserMsgs = null; // ① 첫 코드 편집을 유발한 메시지 "직전"까지의 user 메시지 수
  let seenEdit = false;
  let parsed = false;
  let linesParsed = 0; // 실제로 JSON.parse 성공한 줄 수 (자기진단)
  let usageEvents = 0; // usage 토큰 필드가 실린 assistant 이벤트 수 (자기진단)

  // transcript_path 는 외부(훅 stdin) 입력 — .jsonl 만 신뢰하고 읽어 임의 파일 read 표면을 줄인다.
  const isJsonl =
    typeof transcriptPath === "string" && transcriptPath.endsWith(".jsonl");
  if (transcriptPath && isJsonl && fs.existsSync(transcriptPath)) {
    parsed = true;
    // ⚠️ 매 턴(Stop)마다 transcript 전체를 동기로 다시 읽어 재파싱한다. 긴 세션에선
    //    비용이 누적되지만 파일럿 규모에선 수용 가능. 필요 시 처리 오프셋 캐싱(증분 파싱)으로 전환.
    const lines = fs.readFileSync(transcriptPath, "utf8").split("\n");
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      let ev;
      try {
        ev = JSON.parse(line);
      } catch {
        continue;
      }
      linesParsed += 1;

      const etype = ev.type;
      const msg = ev.message || {};
      const content = msg.content;

      if (etype === "user") {
        // tool_result 블록만 있는 user 이벤트는 실제 입력이 아니다 → 제외
        let isReal = true;
        if (Array.isArray(content)) {
          const types = new Set(
            content.filter((b) => b && typeof b === "object").map((b) => b.type),
          );
          if (types.size > 0 && [...types].every((t) => t === "tool_result")) {
            isReal = false;
          }
        }
        if (isReal) userMsgs += 1;
      } else if (etype === "assistant") {
        assistantMsgs += 1;
        const usage = msg.usage || {};
        tok.input += usage.input_tokens || 0;
        tok.output += usage.output_tokens || 0;
        tok.cache_creation += usage.cache_creation_input_tokens || 0;
        tok.cache_read += usage.cache_read_input_tokens || 0;
        if (
          usage.input_tokens != null ||
          usage.output_tokens != null ||
          usage.cache_creation_input_tokens != null ||
          usage.cache_read_input_tokens != null
        ) {
          usageEvents += 1;
        }

        if (Array.isArray(content)) {
          for (const b of content) {
            if (!b || typeof b !== "object" || b.type !== "tool_use") continue;
            toolCalls += 1;
            if (!seenEdit && EDIT_TOOLS.has(b.name)) {
              seenEdit = true;
              // 편집을 유발한 그 메시지는 제외(직전까지만) → -1
              entryUserMsgs = Math.max(userMsgs - 1, 0);
            }
          }
        }
      }
    }
  }

  const record = {
    ts: new Date().toISOString(), // 이 스냅샷을 갱신한 시각 (= 마지막 턴 시각)
    hook_event: hookEvent, // Stop | SessionEnd — 마지막으로 갱신한 훅
    person,
    project,
    session_id: sessionId,
    entry_user_msgs: entryUserMsgs, // ① 진입까지 (null = 편집 없는 세션)
    user_msgs: userMsgs, // ② 세션당 user 메시지
    assistant_msgs: assistantMsgs,
    tool_calls: toolCalls,
    tokens: tok, // ③ input/output(메인) + cache(보조/참고)
    transcript_parsed: parsed, // false면 토큰 0은 '측정 불가'로 해석
    lines_parsed: linesParsed, // 0이면 transcript_parsed=true여도 사실상 '측정 불가'
    usage_events: usageEvents, // 0이면 토큰 0은 스키마 변경 의심 (정상 0과 구분)
  };

  // session_id 가 없으면 세션을 식별할 키가 없다 → 여러 세션이 unknown.json 을 서로
  // 덮어써 데이터가 유실되므로, 차라리 기록을 생략한다(관찰 전용이라 무해).
  if (!sessionId) return;

  // 세션당 한 파일에 "덮어쓰기" → 매 턴(Stop) 누적 스냅샷 갱신, 중복 줄 없음.
  // 분석 시엔 sessions/ 안의 *.json 을 모아 읽으면 세션별 최종치 1건씩이 된다.
  const outDir = path.join(cwd, "docs", "pilot-metrics", "sessions");
  fs.mkdirSync(outDir, { recursive: true });
  const safeId = sessionId.replace(/[^A-Za-z0-9_.-]/g, "_");
  fs.writeFileSync(
    path.join(outDir, `${safeId}.json`),
    JSON.stringify(record) + "\n",
    "utf8",
  );
}

try {
  collect();
} catch {
  // 측정 훅은 무슨 일이 있어도 작업 흐름을 막지 않는다.
}
process.exit(0);
