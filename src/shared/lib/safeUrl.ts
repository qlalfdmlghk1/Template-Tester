/**
 * 외부에서 들어온 URL을 링크로 쓰기 전에 거른다.
 *
 * 사용자가 올린 xlsx의 하이퍼링크나 직접 입력한 주소가 그대로 저장되므로,
 * `javascript:` · `data:` 같은 스킴이 사용자 데이터에 남을 수 있다.
 * 렌더 지점에서 허용 스킴만 통과시켜 저장형 XSS 경로를 끊는다.
 */

const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:"];

/** 링크로 써도 되는 주소면 정규화해 돌려주고, 아니면 null */
export function safeUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;

  try {
    // 상대 경로도 절대 주소로 해석해야 스킴 판정이 가능하다
    const url = new URL(value, window.location.origin);
    return ALLOWED_PROTOCOLS.includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
