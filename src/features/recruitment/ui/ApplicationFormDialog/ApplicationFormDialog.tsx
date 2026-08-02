import { useState } from "react";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { AppSelect } from "@/shared/ui/atoms/AppSelect";
import { cn } from "@/shared/lib/cn";
import { JOB_TAGS, JOB_TAG_CLASSES } from "@/entities/job-application/model/stage";
import type { Company } from "@/entities/company/model/company.type";
import type { JobTag } from "@/entities/job-application/model/stage";
import type { JobApplication } from "@/entities/job-application/model/application.type";

/** 폼이 모아서 넘기는 값 — 기업은 기존 선택 또는 신규 등록 둘 중 하나다 */
export interface ApplicationFormValue {
  companyId: string | null;
  newCompany: { name: string; postingUrl?: string; location?: string } | null;
  postingTitle: string;
  jobTag: JobTag;
  headcount: number | null;
  notAppliedReason?: string;
  memo?: string;
}

interface ApplicationFormDialogProps {
  /** 수정 대상. null이면 신규 등록 */
  application: JobApplication | null;
  companies: Company[];
  saving: boolean;
  onSubmit: (value: ApplicationFormValue) => void;
  onClose: () => void;
}

const NEW_COMPANY_VALUE = "__new__";

const inputClass =
  "w-full px-2 py-1.5 text-sm bg-surface text-text border border-border rounded-sm";

export function ApplicationFormDialog({
  application,
  companies,
  saving,
  onSubmit,
  onClose,
}: ApplicationFormDialogProps) {
  const isEdit = application !== null;

  const [companyId, setCompanyId] = useState<string>(
    application?.companyId ?? companies[0]?.id ?? NEW_COMPANY_VALUE,
  );
  const [companyName, setCompanyName] = useState("");
  const [postingUrl, setPostingUrl] = useState("");
  const [location, setLocation] = useState("");

  const [postingTitle, setPostingTitle] = useState(application?.postingTitle ?? "");
  const [jobTag, setJobTag] = useState<JobTag>(application?.jobTag ?? "IT");
  // 빈 문자열은 "미정"을 뜻한다 — 공고에 "00명"처럼 인원이 없는 경우가 있다
  const [headcount, setHeadcount] = useState(
    application?.headcount === null || application?.headcount === undefined
      ? ""
      : String(application.headcount),
  );
  const [notAppliedReason, setNotAppliedReason] = useState(application?.notAppliedReason ?? "");
  const [memo, setMemo] = useState(application?.memo ?? "");

  const isNewCompany = !isEdit && companyId === NEW_COMPANY_VALUE;
  const canSubmit = isNewCompany ? companyName.trim().length > 0 : companyId !== NEW_COMPANY_VALUE;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      companyId: isNewCompany ? null : companyId,
      newCompany: isNewCompany
        ? {
            name: companyName.trim(),
            postingUrl: postingUrl.trim() || undefined,
            location: location.trim() || undefined,
          }
        : null,
      postingTitle: postingTitle.trim(),
      jobTag,
      headcount: headcount.trim() === "" ? null : Number(headcount),
      notAppliedReason: notAppliedReason.trim() || undefined,
      memo: memo.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* 태블릿 이상에서는 입력 필드가 답답해 보이지 않도록 폭을 넓힌다 */}
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-form-title"
        className="relative flex flex-col gap-3 w-full max-w-[460px] md:max-w-[600px] lg:max-w-[680px] max-h-[90vh] overflow-y-auto p-5 md:p-6 bg-surface border border-border rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
      >
        <h2 id="application-form-title" className="m-0 text-base font-semibold text-text">
          {isEdit ? "지원 건 수정" : "지원 건 추가"}
        </h2>

        <div>
          <label htmlFor="company" className="block mb-1 text-sm font-medium text-text">
            기업
          </label>
          <AppSelect
            id="company"
            size="sm"
            fullWidth
            disabled={isEdit}
            options={[
              ...companies.map((company) => ({ value: company.id, label: company.name })),
              ...(isEdit ? [] : [{ value: NEW_COMPANY_VALUE, label: "+ 새 기업 등록" }]),
            ]}
            value={companyId}
            onChange={(value) => setCompanyId(String(value))}
          />
          {isEdit && (
            <p className="m-0 mt-1 text-xs text-textSecondary">
              기업은 바꿀 수 없습니다. 다른 기업이면 새 지원 건으로 추가하세요.
            </p>
          )}
        </div>

        {isNewCompany && (
          <div className="flex flex-col gap-2 p-3 bg-gray-100 rounded-sm">
            <div>
              <label htmlFor="company-name" className="block mb-1 text-sm font-medium text-text">
                기업명 <span className="text-red-600">*</span>
              </label>
              <input
                id="company-name"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="예: 현대오토에버"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="posting-url" className="block mb-1 text-sm font-medium text-text">
                공고 링크
              </label>
              <input
                id="posting-url"
                type="url"
                value={postingUrl}
                onChange={(event) => setPostingUrl(event.target.value)}
                placeholder="https://"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="location" className="block mb-1 text-sm font-medium text-text">
                위치
              </label>
              <input
                id="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="예: 판교"
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="posting-title" className="block mb-1 text-sm font-medium text-text">
            공고명
          </label>
          <input
            id="posting-title"
            value={postingTitle}
            onChange={(event) => setPostingTitle(event.target.value)}
            placeholder="같은 기업에 여러 번 지원할 때 구분합니다 (예: 2026 상반기 수시)"
            className={inputClass}
          />
        </div>

        <fieldset className="m-0 p-0 border-0">
          <legend className="mb-1 text-sm font-medium text-text">직무</legend>
          <div className="flex gap-1.5">
            {JOB_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setJobTag(tag)}
                aria-pressed={tag === jobTag}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors",
                  JOB_TAG_CLASSES[tag],
                  tag === jobTag ? "border-blue-500 ring-1 ring-blue-500" : "border-transparent",
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="headcount" className="block mb-1 text-sm font-medium text-text">
            채용 인원
          </label>
          <input
            id="headcount"
            type="number"
            min={0}
            value={headcount}
            onChange={(event) => setHeadcount(event.target.value)}
            placeholder="비워두면 미정으로 표시됩니다"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="not-applied" className="block mb-1 text-sm font-medium text-text">
            미지원 사유
          </label>
          <input
            id="not-applied"
            value={notAppliedReason}
            onChange={(event) => setNotAppliedReason(event.target.value)}
            placeholder="입력하면 미지원으로 분류되어 합격률에서 제외됩니다"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="application-memo" className="block mb-1 text-sm font-medium text-text">
            메모
          </label>
          <textarea
            id="application-memo"
            rows={2}
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            className={cn(inputClass, "resize-y")}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <AppButton type="button" variant="outline" color="gray" size="sm" onClick={onClose}>
            취소
          </AppButton>
          <AppButton type="submit" size="sm" loading={saving} disabled={!canSubmit}>
            저장
          </AppButton>
        </div>
      </form>
    </div>
  );
}
