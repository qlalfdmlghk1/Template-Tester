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
import { stripUndefined, toUpdatePayload } from "@/shared/lib/firestore";
import type { Company, CompanyInput, ResearchSource } from "../model/company.type";

const COLLECTION = "companies";

/**
 * 출처는 처음에 URL 문자열 배열로 저장했다가 제목을 함께 담는 형태로 바뀌었다.
 * 이미 저장된 문서를 마이그레이션하지 않고 읽는 쪽에서 흡수한다.
 */
function toResearchSources(
  raw: unknown,
): Company["researchSources"] | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const entries = Object.entries(raw as Record<string, unknown>).map(
    ([field, value]) => [
      field,
      (Array.isArray(value) ? value : [])
        .map((item) =>
          typeof item === "string" ? { url: item } : (item as ResearchSource),
        )
        .filter((item) => typeof item?.url === "string"),
    ],
  );

  return Object.fromEntries(entries) as Company["researchSources"];
}

function requireUser() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }
  return user;
}

export async function createCompany(input: CompanyInput): Promise<string> {
  try {
    const user = requireUser();

    const docRef = await addDoc(
      collection(db, COLLECTION),
      stripUndefined({
        ...input,
        userId: user.uid,
        createdAt: new Date(),
      }),
    );

    return docRef.id;
  } catch (error) {
    console.error("기업 저장 실패:", error);
    throw error;
  }
}

export async function getCompanies(): Promise<Company[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const snapshot = await getDocs(
      query(collection(db, COLLECTION), where("userId", "==", user.uid)),
    );

    const companies = snapshot.docs.map((snap) => {
      const data = snap.data();
      return {
        id: snap.id,
        userId: data.userId,
        name: data.name ?? "",
        categories: Array.isArray(data.categories) ? data.categories : undefined,
        postingUrl: data.postingUrl,
        location: data.location,
        salary: typeof data.salary === "number" ? data.salary : undefined,
        targetJob: data.targetJob,
        jobDescription: data.jobDescription,
        requirements: data.requirements,
        researchNote: data.researchNote,
        preference: data.preference,
        talentProfile: data.talentProfile,
        businessSummary: data.businessSummary,
        recentIssues: data.recentIssues,
        researchSources: toResearchSources(data.researchSources),
        researchedAt: data.researchedAt?.toDate(),
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate(),
      } satisfies Company;
    });

    return companies.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("기업 조회 실패:", error);
    throw error;
  }
}

export async function updateCompany(
  companyId: string,
  input: Partial<CompanyInput>,
): Promise<void> {
  try {
    requireUser();

    // 비운 값을 실제로 지우려면 undefined 를 걷어내지 말고 deleteField 로 보내야 한다
    await updateDoc(
      doc(db, COLLECTION, companyId),
      toUpdatePayload({ ...input, updatedAt: new Date() }),
    );
  } catch (error) {
    console.error("기업 수정 실패:", error);
    throw error;
  }
}

export async function deleteCompany(companyId: string): Promise<void> {
  try {
    requireUser();
    await deleteDoc(doc(db, COLLECTION, companyId));
  } catch (error) {
    console.error("기업 삭제 실패:", error);
    throw error;
  }
}

/** 한 배치에 담을 수 있는 쓰기 상한 (Firestore 제한) */
const BATCH_LIMIT = 500;

/** 내 기업을 모두 삭제하고 삭제 건수를 돌려준다 */
export async function deleteAllCompanies(): Promise<number> {
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
    console.error("기업 일괄 삭제 실패:", error);
    throw error;
  }
}
