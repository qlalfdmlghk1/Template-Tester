import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/shared/api/firebase";
import { stripUndefined } from "@/shared/lib/firestore";
import type { Company, CompanyInput } from "../model/company.type";

const COLLECTION = "companies";

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
        postingUrl: data.postingUrl,
        location: data.location,
        researchNote: data.researchNote,
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

    await updateDoc(
      doc(db, COLLECTION, companyId),
      stripUndefined({ ...input, updatedAt: new Date() }),
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
