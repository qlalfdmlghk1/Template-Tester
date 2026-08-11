/**
 * `**핵심 문구**` 표기를 강조 구간으로 분해한다.
 *
 * AI 조사 결과는 평문 문자열로 저장되므로, 강조를 담으려면 본문 안에 표기가 필요하다.
 * 마크다운 전체를 지원하는 것이 아니라 굵게 표기 하나만 본다 — 조사 결과에서 필요한 건
 * "여기가 핵심"이라는 표시 하나뿐이고, 파서가 커질수록 AI가 뱉는 예상 밖 문법에
 * 휘둘리기 때문이다.
 *
 * 반환값을 문자열이 아니라 구간 배열로 두는 이유: 화면에서 HTML 로 렌더링하지 않고
 * React 엘리먼트로 조립하기 위해서다. AI가 만든 문자열을 innerHTML 로 넣지 않는다.
 */

export interface TextSegment {
  text: string;
  /** `**` 로 감싸여 있던 구간인가 */
  emphasized: boolean;
}

/** 여는 `**` 와 닫는 `**` 사이의 최소 구간. 줄바꿈을 넘어도 잡는다 */
const EMPHASIS_PATTERN = /\*\*([\s\S]+?)\*\*/g;

/**
 * 강조 구간과 평문 구간을 순서대로 돌려준다.
 *
 * 짝이 맞지 않는 `**` 는 강조로 보지 않고 글자 그대로 남긴다 —
 * AI가 표기를 하나 빠뜨렸을 때 문서 끝까지 파랗게 물드는 것보다,
 * 별표가 그대로 보이는 편이 원인을 알아채기 쉽다.
 */
export function parseEmphasis(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  // 전역 정규식은 lastIndex 를 들고 다니므로 호출마다 새로 만들어 쓴다
  const pattern = new RegExp(EMPHASIS_PATTERN.source, EMPHASIS_PATTERN.flags);

  let match = pattern.exec(text);
  while (match !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), emphasized: false });
    }

    segments.push({ text: match[1], emphasized: true });
    lastIndex = match.index + match[0].length;
    match = pattern.exec(text);
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), emphasized: false });
  }

  return segments;
}
