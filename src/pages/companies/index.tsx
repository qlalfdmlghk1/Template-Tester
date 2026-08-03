import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import AppFallback from "@/shared/ui/molecules/AppFallback/AppFallback";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { AppConfirmDialog } from "@/shared/ui/molecules/AppConfirmDialog";
import { useRecruitmentPage } from "@/features/recruitment/model/useRecruitmentPage";
import { RecruitmentToolbar } from "@/features/recruitment/ui/RecruitmentToolbar/RecruitmentToolbar";
import { RecruitmentGrid } from "@/features/recruitment/ui/RecruitmentGrid/RecruitmentGrid";
import { RecruitmentCardList } from "@/features/recruitment/ui/RecruitmentCardList/RecruitmentCardList";
import { ApplicationDetailPanel } from "@/features/recruitment/ui/ApplicationDetailPanel/ApplicationDetailPanel";
import { ApplicationFormDialog } from "@/features/recruitment/ui/ApplicationFormDialog/ApplicationFormDialog";
import { StageEditDialog } from "@/features/recruitment/ui/StageEditDialog/StageEditDialog";
import { XlsxImportDialog } from "@/features/recruitment/ui/XlsxImportDialog/XlsxImportDialog";

export default function Companies() {
  const page = useRecruitmentPage();

  // 콜백 안에서도 좁혀진 타입을 유지하기 위해 지역 변수로 꺼낸다
  const selectedRow = page.selectedRow;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <PageHeader
          title="채용"
          description="지원 현황을 전형 단계별로 관리하고, 비채용기간에는 관심 기업을 미리 조사합니다."
          actions={
            // ml-auto 로 넓은 폭에서는 종전처럼 오른쪽 끝에 붙이고,
            // 좁은 폭에서는 flex-wrap 으로 버튼이 줄을 넘긴다.
            <div className="flex flex-wrap gap-2 ml-auto">
              {page.totalCount > 0 && (
                <AppButton variant="ghost" color="red" size="sm" onClick={page.openReset}>
                  전체 삭제
                </AppButton>
              )}
              <AppButton variant="outline" color="gray" size="sm" onClick={page.openImport}>
                시트 가져오기
              </AppButton>
              <AppButton size="sm" onClick={page.openCreateForm}>
                지원 건 추가
              </AppButton>
            </div>
          }
        />

        {page.error ? (
          <AppFallback type="error" onAction={page.reload} />
        ) : page.isLoading ? (
          <RecruitmentSkeleton />
        ) : page.isEmpty ? (
          <AppFallback
            type="empty"
            title="아직 등록된 지원 건이 없습니다."
            description="관리하던 시트를 가져오거나, 지원 건을 직접 추가해 시작하세요."
            buttonText="시트 가져오기"
            buttonIcon={null}
            onAction={page.openImport}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <RecruitmentToolbar
              halfIds={page.halfIds}
              activeHalfId={page.activeHalfId}
              onSelectHalf={page.selectHalf}
              filter={page.filter}
              onChangeFilter={page.setFilter}
              onResetFilter={page.resetFilter}
            />

            {page.rows.length === 0 ? (
              <AppFallback
                type="empty"
                title="조건에 맞는 지원 건이 없습니다."
                description="반기 선택이나 필터를 바꿔보세요."
                onAction={page.resetFilter}
              />
            ) : (
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  {/* 데스크톱: 지원 건 × 전형 그리드 */}
                  <div className="hidden lg:block">
                    <RecruitmentGrid
                      rows={page.rows}
                      passRates={page.passRates}
                      selectedApplicationId={page.selectedApplicationId}
                      onSelectRow={page.toggleRow}
                      onSelectStage={page.openStageEditor}
                    />
                  </div>

                  {/* 모바일: 임박 일정 중심 카드 목록 */}
                  <div className="lg:hidden">
                    <RecruitmentCardList rows={page.rows} onSelectRow={page.toggleRow} />
                  </div>
                </div>

                {selectedRow && (
                  <div className="lg:w-[340px] lg:shrink-0">
                    <ApplicationDetailPanel
                      row={selectedRow}
                      onClose={() => page.toggleRow(selectedRow.application.id)}
                      onSelectStage={(stageKey) =>
                        page.openStageEditor(selectedRow.application.id, stageKey)
                      }
                      onEdit={() => page.openEditForm(selectedRow.application)}
                      onDelete={() => page.requestDelete(selectedRow.application)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {page.formTarget !== undefined && (
        <ApplicationFormDialog
          application={page.formTarget}
          companies={page.companies}
          saving={page.saving}
          onSubmit={page.submitForm}
          onClose={page.closeForm}
        />
      )}

      {page.stageTarget && page.stageRow && (
        <StageEditDialog
          stageKey={page.stageTarget.stageKey}
          entry={page.stageRow.application.stages[page.stageTarget.stageKey]}
          companyName={page.stageRow.company?.name ?? "(삭제된 기업)"}
          defaultYear={page.defaultYear}
          saving={page.saving}
          onSave={page.saveStage}
          onClose={page.closeStageEditor}
        />
      )}

      {page.importOpen && (
        <XlsxImportDialog
          rows={page.xlsxImport.rows}
          researchRows={page.xlsxImport.researchRows}
          includeResearch={page.xlsxImport.includeResearch}
          onToggleResearch={page.xlsxImport.setIncludeResearch}
          selectedIds={page.xlsxImport.selectedIds}
          isReading={page.xlsxImport.isReading}
          isApplying={page.xlsxImport.isApplying}
          error={page.xlsxImport.error}
          onPickFile={page.xlsxImport.readFile}
          onToggleRow={page.xlsxImport.toggleRow}
          onToggleAll={page.xlsxImport.toggleAll}
          onApply={page.applyImport}
          onClose={page.closeImport}
        />
      )}

      <AppConfirmDialog
        open={page.resetOpen}
        danger
        title="채용 데이터를 모두 삭제할까요?"
        description={`지원 건 ${page.totalCount}건과 등록된 기업 ${page.companies.length}건이 전부 사라집니다.\n전형 진행 기록도 함께 지워지며 되돌릴 수 없습니다.`}
        confirmText="전부 삭제"
        loading={page.saving}
        onConfirm={page.confirmResetAll}
        onCancel={page.cancelReset}
      />

      <AppConfirmDialog
        open={page.deleteTarget !== null}
        danger
        title="지원 건을 삭제할까요?"
        description="전형 진행 기록도 함께 사라지며 되돌릴 수 없습니다."
        confirmText="삭제"
        loading={page.saving}
        onConfirm={page.confirmDelete}
        onCancel={page.cancelDelete}
      />
    </div>
  );
}

function RecruitmentSkeleton() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="채용 현황 불러오는 중">
      <div className="h-8 w-64 bg-gray-100 rounded-md animate-pulse" />
      <div className="h-64 bg-gray-100 rounded-md animate-pulse" />
    </div>
  );
}
