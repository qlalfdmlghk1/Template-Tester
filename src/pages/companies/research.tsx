import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import AppFallback from "@/shared/ui/molecules/AppFallback/AppFallback";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { AppConfirmDialog } from "@/shared/ui/molecules/AppConfirmDialog";
import { useCompanyResearch } from "@/features/recruitment/model/useCompanyResearch";
import { CompanyResearchCard } from "@/features/recruitment/ui/CompanyResearchCard/CompanyResearchCard";
import { CompanyResearchDialog } from "@/features/recruitment/ui/CompanyResearchDialog/CompanyResearchDialog";

export default function CompanyResearch() {
  const page = useCompanyResearch();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title="기업 조사"
            description="채용기간이 아닐 때 미리 조사해 두는 공간입니다. 지원 여부와 관계없이 기업 단위로 모입니다."
          />
          <AppButton size="sm" className="shrink-0" onClick={page.openCreateForm}>
            기업 추가
          </AppButton>
        </div>

        {page.error ? (
          <AppFallback type="error" onAction={page.reload} />
        ) : page.isLoading ? (
          <div className="flex flex-col gap-3" role="status" aria-label="기업 조사 불러오는 중">
            <div className="h-8 w-64 bg-gray-100 rounded-md animate-pulse" />
            <div className="h-40 bg-gray-100 rounded-md animate-pulse" />
          </div>
        ) : page.totalCount === 0 ? (
          <AppFallback
            type="empty"
            title="등록된 기업이 없습니다."
            description="관심 있는 기업을 추가하거나, 지원 현황 화면에서 시트를 가져오세요."
            buttonText="기업 추가"
            buttonIcon={null}
            onAction={page.openCreateForm}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={page.keyword}
                onChange={(event) => page.setKeyword(event.target.value)}
                placeholder="기업명·직무·조사 내용 검색"
                aria-label="기업 검색"
                className="flex-1 min-w-[200px] max-w-[360px] px-3 py-1.5 text-sm bg-surface text-text border border-border rounded-sm"
              />

              <label className="flex items-center gap-1.5 text-sm text-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={page.onlyResearched}
                  onChange={(event) => page.setOnlyResearched(event.target.checked)}
                />
                조사 완료만
              </label>

              <span className="text-sm text-textSecondary">
                전체 {page.totalCount}건 · 조사 완료 {page.researchedCount}건
              </span>
            </div>

            {page.companies.length === 0 ? (
              <AppFallback
                type="empty"
                title="조건에 맞는 기업이 없습니다."
                description="검색어나 필터를 바꿔보세요."
                hideButton
              />
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {page.companies.map((company) => (
                  <CompanyResearchCard
                    key={company.id}
                    company={company}
                    onEdit={() => page.openEditForm(company)}
                    onDelete={() => page.requestDelete(company)}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {page.formTarget !== undefined && (
        <CompanyResearchDialog
          company={page.formTarget}
          saving={page.saving}
          onSubmit={page.submitForm}
          onClose={page.closeForm}
        />
      )}

      <AppConfirmDialog
        open={page.deleteTarget !== null}
        danger
        title="기업을 삭제할까요?"
        description={`"${page.deleteTarget?.name ?? ""}" 의 조사 내용이 사라집니다.\n이 기업으로 등록한 지원 건은 남지만 기업 정보가 끊깁니다.`}
        confirmText="삭제"
        loading={page.saving}
        onConfirm={page.confirmDelete}
        onCancel={page.cancelDelete}
      />
    </div>
  );
}
