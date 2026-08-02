import { useState } from "react";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { cn } from "@/shared/lib/cn";
import type { Company, CompanyInput } from "@/entities/company/model/company.type";

interface CompanyResearchDialogProps {
  /** 수정 대상. null이면 신규 등록 */
  company: Company | null;
  saving: boolean;
  onSubmit: (input: CompanyInput) => void;
  onClose: () => void;
}

const inputClass =
  "w-full px-2 py-1.5 text-sm bg-surface text-text border border-border rounded-sm";

export function CompanyResearchDialog({
  company,
  saving,
  onSubmit,
  onClose,
}: CompanyResearchDialogProps) {
  const [name, setName] = useState(company?.name ?? "");
  const [targetJob, setTargetJob] = useState(company?.targetJob ?? "");
  const [postingUrl, setPostingUrl] = useState(company?.postingUrl ?? "");
  const [location, setLocation] = useState(company?.location ?? "");
  const [jobDescription, setJobDescription] = useState(company?.jobDescription ?? "");
  const [requirements, setRequirements] = useState(company?.requirements ?? "");
  const [researchNote, setResearchNote] = useState(company?.researchNote ?? "");

  const canSubmit = name.trim().length > 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      name: name.trim(),
      targetJob: targetJob.trim() || undefined,
      postingUrl: postingUrl.trim() || undefined,
      location: location.trim() || undefined,
      jobDescription: jobDescription.trim() || undefined,
      requirements: requirements.trim() || undefined,
      researchNote: researchNote.trim() || undefined,
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
