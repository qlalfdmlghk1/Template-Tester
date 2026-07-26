export interface NavMenuItem {
  path: string;
  label: string;
  /** 페이지가 아직 준비 중인 항목 */
  comingSoon?: boolean;
}

/** 하위 항목 없이 바로 이동하는 단일 메뉴 */
export interface NavMenuLink {
  id: string;
  label: string;
  path: string;
  comingSoon?: boolean;
}

/** 하위 항목을 드롭다운으로 노출하는 그룹 메뉴 */
export interface NavMenuGroup {
  id: string;
  label: string;
  items: NavMenuItem[];
}

export type NavMenuEntry = NavMenuLink | NavMenuGroup;

export const navMenu: NavMenuEntry[] = [
  {
    id: "coding-test",
    label: "코딩테스트",
    items: [
      { path: "/templates", label: "템플릿" },
      { path: "/wrong-notes", label: "오답노트" },
    ],
  },
  {
    id: "theory",
    label: "이론 공부",
    items: [
      { path: "/theory", label: "개념 학습", comingSoon: true },
      { path: "/daily", label: "데일리 학습" },
    ],
  },
  {
    id: "company",
    label: "기업 조사",
    path: "/companies",
    comingSoon: true,
  },
];

export function isNavMenuGroup(entry: NavMenuEntry): entry is NavMenuGroup {
  return "items" in entry;
}

export function isPathActive(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function isEntryActive(entry: NavMenuEntry, pathname: string): boolean {
  return getEntryItems(entry).some((item) => isPathActive(pathname, item.path));
}

/**
 * 펼침 패널에 그릴 항목 목록.
 * 하위가 없는 단일 메뉴는 자기 자신을 유일한 항목으로 노출해
 * 모든 그룹이 같은 형태의 컬럼을 갖도록 한다.
 */
export function getEntryItems(entry: NavMenuEntry): NavMenuItem[] {
  if (isNavMenuGroup(entry)) {
    return entry.items;
  }
  return [{ path: entry.path, label: entry.label, comingSoon: entry.comingSoon }];
}
