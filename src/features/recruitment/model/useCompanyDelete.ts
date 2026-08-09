import { useCallback, useMemo, useState } from "react";
import { useToast } from "@/shared/ui/molecules/AppToast";
import { useCompanies } from "@/entities/company/model/useCompanies";
import { useApplications } from "@/entities/job-application/model/useApplications";
import { deleteApplicationsByCompany } from "@/entities/job-application/api/application.api";
import type { Company } from "@/entities/company/model/company.type";

/**
 * 기업 삭제.
 *
 * 목록 카드에서는 뺐다 — 읽기·수정 옆에 파괴적인 버튼이 붙어 있으면 잘못 누르기 쉽다.
 * 편집 화면까지 들어온 뒤에만 지울 수 있게 한다.
 *
 * 딸린 지원 건을 함께 지울지는 매번 새로 고르게 한다.
 */
export function useCompanyDelete(onDeleted: () => void) {
  const { removeCompany } = useCompanies();
  // 기업을 지울 때 딸린 지원 건이 몇 건인지 보여주기 위해 함께 읽는다
  const { applications, reload: reloadApplications } = useApplications();
  const { showToast } = useToast();

  const [target, setTarget] = useState<Company | null>(null);
  const [cascade, setCascade] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /** 삭제하려는 기업에 걸린 지원 건 수 */
  const applicationCount = useMemo(
    () =>
      target
        ? applications.filter((application) => application.companyId === target.id).length
        : 0,
    [target, applications],
  );

  const request = useCallback((company: Company) => {
    setTarget(company);
    setCascade(false);
  }, []);

  const cancel = useCallback(() => setTarget(null), []);

  const confirm = useCallback(async () => {
    if (!target) return;

    setDeleting(true);
    try {
      // 지원 건을 먼저 지운다 — 기업이 먼저 사라지면 참조가 끊긴 지원 건이 남는다
      let removedApplications = 0;
      if (cascade) {
        removedApplications = await deleteApplicationsByCompany(target.id);
      }

      await removeCompany(target.id);
      if (removedApplications > 0) await reloadApplications();

      setTarget(null);
      showToast(
        removedApplications > 0
          ? `기업과 지원 건 ${removedApplications}건을 삭제했습니다.`
          : "기업을 삭제했습니다.",
      );
      onDeleted();
    } catch (cause) {
      console.error("기업 삭제 실패:", cause);
      showToast("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      setDeleting(false);
    }
  }, [target, cascade, removeCompany, reloadApplications, showToast, onDeleted]);

  return {
    target,
    applicationCount,
    cascade,
    setCascade,
    deleting,
    request,
    cancel,
    confirm,
  };
}
