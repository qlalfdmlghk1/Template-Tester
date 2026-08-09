/**
 * 연봉 표기.
 *
 * 만원 단위 정수 하나로만 보관한다. 공고 문구("회사 내규에 따름", "협의 후 결정")를
 * 그대로 담지 않고, 비워 두면 "미정"으로 읽는다.
 */

/** 입력 문자열 → 만원 단위 정수. 비었거나 숫자가 아니면 미정(undefined) */
export function parseSalary(raw: string): number | undefined {
  // 사용자가 "4,000" 처럼 적을 수 있으므로 숫자만 남긴다
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return undefined;

  const value = Number(digits);
  // 0만원은 미정과 구분되지 않으므로 값으로 받지 않는다
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

/** 만원 단위 정수 → 화면 표기. 미정이면 표기할 것이 없다 */
export function formatSalary(salary?: number): string | undefined {
  if (!salary) return undefined;

  return `${salary.toLocaleString("ko-KR")}만원`;
}
