import { useState } from "react";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { AppSelect } from "@/shared/ui/atoms/AppSelect";
import { cn } from "@/shared/lib/cn";
import {
  JOB_TAGS,
  JOB_TAG_CLASSES,
  STAGE_LABELS,
  createEmptyStages,
} from "@/entities/job-application/model/stage";
import { POSTING_FIELD_LABELS } from "@/entities/job-application/model/application.type";
import { mergePostingSchedules } from "@/entities/job-application/model/posting";
import { formatSchedule } from "@/entities/job-application/model/schedule";
import type { Company } from "@/entities/company/model/company.type";
import type { JobTag } from "@/entities/job-application/model/stage";
import type { JobApplication } from "@/entities/job-application/model/application.type";
import type { PostingScheduleDraft } from "@/entities/job-application/model/postingSchedule";
import type { PostingImage } from "@/entities/job-application/api/posting.api";
import { useJobPostingExtract } from "../../model/useJobPostingExtract";
import { PostingPasteDialog } from "../PostingPasteDialog/PostingPasteDialog";

/** 폼이 모아서 넘기는 값 — 기업은 기존 선택 또는 신규 등록 둘 중 하나다 */
export interface ApplicationFormValue {
  companyId: string | null;
  newCompany: { name: string; postingUrl?: string; location?: string } | null;
  postingTitle: string;
  /** 이 공고의 링크 — 기업이 아니라 지원 건에 붙는다 */
  postingUrl?: string;
  jobTag: JobTag;
  headcount: number | null;
  notAppliedReason?: string;
  memo?: string;

  // ── 공고 추출로 채운 값 ──────────────────────────────
  jobDescription?: string;
  requirements?: string;
  preferredQualifications?: string;
  postingSources?: JobApplication["postingSources"];
  extractedAt?: Date;
  /** 공고에서 뽑은 전형 일정을 반영한 단계 맵 */
  stages?: JobApplication["stages"];
}

interface ApplicationFormDialogProps {
  /** 수정 대상. null이면 신규 등록 */
  application: JobApplication | null;
  companies: Company[];
  saving: boolean;
  /** 공고에 연도가 없을 때 채울 기준 연도 — 보고 있는 반기의 연도 */
  referenceYear: number;
  onSubmit: (value: ApplicationFormValue) => void;
  onClose: () => void;
  /** AI 키가 없을 때 등록 화면으로 보낸다 */
  onRequestApiKey?: () => void;
}

const NEW_COMPANY_VALUE = "__new__";

const inputClass =
  "w-full px-2 py-1.5 text-sm bg-surface text-text border border-border rounded-sm";

export function ApplicationFormDialog({
  application,
  companies,
  saving,
  referenceYear,
  onSubmit,
  onClose,
  onRequestApiKey,
}: ApplicationFormDialogProps) {
  const isEdit = application !== null;

  const [companyId, setCompanyId] = useState<string>(
    application?.companyId ?? companies[0]?.id ?? NEW_COMPANY_VALUE,
  );
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");

  const [postingTitle, setPostingTitle] = useState(
    application?.postingTitle ?? "",
  );
  const [postingUrl, setPostingUrl] = useState(application?.postingUrl ?? "");
  const [jobTag, setJobTag] = useState<JobTag>(application?.jobTag ?? "IT");
  // 빈 문자열은 "미정"을 뜻한다 — 공고에 "00명"처럼 인원이 없는 경우가 있다
  const [headcount, setHeadcount] = useState(
    application?.headcount === null || application?.headcount === undefined
      ? ""
      : String(application.headcount),
  );
  const [notAppliedReason, setNotAppliedReason] = useState(
    application?.notAppliedReason ?? "",
  );
  const [memo, setMemo] = useState(application?.memo ?? "");

  // ── 공고 추출 ────────────────────────────────────────
  const [jobDescription, setJobDescription] = useState(
    application?.jobDescription ?? "",
  );
  const [requirements, setRequirements] = useState(
    application?.requirements ?? "",
  );
  const [preferredQualifications, setPreferredQualifications] = useState(
    application?.preferredQualifications ?? "",
  );
  const [postingSources, setPostingSources] = useState(
    application?.postingSources,
  );
  const [extractedAt, setExtractedAt] = useState(application?.extractedAt);
  const [schedules, setSchedules] = useState<PostingScheduleDraft[]>([]);
  const [pasteOpen, setPasteOpen] = useState(false);

  const extract = useJobPostingExtract({ application, referenceYear });

  const selectedCompanyName =
    companies.find((company) => company.id === companyId)?.name ??
    companyName.trim();

  const isNewCompany = !isEdit && companyId === NEW_COMPANY_VALUE;
  const canSubmit = isNewCompany
    ? companyName.trim().length > 0
    : companyId !== NEW_COMPANY_VALUE;

  /**
   * 추출 결과를 폼에 바로 채운다.
   *
   * 상세 패널과 달리 항목별 체크 단계를 두지 않는다 — 저장 전이라 폼 자체가 미리보기이고,
   * 값이 마음에 안 들면 그 자리에서 고치거나 지우면 된다.
   * 다만 **사용자가 이미 적어 둔 칸은 덮지 않는다.**
   */
  const runExtract = async (source?: {
    pastedText?: string;
    images?: PostingImage[];
  }) => {
    const outcome = await extract.run({
      url: source ? undefined : postingUrl.trim() || undefined,
      ...source,
      companyName: selectedCompanyName || undefined,
      postingTitle: postingTitle.trim() || undefined,
    });
    if (!outcome) return;

    const { result, scheduleDrafts } = outcome;

    // 사용자가 이미 적어 둔 칸은 덮지 않는다
    if (result.jobDescription?.trim() && !jobDescription.trim()) {
      setJobDescription(result.jobDescription.trim());
    }
    if (result.requirements?.trim() && !requirements.trim()) {
      setRequirements(result.requirements.trim());
    }
    if (
      result.preferredQualifications?.trim() &&
      !preferredQualifications.trim()
    ) {
      setPreferredQualifications(result.preferredQualifications.trim());
    }

    setPostingSources(result.sources);
    setExtractedAt(new Date());
    setSchedules(scheduleDrafts);
    setPasteOpen(false);
    // 결과는 폼에 옮겼으므로 훅의 미리보기 상태는 비운다
    extract.dismiss();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      companyId: isNewCompany ? null : companyId,
      newCompany: isNewCompany
        ? {
            name: companyName.trim(),
            // 새 기업의 대표 링크는 이 공고 링크로 시작한다 — 기업 조사 화면에서도 바로 열 수 있게
            postingUrl: postingUrl.trim() || undefined,
            location: location.trim() || undefined,
          }
        : null,
      postingTitle: postingTitle.trim(),
      postingUrl: postingUrl.trim() || undefined,
      jobTag,
      headcount: headcount.trim() === "" ? null : Number(headcount),
      notAppliedReason: notAppliedReason.trim() || undefined,
      memo: memo.trim() || undefined,

      jobDescription: jobDescription.trim() || undefined,
      requirements: requirements.trim() || undefined,
      preferredQualifications: preferredQualifications.trim() || undefined,
      postingSources,
      extractedAt,
      // 일정은 단계 맵으로 옮겨 담는다. 기존 건이면 손대지 않은 칸에만 들어간다
      stages: schedules.length
        ? mergePostingSchedules(
            application ?? {
              stages: createEmptyStages() as JobApplication["stages"],
            },
            schedules,
            schedules.map((draft) => draft.stage),
          ).stages
        : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 태블릿 이상에서는 입력 필드가 답답해 보이지 않도록 폭을 넓힌다.
          모집 요강까지 붙으면서 폼이 길어졌다 — 폼 전체를 스크롤시키면 저장 버튼이 밀려
          올라가 매번 끝까지 내려야 하므로, 헤더·푸터는 고정하고 가운데만 스크롤한다 */}
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-form-title"
        className="relative flex flex-col w-full max-w-[460px] md:max-w-[600px] lg:max-w-[680px] max-h-[90vh] bg-surface border border-border rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
      >
        <header className="flex items-start justify-between gap-2 shrink-0 px-5 md:px-6 pt-5 pb-3 border-b border-border">
          <h2
            id="application-form-title"
            className="m-0 text-base font-semibold text-text"
          >
            {isEdit ? "지원 건 수정" : "지원 건 추가"}
          </h2>

          <div className="flex gap-1">
            {extract.hasApiKey ? (
              <>
                <AppButton
                  type="button"
                  variant="ghost"
                  color="primary"
                  size="xs"
                  onClick={() => setPasteOpen(true)}
                  disabled={extract.isExtracting}
                >
                  캡처·본문으로 채우기
                </AppButton>
                {postingUrl.trim() && (
                  <AppButton
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="xs"
                    onClick={() => void runExtract()}
                    disabled={extract.isExtracting}
                  >
                    {extract.isExtracting ? "불러오는 중…" : "링크로 시도"}
                  </AppButton>
                )}
              </>
            ) : (
              onRequestApiKey && (
                <AppButton
                  type="button"
                  variant="ghost"
                  color="primary"
                  size="xs"
                  onClick={onRequestApiKey}
                >
                  AI 키 등록하고 채우기
                </AppButton>
              )
            )}
          </div>
        </header>

        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto px-5 md:px-6 py-3">
          {extract.error && (
            <div className="flex items-start justify-between gap-2 p-2 bg-red-50 border border-red-200 rounded-sm">
              <p className="m-0 text-xs text-red-700">{extract.error}</p>
              {extract.errorKind === "fetchBlocked" && (
                <AppButton
                  type="button"
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

          <div>
            <label
              htmlFor="company"
              className="block mb-1 text-sm font-medium text-text"
            >
              기업
            </label>
            <AppSelect
              id="company"
              size="sm"
              fullWidth
              disabled={isEdit}
              options={[
                ...companies.map((company) => ({
                  value: company.id,
                  label: company.name,
                })),
                ...(isEdit
                  ? []
                  : [{ value: NEW_COMPANY_VALUE, label: "+ 새 기업 등록" }]),
              ]}
              value={companyId}
              onChange={(value) => setCompanyId(String(value))}
            />
            {isEdit && (
              <p className="m-0 mt-1 text-xs text-textSecondary">
                기업은 바꿀 수 없습니다. 다른 기업이면 새 지원 건으로
                추가하세요.
              </p>
            )}
          </div>

          {isNewCompany && (
            <div className="flex flex-col gap-2 p-3 bg-gray-100 rounded-sm">
              <div>
                <label
                  htmlFor="company-name"
                  className="block mb-1 text-sm font-medium text-text"
                >
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
                <label
                  htmlFor="location"
                  className="block mb-1 text-sm font-medium text-text"
                >
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
            <label
              htmlFor="posting-title"
              className="block mb-1 text-sm font-medium text-text"
            >
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

          <div>
            <label
              htmlFor="posting-url"
              className="block mb-1 text-sm font-medium text-text"
            >
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
            <p className="m-0 mt-1 text-xs text-textSecondary">
              공고마다 따로 저장됩니다. 비워두면 기업에 등록된 링크를 대신
              보여줍니다.
            </p>
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
                    tag === jobTag
                      ? "border-blue-500 ring-1 ring-blue-500"
                      : "border-transparent",
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="headcount"
              className="block mb-1 text-sm font-medium text-text"
            >
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

          {/* 미지원 사유는 등록 시점이 아니라 "지원하지 않기로" 결정한 뒤에 적는 값이라
            추가 모달에서는 감춘다. 수정에서는 남겨 둔다 — 안 그러면 이미 적힌 값을 지울 길이 없다 */}
          {isEdit && (
            <div>
              <label
                htmlFor="not-applied"
                className="block mb-1 text-sm font-medium text-text"
              >
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
          )}

          <div>
            <label
              htmlFor="application-memo"
              className="block mb-1 text-sm font-medium text-text"
            >
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

          <fieldset className="m-0 p-0 border-0">
            <legend className="mb-1 text-sm font-medium text-text">
              모집 요강{" "}
              <span className="text-xs font-normal text-textSecondary">
                (공고에서 채우거나 직접 적습니다)
              </span>
            </legend>

            <div className="flex flex-col gap-2">
              <div>
                <label
                  htmlFor="job-description"
                  className="block mb-1 text-xs text-textSecondary"
                >
                  {POSTING_FIELD_LABELS.jobDescription}
                </label>
                <textarea
                  id="job-description"
                  rows={3}
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  className={cn(inputClass, "resize-y")}
                />
              </div>
              <div>
                <label
                  htmlFor="requirements"
                  className="block mb-1 text-xs text-textSecondary"
                >
                  {POSTING_FIELD_LABELS.requirements}
                </label>
                <textarea
                  id="requirements"
                  rows={3}
                  value={requirements}
                  onChange={(event) => setRequirements(event.target.value)}
                  className={cn(inputClass, "resize-y")}
                />
              </div>
              <div>
                <label
                  htmlFor="preferred"
                  className="block mb-1 text-xs text-textSecondary"
                >
                  {POSTING_FIELD_LABELS.preferredQualifications}
                </label>
                <textarea
                  id="preferred"
                  rows={3}
                  value={preferredQualifications}
                  onChange={(event) =>
                    setPreferredQualifications(event.target.value)
                  }
                  className={cn(inputClass, "resize-y")}
                />
              </div>
            </div>

            {extractedAt && (
              <p className="m-0 mt-1 text-xs text-textSecondary">
                공고에서 채운 내용입니다. 자격 요건의 숫자는 공고 원문과
                대조하는 걸 권합니다.
              </p>
            )}
          </fieldset>

          {schedules.length > 0 && (
            <section className="flex flex-col gap-1 p-2 bg-blue-50 border border-blue-200 rounded-sm">
              <p className="m-0 text-xs font-semibold text-text">
                공고에서 찾은 전형 일정 — 저장 시 함께 반영됩니다
              </p>
              <ul className="flex flex-col gap-0.5 m-0 p-0 list-none">
                {schedules.map((draft) => (
                  <li
                    key={draft.stage}
                    className="flex flex-wrap items-baseline gap-x-2 text-xs text-text"
                  >
                    <span className="font-medium">
                      {STAGE_LABELS[draft.stage]}
                    </span>
                    <span>{formatSchedule(draft.schedule)}</span>
                    {draft.yearInferred && (
                      <span className="px-1 rounded-sm bg-yellow-100 text-yellow-800">
                        연도 추정
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setSchedules((current) =>
                          current.filter((item) => item.stage !== draft.stage),
                        )
                      }
                      className="ml-auto text-textSecondary hover:text-text underline"
                    >
                      빼기
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="flex justify-end gap-2 shrink-0 px-5 md:px-6 py-4 border-t border-border">
          <AppButton
            type="button"
            variant="outline"
            color="gray"
            size="sm"
            onClick={onClose}
          >
            취소
          </AppButton>
          <AppButton
            type="submit"
            size="sm"
            loading={saving}
            disabled={!canSubmit}
          >
            저장
          </AppButton>
        </div>
      </form>

      {pasteOpen && (
        <PostingPasteDialog
          companyName={selectedCompanyName || "이 공고"}
          postingTitle={postingTitle.trim() || undefined}
          reason={
            extract.errorKind === "fetchBlocked"
              ? (extract.error ?? undefined)
              : undefined
          }
          extracting={extract.isExtracting}
          onExtract={(source) => void runExtract(source)}
          onClose={() => setPasteOpen(false)}
        />
      )}
    </div>
  );
}
