import { useState } from "react";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { cn } from "@/shared/lib/cn";
import {
  COMPANY_CATEGORIES,
  COMPANY_CATEGORY_CLASSES,
  COMPANY_CATEGORY_LABELS,
} from "@/entities/company/model/company.type";
import type {
  AiResearchField,
  Company,
  CompanyCategory,
  CompanyInput,
} from "@/entities/company/model/company.type";
import { useCompanyAiResearch } from "../../model/useCompanyAiResearch";
import { AiResearchPreview } from "../AiResearchPreview/AiResearchPreview";

interface CompanyResearchDialogProps {
  /** 수정 대상. null이면 신규 등록 */
  company: Company | null;
  saving: boolean;
  onSubmit: (input: CompanyInput) => void;
  onClose: () => void;
  /** API 키 설정 화면 열기 — 키가 없을 때 안내에서 호출 */
  onOpenKeySettings: () => void;
}

const inputClass =
  "w-full px-2 py-1.5 text-sm bg-surface text-text border border-border rounded-sm";

export function CompanyResearchDialog({
  company,
  saving,
  onSubmit,
  onClose,
  onOpenKeySettings,
}: CompanyResearchDialogProps) {
  const [name, setName] = useState(company?.name ?? "");
  const [categories, setCategories] = useState<CompanyCategory[]>(company?.categories ?? []);
  const [targetJob, setTargetJob] = useState(company?.targetJob ?? "");
  const [postingUrl, setPostingUrl] = useState(company?.postingUrl ?? "");
  const [location, setLocation] = useState(company?.location ?? "");
  const [jobDescription, setJobDescription] = useState(company?.jobDescription ?? "");
  const [requirements, setRequirements] = useState(company?.requirements ?? "");
  const [researchNote, setResearchNote] = useState(company?.researchNote ?? "");
  const [talentProfile, setTalentProfile] = useState(company?.talentProfile ?? "");
  const [businessSummary, setBusinessSummary] = useState(company?.businessSummary ?? "");
  const [recentIssues, setRecentIssues] = useState(company?.recentIssues ?? "");
  /** AI가 채운 항목의 출처 — 반영한 항목만 남긴다 */
  const [researchSources, setResearchSources] = useState(company?.researchSources);
  const [researchedAt, setResearchedAt] = useState(company?.researchedAt);

  const ai = useCompanyAiResearch();

  const canSubmit = name.trim().length > 0;
  // 기업명이 없으면 조사할 대상이 없다
  const canResearch = ai.hasApiKey && canSubmit && !ai.isResearching;

  const aiFieldSetters: Record<AiResearchField, (value: string) => void> = {
    talentProfile: setTalentProfile,
    businessSummary: setBusinessSummary,
    recentIssues: setRecentIssues,
  };

  const toggleCategory = (category: CompanyCategory) => {
    setCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const handleResearch = () => {
    void ai.run({
      name: name.trim(),
      targetJob: targetJob.trim() || undefined,
      location: location.trim() || undefined,
      postingUrl: postingUrl.trim() || undefined,
    });
  };

  /** 사용자가 고른 항목만 폼에 반영한다 — 나머지는 손대지 않는다 */
  const handleApplyResearch = () => {
    if (!ai.result) return;

    const nextSources = { ...researchSources };

    ai.selectedFields.forEach((field) => {
      const value = ai.result?.[field];
      if (!value) return;

      aiFieldSetters[field](value);
      nextSources[field] = ai.result?.sources[field];
    });

    setResearchSources(nextSources);
    setResearchedAt(new Date());
    ai.dismiss();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      name: name.trim(),
      categories: categories.length > 0 ? categories : undefined,
      targetJob: targetJob.trim() || undefined,
      postingUrl: postingUrl.trim() || undefined,
      location: location.trim() || undefined,
      jobDescription: jobDescription.trim() || undefined,
      requirements: requirements.trim() || undefined,
      researchNote: researchNote.trim() || undefined,
      talentProfile: talentProfile.trim() || undefined,
      businessSummary: businessSummary.trim() || undefined,
      recentIssues: recentIssues.trim() || undefined,
      researchSources,
      researchedAt,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-research-title"
        className="relative flex flex-col gap-3 w-full max-w-[460px] md:max-w-[640px] lg:max-w-[720px] max-h-[90vh] overflow-y-auto p-5 md:p-6 bg-surface border border-border rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
      >
        <h2 id="company-research-title" className="m-0 text-base font-semibold text-text">
          {company ? "기업 정보 수정" : "기업 추가"}
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="research-name" className="block mb-1 text-sm font-medium text-text">
              기업명 <span className="text-red-600">*</span>
            </label>
            <input
              id="research-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 카카오페이"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="research-job" className="block mb-1 text-sm font-medium text-text">
              관심 직무
            </label>
            <input
              id="research-job"
              value={targetJob}
              onChange={(event) => setTargetJob(event.target.value)}
              placeholder="예: 프론트엔드 개발자"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="research-url" className="block mb-1 text-sm font-medium text-text">
              공고 링크
            </label>
            <input
              id="research-url"
              type="url"
              value={postingUrl}
              onChange={(event) => setPostingUrl(event.target.value)}
              placeholder="https://"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="research-location" className="block mb-1 text-sm font-medium text-text">
              위치
            </label>
            <input
              id="research-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="예: 판교"
              className={inputClass}
            />
          </div>
        </div>

        <fieldset className="m-0 p-0 border-0">
          <legend className="mb-1 text-sm font-medium text-text">
            분류 <span className="font-normal text-textSecondary">(여러 개 선택 가능)</span>
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {COMPANY_CATEGORIES.map((category) => {
              const selected = categories.includes(category);

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  aria-pressed={selected}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors",
                    selected
                      ? cn(COMPANY_CATEGORY_CLASSES[category], "border-blue-500 ring-1 ring-blue-500")
                      : "bg-surface text-textSecondary border-border hover:border-gray-400",
                  )}
                >
                  {COMPANY_CATEGORY_LABELS[category]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="research-desc" className="block mb-1 text-sm font-medium text-text">
            직무 설명
          </label>
          <textarea
            id="research-desc"
            rows={5}
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="공고의 직무 소개를 붙여넣어 두면 나중에 비교하기 좋습니다."
            className={cn(inputClass, "resize-y")}
          />
        </div>

        <div>
          <label htmlFor="research-req" className="block mb-1 text-sm font-medium text-text">
            자격 요건
          </label>
          <textarea
            id="research-req"
            rows={5}
            value={requirements}
            onChange={(event) => setRequirements(event.target.value)}
            placeholder="요구 기술·경력 조건 등"
            className={cn(inputClass, "resize-y")}
          />
        </div>

        <section className="flex flex-col gap-3 pt-1 border-t border-border">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="m-0 text-sm font-semibold text-text">기업 조사</h3>
              <p className="m-0 mt-0.5 text-xs text-textSecondary">
                자소서·면접에서 바로 인용할 항목입니다.
              </p>
            </div>
            <AppButton
              type="button"
              variant="outline"
              size="xs"
              onClick={handleResearch}
              loading={ai.isResearching}
              disabled={!canResearch}
            >
              AI로 조사
            </AppButton>
          </header>

          {!ai.hasApiKey && (
            <p className="m-0 p-2 text-xs text-textSecondary bg-background border border-border rounded-sm">
              AI 조사를 쓰려면 본인 Anthropic API 키가 필요합니다.{" "}
              <button
                type="button"
                onClick={onOpenKeySettings}
                className="text-blue-600 underline"
              >
                키 설정하기
              </button>
            </p>
          )}

          {ai.hasApiKey && !canSubmit && (
            <p className="m-0 text-xs text-textSecondary">
              기업명을 먼저 입력하면 조사할 수 있습니다.
            </p>
          )}

          {ai.error && (
            <p className="m-0 p-2 text-xs text-red-600 bg-red-100 border border-red-300 rounded-sm">
              {ai.error}
            </p>
          )}

          {ai.result && (
            <AiResearchPreview
              result={ai.result}
              currentValues={{ talentProfile, businessSummary, recentIssues }}
              selectedFields={ai.selectedFields}
              onToggleField={ai.toggleField}
              onApply={handleApplyResearch}
              onDismiss={ai.dismiss}
            />
          )}

          <div>
            <label htmlFor="research-talent" className="block mb-1 text-sm font-medium text-text">
              인재상
            </label>
            <textarea
              id="research-talent"
              rows={3}
              value={talentProfile}
              onChange={(event) => setTalentProfile(event.target.value)}
              placeholder="기업이 공표한 인재상·핵심 가치"
              className={cn(inputClass, "resize-y")}
            />
          </div>

          <div>
            <label htmlFor="research-business" className="block mb-1 text-sm font-medium text-text">
              사업 내용
            </label>
            <textarea
              id="research-business"
              rows={3}
              value={businessSummary}
              onChange={(event) => setBusinessSummary(event.target.value)}
              placeholder="주요 사업 영역·제품·서비스"
              className={cn(inputClass, "resize-y")}
            />
          </div>

          <div>
            <label htmlFor="research-issues" className="block mb-1 text-sm font-medium text-text">
              최근 이슈
            </label>
            <textarea
              id="research-issues"
              rows={3}
              value={recentIssues}
              onChange={(event) => setRecentIssues(event.target.value)}
              placeholder="실적·조직 개편·신사업 등 최근 소식"
              className={cn(inputClass, "resize-y")}
            />
          </div>
        </section>

        <div>
          <label htmlFor="research-memo" className="block mb-1 text-sm font-medium text-text">
            메모
          </label>
          <textarea
            id="research-memo"
            rows={3}
            value={researchNote}
            onChange={(event) => setResearchNote(event.target.value)}
            placeholder="지원 전략, 준비할 것 등"
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
