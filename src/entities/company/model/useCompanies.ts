import { useCallback, useEffect, useState } from "react";
import {
  createCompany,
  deleteCompany,
  getCompanies,
  updateCompany,
} from "../api/company.api";
import type { Company, CompanyInput } from "./company.type";

/** 기업 목록 관리 (Firestore `companies`) */
export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCompanies(await getCompanies());
    } catch (cause) {
      console.error("기업 목록 조회 실패:", cause);
      setError(cause instanceof Error ? cause : new Error("기업 목록을 불러오지 못했습니다."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addCompany = useCallback(
    async (input: CompanyInput): Promise<string> => {
      const id = await createCompany(input);
      await load();
      return id;
    },
    [load],
  );

  const editCompany = useCallback(
    async (companyId: string, input: Partial<CompanyInput>): Promise<void> => {
      await updateCompany(companyId, input);
      await load();
    },
    [load],
  );

  const removeCompany = useCallback(
    async (companyId: string): Promise<void> => {
      await deleteCompany(companyId);
      await load();
    },
    [load],
  );

  return {
    companies,
    isLoading,
    error,
    addCompany,
    editCompany,
    removeCompany,
    reload: load,
  };
}
