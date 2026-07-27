// calendarSettings 컬렉션 — 문서 ID = uid
//
// 연동한 GitHub 저장소 경로와 마지막 동기화 시각을 담는다.
// lastSyncedAt은 증분 동기화의 `since` 기준이 된다.

import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "@/shared/api/firebase";
import type { CalendarSettings } from "../model/solve-log.type";

const COLLECTION = "calendarSettings";

export async function getCalendarSettings(): Promise<CalendarSettings | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const snapshot = await getDoc(doc(db, COLLECTION, user.uid));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return {
    repoOwner: (data.repoOwner as string) ?? "",
    repoName: (data.repoName as string) ?? "",
    lastSyncedAt: data.lastSyncedAt ? (data.lastSyncedAt as Timestamp).toDate() : null,
  };
}

export async function saveCalendarSettings(settings: CalendarSettings): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");

  await setDoc(doc(db, COLLECTION, user.uid), {
    repoOwner: settings.repoOwner,
    repoName: settings.repoName,
    lastSyncedAt: settings.lastSyncedAt ? Timestamp.fromDate(settings.lastSyncedAt) : null,
  });
}

/**
 * `owner/repo` 문자열 파싱.
 *
 * 전체 URL을 그대로 붙여넣는 경우가 흔해서 함께 받아준다.
 * 예: `qlalfdmlghk1/Algorism_Python`, `https://github.com/qlalfdmlghk1/Algorism_Python`
 */
export function parseRepoPath(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, "");
  const segments = trimmed.replace(/\.git$/i, "").replace(/\/+$/, "").split("/");

  if (segments.length !== 2) return null;

  const [owner, repo] = segments;
  if (!owner || !repo) return null;

  return { owner, repo };
}
