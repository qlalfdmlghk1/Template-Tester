import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/shared/api/firebase";
import { stripUndefined } from "@/shared/lib/firestore";
import { STAGE_KEYS, createEmptyStages } from "../model/stage";
import type { StageKey } from "../model/stage";
import type {
  JobApplication,
  JobApplicationInput,
  StageEntry,
} from "../model/application.type";

const COLLECTION = "jobApplications";

function requireUser() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }
  return user;
}

/**
 * 저장된 단계 맵을 복원한다.
 * 단계 세트가 늘어난 뒤 읽은 옛 문서에 빈 칸이 생기지 않도록 기본값으로 메운다.
 */
function restoreStages(raw: unknown): Record<StageKey, StageEntry> {
  const stages = createEmptyStages() as Record<StageKey, StageEntry>;
  if (typeof raw !== "object" || raw === null) return stages;

  const source = raw as Record<string, Partial<StageEntry>>;
  for (const key of STAGE_KEYS) {
    const entry = source[key];
    if (!entry) continue;

    stages[key] = {
      status: entry.status ?? "PENDING",
      schedule: entry.schedule ?? null,
      memo: entry.memo,
    };
  }

  return stages;
}

export async function createApplication(input: JobApplicationInput): Promise<string> {
  try {
    const user = requireUser();

    const docRef = await addDoc(
      collection(db, COLLECTION),
      stripUndefined({
        ...input,
        stages: input.stages ?? createEmptyStages(),
        userId: user.uid,
        createdAt: new Date(),
      }),
    );

    return docRef.id;
  } catch (error) {
    console.error("지원 건 저장 실패:", error);
    throw error;
  }
}

export async function getApplications(): Promise<JobApplication[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const snapshot = await getDocs(
      query(collection(db, COLLECTION), where("userId", "==", user.uid)),
    );

    return snapshot.docs.map((snap) => {
      const data = snap.data();
      return {
        id: snap.id,
        userId: data.userId,
        companyId: data.companyId ?? "",
        postingTitle: data.postingTitle ?? "",
        jobTag: data.jobTag ?? "IT",
        headcount: typeof data.headcount === "number" ? data.headcount : null,
        notAppliedReason: data.notAppliedReason,
        memo: data.memo,
        stages: restoreStages(data.stages),
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate(),
      } satisfies JobApplication;
    });
  } catch (error) {
    console.error("지원 건 조회 실패:", error);
    throw error;
  }
}

export async function updateApplication(
  applicationId: string,
  input: Partial<JobApplicationInput>,
): Promise<void> {
  try {
    requireUser();

    await updateDoc(
      doc(db, COLLECTION, applicationId),
      stripUndefined({ ...input, updatedAt: new Date() }),
    );
  } catch (error) {
    console.error("지원 건 수정 실패:", error);
    throw error;
  }
}

/**
 * 단계 한 칸만 갱신한다.
 * 그리드 셀 편집은 즉시 저장이라 문서 전체를 덮어쓰지 않고 해당 필드만 건드린다.
 */
export async function updateApplicationStage(
  applicationId: string,
  stageKey: StageKey,
  entry: StageEntry,
): Promise<void> {
  try {
    requireUser();

    await updateDoc(doc(db, COLLECTION, applicationId), {
      [`stages.${stageKey}`]: stripUndefined({ ...entry }),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("전형 단계 수정 실패:", error);
    throw error;
  }
}

export async function deleteApplication(applicationId: string): Promise<void> {
  try {
    requireUser();
    await deleteDoc(doc(db, COLLECTION, applicationId));
  } catch (error) {
    console.error("지원 건 삭제 실패:", error);
    throw error;
  }
}

/** 한 배치에 담을 수 있는 쓰기 상한 (Firestore 제한) */
const BATCH_LIMIT = 500;

/** 내 지원 건을 모두 삭제하고 삭제 건수를 돌려준다 */
export async function deleteAllApplications(): Promise<number> {
  try {
    const user = requireUser();

    const snapshot = await getDocs(
      query(collection(db, COLLECTION), where("userId", "==", user.uid)),
    );

    for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      snapshot.docs.slice(i, i + BATCH_LIMIT).forEach((snap) => batch.delete(snap.ref));
      await batch.commit();
    }

    return snapshot.size;
  } catch (error) {
    console.error("지원 건 일괄 삭제 실패:", error);
    throw error;
  }
}
