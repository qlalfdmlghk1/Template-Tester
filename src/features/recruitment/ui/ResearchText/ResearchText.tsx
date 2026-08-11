import { cn } from "@/shared/lib/cn";
import { parseEmphasis } from "@/shared/lib/emphasis";

interface ResearchTextProps {
  text: string;
  /** 바깥 요소에 붙일 클래스 — 글자 크기·줄간격은 쓰는 쪽 맥락을 따른다 */
  className?: string;
}

/**
 * 조사 내용 본문.
 *
 * `**핵심 문구**` 로 표시된 부분만 서비스 색으로 강조한다. AI 조사 결과는 길어서
 * 통으로 읽기 어려운데, 자소서에 바로 옮길 문구가 눈에 먼저 들어오게 하려는 것이다.
 *
 * 사용자가 직접 적은 항목(직무 설명·메모 등)에도 그대로 쓴다 — 표기가 없으면
 * 평문과 똑같이 그려지고, 직접 `**` 를 적으면 같은 방식으로 강조된다.
 *
 * 문자열을 조각내 React 엘리먼트로 조립한다. AI가 만든 값이므로 HTML 로 렌더링하지 않는다.
 */
export function ResearchText({ text, className }: ResearchTextProps) {
  const segments = parseEmphasis(text);

  // p 가 아니라 block span 이다 — 미리보기에서는 label > span 안쪽에 들어가는데,
  // 거기에 p 를 넣으면 문단 태그가 인라인 요소 안에 놓여 마크업이 깨진다.
  return (
    <span className={cn("block m-0 whitespace-pre-wrap break-words", className)}>
      {segments.map((segment, index) =>
        segment.emphasized ? (
          // 조각 자체가 key 로 쓸 만한 식별자가 없다. 같은 문구가 반복될 수 있어
          // 텍스트를 key 로 쓰면 중복되므로 위치를 함께 붙인다.
          <strong key={`${index}-${segment.text}`} className="font-semibold text-primary">
            {segment.text}
          </strong>
        ) : (
          <span key={`${index}-${segment.text}`}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
