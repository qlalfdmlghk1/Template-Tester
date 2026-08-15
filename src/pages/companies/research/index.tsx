import { useNavigate } from "react-router-dom";
import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import AppFallback from "@/shared/ui/molecules/AppFallback/AppFallback";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { AppSwitch } from "@/shared/ui/atoms/AppSwitch";
import { cn } from "@/shared/lib/cn";
import {
  COMPANY_CATEGORIES,
  COMPANY_CATEGORY_CLASSES,
  COMPANY_CATEGORY_LABELS,
  COMPANY_PREFERENCES,
  COMPANY_PREFERENCE_CLASSES,
  COMPANY_PREFERENCE_LABELS,
} from "@/entities/company/model/company.type";
import { useCompanyResearch } from "@/features/recruitment/model/useCompanyResearch";
import { CompanyResearchCard } from "@/features/recruitment/ui/CompanyResearchCard/CompanyResearchCard";

export default function CompanyResearch() {
  const page = useCompanyResearch();
  const navigate = useNavigate();

  // 필터는 URL 쿼리에 있으므로, 그대로 들고 가면 돌아왔을 때 그 상태로 복원된다
  const goToForm = (path: string) =>
    navigate({ pathname: path, search: window.location.search });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <PageHeader
          title="기업 조사"
          description="채용기간이 아닐 때 미리 조사해 두는 공간입니다. 지원 여부와 관계없이 기업 단위로 모입니다."
          actions={
            <AppButton
              size="sm"
              className="ml-auto shrink-0"
              onClick={() => goToForm("/companies/research/new")}
            >
              기업 추가
            </AppButton>
          }
        />

        {page.error ? (
          <AppFallback type="error" onAction={page.reload} />
        ) : page.isLoading ? (
          <div
            className="flex flex-col gap-3"
            role="status"
            aria-label="기업 조사 불러오는 중"
          >
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
            onAction={() => goToForm("/companies/research/new")}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={page.keyword}
                onChange={(event) => page.setKeyword(event.target.value)}
                placeholder="기업명·직무·직무 설명·자격 요건 검색"
                aria-label="기업 검색"
                className="flex-1 min-w-[200px] max-w-[360px] px-3 py-1.5 text-sm bg-surface text-text border border-border rounded-sm"
              />

              {/* 분류와 지망 등급은 서로 다른 축의 필터다. 같은 간격으로 늘어놓으면
                  한 줄의 버튼 묶음처럼 보여, 각각 옅은 판 위에 올려 경계를 만든다 */}
              <div
                className="flex flex-wrap gap-1.5 p-1 bg-gray-100 rounded-sm"
                role="group"
                aria-label="기업 분류 필터"
              >
                {COMPANY_CATEGORIES.map((category) => {
                  const selected = page.selectedCategories.includes(category);

                  return (
                    <button
                      key={category}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        page.setSelectedCategories(
                          selected
                            ? page.selectedCategories.filter(
                                (item) => item !== category,
                              )
                            : [...page.selectedCategories, category],
                        )
                      }
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-sm border transition-colors",
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

              <div
                className="flex flex-wrap gap-1.5 p-1 bg-gray-100 rounded-sm"
                role="group"
                aria-label="지망 등급 필터"
              >
                {COMPANY_PREFERENCES.map((grade) => {
                  const selected = page.selectedPreferences.includes(grade);

                  return (
                    <button
                      key={grade}
                      type="button"
                      aria-pressed={selected}
                      // 알파벳만으로는 뜻이 안 보이므로 등급 문구를 툴팁으로 붙인다
                      title={COMPANY_PREFERENCE_LABELS[grade]}
                      onClick={() =>
                        page.setSelectedPreferences(
                          selected
                            ? page.selectedPreferences.filter((item) => item !== grade)
                            : [...page.selectedPreferences, grade],
                        )
                      }
                      className={cn(
                        "w-7 py-1 text-xs font-bold rounded-sm border transition-colors",
                        selected
                          ? cn(
                              COMPANY_PREFERENCE_CLASSES[grade],
                              "border-blue-500 ring-1 ring-blue-500",
                            )
                          : "bg-surface text-textSecondary border-border hover:border-gray-400",
                      )}
                    >
                      {grade}
                    </button>
                  );
                })}
              </div>

              <AppSwitch
                checked={page.onlyResearched}
                onChange={page.setOnlyResearched}
                label="조사된 기업"
                size="sm"
              />

              <span className="text-sm text-textSecondary">
                전체 {page.totalCount}건 · 조사된 기업 {page.researchedCount}건
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
                    onOpen={() => goToForm(`/companies/research/${company.id}`)}
                    onEdit={() => goToForm(`/companies/research/${company.id}/edit`)}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
