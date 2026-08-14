import { useState } from "react";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import {
  POSTING_FIELDS,
  POSTING_FIELD_LABELS,
} from "@/entities/job-application/model/application.type";
import type {
  JobApplication,
  JobApplicationInput,
  PostingField,
} from "@/entities/job-application/model/application.type";
import type { PostingImage } from "@/entities/job-application/api/posting.api";
import {
  mergePostingDraft,
  mergePostingSchedules,
} from "@/entities/job-application/model/posting";
import { useJobPostingExtract } from "../../model/useJobPostingExtract";
import { AiFieldPreview } from "../AiFieldPreview/AiFieldPreview";
import { PostingPasteDialog } from "../PostingPasteDialog/PostingPasteDialog";
import { PostingSchedulePreview } from "../PostingSchedulePreview/PostingSchedulePreview";
import { ResearchText } from "../ResearchText/ResearchText";
import { ResearchSourceLinks } from "../ResearchSourceLinks/ResearchSourceLinks";

interface PostingSectionProps {
  application: JobApplication;
  companyName: string;
  /** 공고 링크 — 지원 건 값이 없으면 기업 대표 링크로 대체된 값이 온다 */
  postingUrl?: string;
  /** 공고에 연도가 없을 때 채울 기준 연도 — 보고 있는 반기의 연도 */
  referenceYear: number;
  onSave: (patch: Partial<JobApplicationInput>) => Promise<void>;
  /** AI 키가 없을 때 등록 화면으로 보낸다 */
  onRequestApiKey?: () => void;
}

/** 모집 요강 — 공고에서 추출한 직무 설명·자격 요건·우대사항 */
export function PostingSection({
  application,
  companyName,
  postingUrl,
  referenceYear,
  onSave,
  onRequestApiKey,
}: PostingSectionProps) {
  const extract = useJobPostingExtract({ application, referenceYear });
  const [pasteOpen, setPasteOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const currentValues = Object.fromEntries(
    POSTING_FIELDS.map((field) => [field, application[field] ?? ""]),
  ) as Record<PostingField, string>;

  const filledFields = POSTING_FIELDS.filter((field) => application[field]?.trim());

  const handleExtract = (source?: { pastedText?: string; images?: PostingImage[] }) => {
    setSaveError(null);
    void extract.run({
      // 사용자가 준 자료가 있으면 그게 정본이라 링크는 넘기지 않는다
      url: source ? undefined : postingUrl,
      ...source,
      companyName,
      postingTitle: application.postingTitle,
    });
  };

  /**
   * 초안을 저장하고 성공하면 **반영한 쪽 미리보기만** 닫는다.
   *
   * 텍스트와 일정은 반영 단위가 나뉘어 있으므로 닫는 단위도 나뉘어야 한다.
   * 한쪽을 반영했다고 다른 쪽 초안까지 지우면, 남은 항목을 반영하려고
   * 유료 AI 호출을 다시 해야 한다.
   */
  const applyPatch = async (
    patch: Partial<JobApplicationInput>,
    dismissApplied: () => void,
  ) => {
    if (Object.keys(patch).length === 0) return;

    try {
      await onSave(patch);
      dismissApplied();
      setPasteOpen(false);
    } catch {
      setSaveError("반영 내용을 저장하지 못했습니다. 다시 시도해 주세요.");
    }
  };

  const handleApply = async () => {
    if (!extract.result) return;

    await applyPatch(
      mergePostingDraft(application, extract.result, extract.selectedFields, new Date()),
      extract.dismissFields,
    );
  };

  // 일정은 텍스트와 반영 단위를 나눈다 — 연도가 미심쩍어 일정만 빼고 싶은 경우가 있다
  const handleApplySchedules = async () => {
    await applyPatch(
      mergePostingSchedules(application, extract.scheduleDrafts, extract.selectedStages),
      extract.dismissSchedules,
    );
  };

  const handlePasteExtract = (source: {
    pastedText?: string;
    images?: PostingImage[];
  }) => handleExtract(source);

  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center justify-between gap-2">
        <h3 className="m-0 text-sm font-semibold text-text">모집 요강</h3>
        <div className="flex gap-1">
          {extract.hasApiKey ? (
            <>
              {/* 캡처·붙여넣기를 앞에 둔다 — 공기업·대기업 채용 페이지는 자동 접근이
                  막혀 있어 링크로 읽히는 경우가 드물다 */}
              <AppButton
                variant="ghost"
                color="primary"
                size="xs"
                onClick={() => setPasteOpen(true)}
                disabled={extract.isExtracting}
              >
                캡처·본문으로 채우기
              </AppButton>
              {postingUrl && (
                <AppButton
                  variant="ghost"
                  color="gray"
                  size="xs"
                  onClick={() => handleExtract()}
                  disabled={extract.isExtracting}
                >
                  {extract.isExtracting ? "불러오는 중…" : "링크로 시도"}
                </AppButton>
              )}
            </>
          ) : (
            onRequestApiKey && (
              <AppButton variant="ghost" color="primary" size="xs" onClick={onRequestApiKey}>
                AI 키 등록하고 채우기
              </AppButton>
            )
          )}
        </div>
      </header>

      {extract.error && (
        <div className="flex items-start justify-between gap-2 p-2 bg-red-50 border border-red-200 rounded-sm">
          <p className="m-0 text-xs text-red-700">{extract.error}</p>
          {/* 공고를 못 읽은 실패는 붙여넣으면 해결되므로 그 자리에서 폴백을 연다 */}
          {extract.errorKind === "fetchBlocked" && (
            <AppButton
              variant="ghost"
              color="primary"
              size="xs"
              onClick={() => setPasteOpen(true)}
            >
              캡처로 채우기
            </AppButton>
          )}
        </div>
      )}

      {saveError && <p className="m-0 text-xs text-red-700">{saveError}</p>}

      {extract.result && (
        <AiFieldPreview
          heading="공고 추출 결과"
          description="반영할 항목만 골라 주세요. 자격 요건의 숫자는 공고 원문과 대조하는 걸 권합니다."
          emptyMessage="공고에서 뽑아낸 내용이 없습니다. 본문을 붙여넣어 다시 시도해 보세요."
          fields={POSTING_FIELDS}
          labels={POSTING_FIELD_LABELS}
          values={extract.result}
          sources={extract.result.sources}
          currentValues={currentValues}
          selectedFields={extract.selectedFields}
          onToggleField={extract.toggleField}
          onApply={handleApply}
          onDismiss={extract.dismiss}
        />
      )}

      <PostingSchedulePreview
        drafts={extract.scheduleDrafts}
        selectedStages={extract.selectedStages}
        onToggleStage={extract.toggleStage}
        onApply={handleApplySchedules}
      />

      {filledFields.length === 0 ? (
        <p className="m-0 text-sm text-textSecondary">
          아직 비어 있습니다. 공고 화면을 캡처해 붙여넣으면 채워집니다.
        </p>
      ) : (
        <dl className="flex flex-col gap-2 m-0">
          {filledFields.map((field) => (
            <div key={field}>
              <dt className="text-xs font-semibold text-textSecondary">
                {POSTING_FIELD_LABELS[field]}
              </dt>
              <dd className="m-0">
                <ResearchText text={application[field] ?? ""} className="text-sm text-text" />
                <ResearchSourceLinks sources={application.postingSources?.[field]} />
              </dd>
            </div>
          ))}
        </dl>
      )}

      {pasteOpen && (
        <PostingPasteDialog
          companyName={companyName}
          postingTitle={application.postingTitle}
          reason={extract.errorKind === "fetchBlocked" ? extract.error ?? undefined : undefined}
          extracting={extract.isExtracting}
          onExtract={handlePasteExtract}
          onClose={() => setPasteOpen(false)}
        />
      )}
    </section>
  );
}
