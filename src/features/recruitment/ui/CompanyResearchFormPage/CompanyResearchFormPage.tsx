import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import AppFallback from "@/shared/ui/molecules/AppFallback/AppFallback";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { AppConfirmDialog } from "@/shared/ui/molecules/AppConfirmDialog";
import { AiKeyDialog } from "@/features/ai-key/ui/AiKeyDialog/AiKeyDialog";
import { useCompanyForm } from "../../model/useCompanyForm";
import { useCompanyDelete } from "../../model/useCompanyDelete";
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
  const navigate = useNavigate();
  // 지운 기업의 보기 화면으로는 돌아갈 수 없으니 목록으로 보낸다
  const remove = useCompanyDelete(() => navigate("/companies/research"));
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
          actions={
            // 삭제는 목록이 아니라 여기에 둔다 — 되돌릴 수 없는 동작이라 한 단계 안쪽에서
            form.company ? (
              <AppButton
                variant="outline"
                color="red"
                size="sm"
                className="ml-auto shrink-0"
                onClick={() => form.company && remove.request(form.company)}
              >
                기업 삭제
              </AppButton>
            ) : undefined
          }
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

      <AppConfirmDialog
        open={remove.target !== null}
        danger
        title="기업을 삭제할까요?"
        description={`"${remove.target?.name ?? ""}" 의 조사 내용이 사라집니다.`}
        confirmText="삭제"
        loading={remove.deleting}
        onConfirm={remove.confirm}
        onCancel={remove.cancel}
      >
        {remove.applicationCount > 0 && (
          <label className="flex items-start gap-2 px-3 py-2 bg-gray-100 rounded-sm cursor-pointer">
            <input
              type="checkbox"
              checked={remove.cascade}
              onChange={(event) => remove.setCascade(event.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm text-text">
              이 기업의 지원 건 {remove.applicationCount}건도 함께 삭제
              <span className="block text-xs text-textSecondary">
                체크하지 않으면 지원 건은 남지만 기업 정보가 끊겨 「(삭제된 기업)」으로
                표시됩니다.
              </span>
            </span>
          </label>
        )}
      </AppConfirmDialog>
    </div>
  );
}
