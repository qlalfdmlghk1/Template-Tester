import { useState } from "react";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { cn } from "@/shared/lib/cn";
import {
  COMPANY_CATEGORIES,
  COMPANY_CATEGORY_CLASSES,
  COMPANY_CATEGORY_LABELS,
  COMPANY_PREFERENCES,
  COMPANY_PREFERENCE_CLASSES,
  COMPANY_PREFERENCE_DESCRIPTIONS,
  COMPANY_PREFERENCE_LABELS,
} from "@/entities/company/model/company.type";
import type {
  AiResearchField,
  Company,
  CompanyCategory,
  CompanyInput,
  CompanyPreference,
} from "@/entities/company/model/company.type";
import { useCompanyAiResearch } from "../../model/useCompanyAiResearch";
import { AiResearchPreview } from "../AiResearchPreview/AiResearchPreview";
import { ResearchSourceLinks } from "../ResearchSourceLinks/ResearchSourceLinks";

interface CompanyResearchFormProps {
  /** 수정 대상. null이면 신규 등록 */
  company: Company | null;
  saving: boolean;
  onSubmit: (input: CompanyInput) => void;
  onCancel: () => void;
  /** API 키 설정 화면 열기 — 키가 없을 때 안내에서 호출 */
  onOpenKeySettings: () => void;
}

const inputClass =
  "w-full px-2 py-1.5 text-sm bg-surface text-text border border-border rounded-sm";

const labelClass = "block mb-1 text-sm font-medium text-text";

const panelClass =
  "flex flex-col gap-3 p-4 md:p-5 bg-surface border border-border rounded-lg";

export function CompanyResearchForm({
  company,
  saving,
  onSubmit,
  onCancel,
  onOpenKeySettings,
}: CompanyResearchFormProps) {
  const [name, setName] = useState(company?.name ?? "");
  const [categories, setCategories] = useState<CompanyCategory[]>(
    company?.categories ?? [],
  );
  const [targetJob, setTargetJob] = useState(company?.targetJob ?? "");
  const [postingUrl, setPostingUrl] = useState(company?.postingUrl ?? "");
  const [location, setLocation] = useState(company?.location ?? "");
  const [jobDescription, setJobDescription] = useState(
    company?.jobDescription ?? "",
  );
  const [requirements, setRequirements] = useState(company?.requirements ?? "");
  const [researchNote, setResearchNote] = useState(company?.researchNote ?? "");
  const [preference, setPreference] = useState<CompanyPreference | undefined>(
    company?.preference,
  );
  const [talentProfile, setTalentProfile] = useState(
    company?.talentProfile ?? "",
  );
  const [businessSummary, setBusinessSummary] = useState(
    company?.businessSummary ?? "",
  );
  const [recentIssues, setRecentIssues] = useState(company?.recentIssues ?? "");
  /** AI가 채운 항목의 출처 — 반영한 항목만 남긴다 */
  const [researchSources, setResearchSources] = useState(
    company?.researchSources,
  );
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
      preference,
      talentProfile: talentProfile.trim() || undefined,
      businessSummary: businessSummary.trim() || undefined,
      recentIssues: recentIssues.trim() || undefined,
      researchSources,
      researchedAt,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* 조사 내용이 길어 한 열로는 읽기 어렵다.
          기본 정보를 좁은 왼쪽에 몰고, 조사 항목에 넓은 쪽을 준다. */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 items-start">
        <div className={panelClass}>
          <h3 className="m-0 text-sm font-semibold text-text">기본 정보</h3>

          <div>
            <label htmlFor="research-name" className={labelClass}>
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
            <label htmlFor="research-job" className={labelClass}>
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
            <label htmlFor="research-url" className={labelClass}>
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
            <label htmlFor="research-location" className={labelClass}>
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

          <fieldset className="m-0 p-0 border-0">
            <legend className="mb-1 text-sm font-medium text-text">
              분류{" "}
              <span className="font-normal text-textSecondary">
                (여러 개 선택 가능)
              </span>
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
                        ? cn(
                            COMPANY_CATEGORY_CLASSES[category],
                            "border-blue-500 ring-1 ring-blue-500",
                          )
                        : "bg-surface text-textSecondary border-border hover:border-gray-400",
                    )}
                  >
                    {COMPANY_CATEGORY_LABELS[category]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="m-0 p-0 border-0">
            <legend className="mb-1 text-sm font-medium text-text">
              지망 등급{" "}
              <span className="font-normal text-textSecondary">(선택)</span>
            </legend>
            <div className="flex flex-col gap-1">
              {COMPANY_PREFERENCES.map((grade) => {
                const selected = preference === grade;

                return (
                  <button
                    key={grade}
                    type="button"
                    // 한 번 더 누르면 해제 — 잘못 고른 뒤 되돌릴 방법이 있어야 한다
                    onClick={() => setPreference(selected ? undefined : grade)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 text-left rounded-sm border transition-colors",
                      // 선택 표시는 테두리로만 — 배경까지 물들이면 등급 색과 헷갈린다
                      selected
                        ? "bg-surface border-blue-500 ring-1 ring-blue-500"
                        : "bg-surface border-border hover:border-gray-400",
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 w-6 h-6 grid place-items-center rounded-sm text-xs font-bold",
                        COMPANY_PREFERENCE_CLASSES[grade],
                      )}
                    >
                      {grade}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-text">
                        {COMPANY_PREFERENCE_LABELS[grade]}
                      </span>
                      <span className="block text-xs text-textSecondary">
                        {COMPANY_PREFERENCE_DESCRIPTIONS[grade]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="research-desc" className={labelClass}>
              직무 설명
            </label>
            <textarea
              id="research-desc"
              rows={6}
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="공고의 직무 소개를 붙여넣어 두면 나중에 비교하기 좋습니다."
              className={cn(inputClass, "resize-y")}
            />
          </div>

          <div>
            <label htmlFor="research-req" className={labelClass}>
              자격 요건
            </label>
            <textarea
              id="research-req"
              rows={6}
              value={requirements}
              onChange={(event) => setRequirements(event.target.value)}
              placeholder="요구 기술·경력 조건 등"
              className={cn(inputClass, "resize-y")}
            />
          </div>

          <div>
            <label htmlFor="research-memo" className={labelClass}>
              메모
            </label>
            <textarea
              id="research-memo"
              rows={4}
              value={researchNote}
              onChange={(event) => setResearchNote(event.target.value)}
              placeholder="지원 전략, 준비할 것 등"
              className={cn(inputClass, "resize-y")}
            />
          </div>
        </div>

        <section className={panelClass}>
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
              AI 조사를 쓰려면 본인 API 키가 필요합니다.{" "}
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
            <label htmlFor="research-talent" className={labelClass}>
              인재상
            </label>
            <textarea
              id="research-talent"
              rows={8}
              value={talentProfile}
              onChange={(event) => setTalentProfile(event.target.value)}
              placeholder="기업이 공표한 인재상·핵심 가치"
              className={cn(inputClass, "resize-y")}
            />
            <ResearchSourceLinks sources={researchSources?.talentProfile} />
          </div>

          <div>
            <label htmlFor="research-business" className={labelClass}>
              사업 내용
            </label>
            <textarea
              id="research-business"
              rows={10}
              value={businessSummary}
              onChange={(event) => setBusinessSummary(event.target.value)}
              placeholder="주요 사업 영역·제품·서비스"
              className={cn(inputClass, "resize-y")}
            />
            <ResearchSourceLinks sources={researchSources?.businessSummary} />
          </div>

          <div>
            <label htmlFor="research-issues" className={labelClass}>
              최근 이슈
            </label>
            <textarea
              id="research-issues"
              rows={12}
              value={recentIssues}
              onChange={(event) => setRecentIssues(event.target.value)}
              placeholder="실적·조직 개편·신사업 등 최근 소식"
              className={cn(inputClass, "resize-y")}
            />
            <ResearchSourceLinks sources={researchSources?.recentIssues} />
          </div>
        </section>
      </div>

      {/* 폼이 길어 끝까지 내리지 않아도 저장할 수 있게 아래에 붙여 둔다 */}
      <div className="sticky bottom-0 flex justify-end gap-2 py-3 bg-background border-t border-border">
        <AppButton
          type="button"
          variant="outline"
          color="gray"
          size="sm"
          onClick={onCancel}
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
  );
}
