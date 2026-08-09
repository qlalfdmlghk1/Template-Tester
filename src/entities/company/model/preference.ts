/**
 * 지망 등급 기준 정렬.
 *
 * 목록의 목적이 "어디에 힘을 쏟을지 고르는 것"이므로 가고 싶은 곳이 위로 온다.
 * 등급을 안 매긴 기업은 판단을 미룬 상태라 D 뒤에 둔다 — 아직 안 정한 것과
 * 안 갈 것을 섞지 않는다.
 */

import { COMPANY_PREFERENCES } from "./company.type";
import type { Company } from "./company.type";

/** 등급이 없으면 맨 뒤 */
const UNRANKED_ORDER = COMPANY_PREFERENCES.length;

export function preferenceOrder(company: Company): number {
  if (!company.preference) return UNRANKED_ORDER;

  const index = COMPANY_PREFERENCES.indexOf(company.preference);
  // 저장된 값이 알 수 없는 등급이면 미지정과 같이 뒤로 보낸다
  return index === -1 ? UNRANKED_ORDER : index;
}

/** 등급 → 기업명 순으로 정렬한 새 배열 */
export function sortByPreference(companies: Company[]): Company[] {
  return [...companies].sort((a, b) => {
    const diff = preferenceOrder(a) - preferenceOrder(b);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
}
