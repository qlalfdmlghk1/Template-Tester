import { useState } from "react";
import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import AppFallback from "@/shared/ui/molecules/AppFallback/AppFallback";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { AiKeyDialog } from "@/features/ai-key/ui/AiKeyDialog/AiKeyDialog";
import { useCompanyForm } from "../../model/useCompanyForm";
import { CompanyResearchForm } from "../CompanyResearchForm/CompanyResearchForm";

interface CompanyResearchFormPageProps {
  /** 없으면 신규 등록 */
  companyId?: string;
}

/**
 * 기업 등록·수정 화면.
 *
 * 등록과 수정이 폼·동작이 같아 한 컴포넌트로 두고, 라우트 파일에서 id 만 넘긴다.
 */
export function CompanyResearchFormPage({ companyId }: CompanyResearchFormPageProps) {
  const form = useCompanyForm(companyId);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);

  const isEdit = Boolean(companyId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* 목록·코테달력과 같은 폭 — 조사 내용을 2열로 펼치려면 넓이가 필요하다 */}
      <div className="max-w-[1400px] mx-auto px-4 py-4 sm:px-6 sm:py-6">
        {/* 수정이면 보기 화면으로, 신규면 목록으로 — 검색어·필터는 그대로 들고 간다 */}
        <AppButton
          variant="ghost"
          color="gray"
          size="sm"
          className="mb-2 -ml-2"
          onClick={form.cancel}
        >
          {isEdit ? "← 돌아가기" : "← 목록으로"}
        </AppButton>

        <PageHeader
          title={isEdit ? "기업 정보 수정" : "기업 추가"}
          description="자소서·면접에서 인용할 조사 내용을 항목별로 남겨두는 화면입니다."
        />

        {form.error ? (
          <AppFallback type="error" onAction={form.reload} />
        ) : form.isLoading ? (
          <div className="flex flex-col gap-3" role="status" aria-label="불러오는 중">
            <div className="h-8 w-64 bg-gray-100 rounded-md animate-pulse" />
            <div className="h-96 bg-gray-100 rounded-md animate-pulse" />
          </div>
        ) : form.notFound ? (
          <AppFallback
            type="empty"
            title="기업을 찾을 수 없습니다."
            description="이미 삭제됐거나 주소가 잘못됐습니다."
            buttonText="목록으로"
            buttonIcon={null}
            onAction={form.cancel}
          />
        ) : (
          <CompanyResearchForm
            company={form.company}
            saving={form.saving}
            onSubmit={form.submit}
            onCancel={form.cancel}
            onOpenKeySettings={() => setKeyDialogOpen(true)}
          />
        )}
      </div>

      {keyDialogOpen && <AiKeyDialog onClose={() => setKeyDialogOpen(false)} />}
    </div>
  );
}
