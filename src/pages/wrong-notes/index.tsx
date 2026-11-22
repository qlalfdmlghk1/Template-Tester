import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import AppFallback from "@/shared/ui/molecules/AppFallback/AppFallback";
import AppChip from "@/shared/ui/atoms/AppChip/AppChip";
import AppSelect from "@/shared/ui/atoms/AppSelect/AppSelect";
import { AppTextInput } from "@/shared/ui/atoms/AppTextInput";
import { AppDatePicker } from "@/shared/ui/atoms/AppDatePicker";
import AppPagination from "@/shared/ui/molecules/AppPagination/AppPagination";
import ToggleButtonGroup from "@/shared/ui/atoms/ToggleButtonGroup/ToggleButtonGroup";
import CodeEditor from "@/shared/ui/molecules/CodeEditor/CodeEditor";
import { AppTextarea } from "@/shared/ui/atoms/AppTextarea";
import { AppCheckbox } from "@/shared/ui/atoms/AppCheckbox";
import { usePagination } from "@/shared/lib/usePagination";
import { useWrongNoteFilter } from "@/entities/wrong-note/model/useWrongNoteFilter";
import { useWrongNoteList } from "@/entities/wrong-note/model/useWrongNoteList";
import { useFriendWrongNotes } from "@/entities/wrong-note/model/useFriendWrongNotes";
import { useWrongNoteForm } from "@/entities/wrong-note/model/useWrongNoteForm";
import {
  categoryOptions,
  languageOptions,
  platformOptions,
  resultOptions,
  tagOptions,
  wrongNoteSortOptions,
  getCategoryLabel,
  getGradeLabel,
  getLanguageLabel,
  getPlatformLabel,
  getResultLabel,
  getTagLabels,
} from "@/shared/lib/options";

export default function WrongNotes() {
  const [activeTab, setActiveTab] = useState<"write" | "list" | "friends">("list");
  const navigate = useNavigate();

  const {
    filters,
    sortBy,
    searchQuery,
    setSearchQuery,
    handleFilterChange,
    handleSortByChange,
    clearFilters,
    hasActiveFilters,
  } = useWrongNoteFilter();

  const { notes, isLoading, loadNotes, handleDelete, getFilteredNotes } = useWrongNoteList();
  const {
    friendNotes,
    friendList,
    friendFilter,
    setFriendFilter,
    isFriendNotesLoading,
    loadFriendNotes,
    getFriendDisplayName,
    getFilteredFriendNotes,
  } = useFriendWrongNotes();

  const {
    formData,
    isSubmitting,
    handleInputChange,
    handlePlatformChange,
    getGradeOptions,
    handleSubmit,
    resetForm,
    canAddSolution,
    addSolution,
    removeSolution,
    updateSolution,
  } = useWrongNoteForm({
    onSuccess: () => {
      resetForm();
      setActiveTab("list");
    },
  });

  const filteredNotes = getFilteredNotes(filters, searchQuery);
  const filteredFriendNotes = getFilteredFriendNotes(filters, searchQuery);

  const {
    currentPage: listPage,
    pageSize: listPageSize,
    totalPages: listTotalPages,
    paginatedItems: paginatedNotes,
    setCurrentPage: setListPage,
  } = usePagination(filteredNotes, { initialPageSize: 10 });

  const {
    currentPage: friendPage,
    pageSize: friendPageSize,
    totalPages: friendTotalPages,
    paginatedItems: paginatedFriendNotes,
    setCurrentPage: setFriendPage,
  } = usePagination(filteredFriendNotes, { initialPageSize: 10 });

  useEffect(() => {
    if (activeTab === "list") {
      loadNotes();
    } else if (activeTab === "friends") {
      loadFriendNotes();
    }
    clearFilters();
  }, [activeTab]);

  useEffect(() => {
    setListPage(1);
  }, [filters, searchQuery, sortBy, setListPage]);

  useEffect(() => {
    setFriendPage(1);
  }, [filters, searchQuery, sortBy, friendFilter, setFriendPage]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 py-4 sm:px-6 sm:py-6">
        {/* 작성 화면에서는 탭 대신 목록으로 돌아가는 버튼만 둔다 (기업 등록 화면과 같은 형태) */}
        {activeTab === "write" ? (
          <>
            <AppButton
              variant="ghost"
              color="gray"
              size="sm"
              className="mb-2 -ml-2"
              onClick={() => setActiveTab("list")}
            >
              ← 목록으로
            </AppButton>
            <PageHeader title="오답노트 작성" />
          </>
        ) : (
          <>
            <PageHeader title="오답노트" />

            {/* 탭 */}
            <div className="flex items-end gap-2 mt-6 border-b border-border">
              <button
                onClick={() => setActiveTab("list")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === "list"
                    ? "text-primary border-primary"
                    : "text-textSecondary border-transparent hover:text-text"
                }`}
              >
                목록
              </button>
              <button
                onClick={() => setActiveTab("friends")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === "friends"
                    ? "text-primary border-primary"
                    : "text-textSecondary border-transparent hover:text-text"
                }`}
              >
                친구 오답노트
              </button>
              <div className="ml-auto pb-2">
                <AppButton variant="outline" size="sm" onClick={() => setActiveTab("write")}>
                  + 작성
                </AppButton>
              </div>
            </div>
          </>
        )}

        {/* 목록 탭 */}
        {activeTab === "list" && (
          <div className="mt-6">
            {notes.length > 0 && (
              <div className="flex flex-col mb-3 sm:mb-4 p-3 sm:p-4 bg-surface border border-border rounded-lg gap-3 sm:gap-4">
                <AppTextInput
                  type="text"
                  size="md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="문제 이름 또는 문제 번호로 검색..."
                  aria-label="문제 검색"
                  iconLeft={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  }
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                  <AppSelect
                    ariaLabel="플랫폼"
                    options={platformOptions}
                    value={filters.platform}
                    onChange={(value) => handleFilterChange("platform", value as string)}
                    placeholder="플랫폼"
                    size="md"
                  />
                  <AppSelect
                    ariaLabel="알고리즘"
                    options={categoryOptions}
                    value={filters.category}
                    onChange={(value) => handleFilterChange("category", value as string)}
                    placeholder="알고리즘"
                    size="md"
                  />
                  <AppSelect
                    ariaLabel="언어"
                    options={languageOptions}
                    value={filters.language}
                    onChange={(value) => handleFilterChange("language", value as string)}
                    placeholder="언어"
                    size="md"
                  />
                  <AppSelect
                    ariaLabel="결과"
                    options={resultOptions}
                    value={filters.result}
                    onChange={(value) => handleFilterChange("result", value as string)}
                    placeholder="결과"
                    size="md"
                  />
                  <AppSelect
                    ariaLabel="작성 이유"
                    options={tagOptions}
                    value={filters.tag}
                    onChange={(value) => handleFilterChange("tag", value as string)}
                    placeholder="작성 이유"
                    size="md"
                  />
                  {hasActiveFilters && (
                    <AppButton variant="ghost" size="md" onClick={clearFilters}>
                      초기화
                    </AppButton>
                  )}
                </div>
                <span className="ml-auto text-xs text-textSecondary">
                  {filteredNotes.length}개 / 전체 {notes.length}개
                </span>
              </div>
            )}

            <div className="flex flex-row w-full justify-between items-center mb-3 sm:mb-4">
              <span className="text-xs text-textSecondary">
                {filteredNotes.length}개 / 전체 {notes.length}개
              </span>
              <AppSelect
                ariaLabel="정렬"
                options={wrongNoteSortOptions}
                value={sortBy}
                onChange={(value) => handleSortByChange(value as string)}
                placeholder="정렬순 선택"
                width="140px"
                className="sm:!w-[160px]"
                size="md"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-textSecondary">불러오는 중...</div>
            ) : notes.length === 0 ? (
              <AppFallback
                type="empty"
                title="아직 작성한 오답노트가 없습니다."
                description="오답노트를 작성하고 학습 기록을 관리해보세요."
                buttonText="첫 오답노트 작성하기"
                buttonIcon={null}
                onAction={() => setActiveTab("write")}
              />
            ) : filteredNotes.length === 0 ? (
              <AppFallback
                type="empty"
                title="필터 조건에 맞는 오답노트가 없습니다."
                description="검색 조건 변경 후 다시 시도해 주세요."
                buttonText="필터 초기화"
                onAction={clearFilters}
              />
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => navigate(`/wrong-notes/${note.id}`)}
                      className="p-3 sm:p-4 bg-surface border border-border rounded-lg hover:border-primary transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                            <AppChip variant="success">{getCategoryLabel(note.category)}</AppChip>
                            <AppChip variant="primary">{getPlatformLabel(note.platform)}</AppChip>
                            <AppChip variant="purple">{getLanguageLabel(note.language)}</AppChip>
                            {note.grade && (
                              <AppChip variant="secondary">{getGradeLabel(note.platform, note.grade)}</AppChip>
                            )}
                            <AppChip
                              variant={
                                note.result === "correct" ? "success" : note.result === "timeout" ? "warning" : "error"
                              }
                            >
                              {getResultLabel(note.result)}
                            </AppChip>
                          </div>
                          <h3 className="text-sm sm:text-base text-text font-medium">{note.title || "제목 없음"}</h3>
                          <a
                            href={note.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-textSecondary hover:text-primary transition-colors truncate block"
                          >
                            {note.link}
                          </a>
                          <div className="flex items-center gap-2 mt-2 text-xs text-textSecondary">
                            <span>{note.date}</span>
                            {note.tags.length > 0 && (
                              <>
                                <span>·</span>
                                <span>{getTagLabels(note.tags).join(", ")}</span>
                              </>
                            )}
                          </div>
                          {note.comment ? (
                            <p className="mt-2 text-sm text-textSecondary line-clamp-2">{note.comment}</p>
                          ) : null}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (note.id) handleDelete(note.id);
                          }}
                          className="p-2 text-textSecondary hover:text-error transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <AppPagination
                  currentPage={listPage}
                  totalPages={listTotalPages}
                  pageSize={listPageSize}
                  onPageChange={setListPage}
                />
              </>
            )}
          </div>
        )}

        {/* 친구 오답노트 탭 */}
        {activeTab === "friends" && (
          <div className="mt-6">
            {friendNotes.length > 0 && (
              <div className="flex flex-col mb-3 sm:mb-4 p-3 sm:p-4 bg-surface border border-border rounded-lg gap-3 sm:gap-4">
                <AppTextInput
                  type="text"
                  size="md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="문제 이름 또는 문제 번호로 검색..."
                  aria-label="문제 검색"
                  iconLeft={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  }
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                  <AppSelect
                    ariaLabel="친구"
                    options={friendList.map((f) => ({
                      value: f.odUserId,
                      label: f.displayName || f.email || "알 수 없음",
                    }))}
                    value={friendFilter}
                    onChange={(value) => setFriendFilter(value as string)}
                    placeholder="모든 친구"
                    size="md"
                  />
                  <AppSelect
                    ariaLabel="플랫폼"
                    options={platformOptions}
                    value={filters.platform}
                    onChange={(value) => handleFilterChange("platform", value as string)}
                    placeholder="플랫폼"
                    size="md"
                  />
                  <AppSelect
                    ariaLabel="알고리즘"
                    options={categoryOptions}
                    value={filters.category}
                    onChange={(value) => handleFilterChange("category", value as string)}
                    placeholder="알고리즘"
                    size="md"
                  />
                  <AppSelect
                    ariaLabel="언어"
                    options={languageOptions}
                    value={filters.language}
                    onChange={(value) => handleFilterChange("language", value as string)}
                    placeholder="언어"
                    size="md"
                  />
                  <AppSelect
                    ariaLabel="결과"
                    options={resultOptions}
                    value={filters.result}
                    onChange={(value) => handleFilterChange("result", value as string)}
                    placeholder="결과"
                    size="md"
                  />
                </div>
                <div className="flex justify-between items-center">
                  {(friendFilter ||
                    filters.platform ||
                    filters.category ||
                    filters.language ||
                    filters.result ||
                    searchQuery) && (
                    <AppButton
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        setFriendFilter("");
                        clearFilters();
                      }}
                    >
                      초기화
                    </AppButton>
                  )}
                  <span className="ml-auto text-xs text-textSecondary">
                    {filteredFriendNotes.length}개 / 전체 {friendNotes.length}개
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-row w-full justify-between items-center mb-3 sm:mb-4">
              <span className="text-xs text-textSecondary">
                {filteredFriendNotes.length}개 / 전체 {friendNotes.length}개
              </span>
              <AppSelect
                ariaLabel="정렬"
                options={wrongNoteSortOptions}
                value={sortBy}
                onChange={(value) => handleSortByChange(value as string)}
                placeholder="정렬순 선택"
                width="140px"
                className="sm:!w-[160px]"
                size="md"
              />
            </div>

            {isFriendNotesLoading ? (
              <div className="text-center py-12 text-textSecondary">불러오는 중...</div>
            ) : friendList.length === 0 ? (
              <AppFallback
                type="empty"
                title="아직 친구가 없습니다."
                description="친구를 추가하면 공유된 오답노트를 볼 수 있습니다."
                buttonText="친구 추가하러 가기"
                buttonIcon={null}
                onAction={() => navigate("/friends")}
              />
            ) : friendNotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-textSecondary">친구들이 공유한 오답노트가 없습니다.</p>
              </div>
            ) : filteredFriendNotes.length === 0 ? (
              <AppFallback
                type="empty"
                title="필터 조건에 맞는 오답노트가 없습니다."
                description="검색 조건 변경 후 다시 시도해 주세요."
                buttonText="필터 초기화"
                onAction={() => {
                  setFriendFilter("");
                  clearFilters();
                }}
              />
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedFriendNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => navigate(`/wrong-notes/${note.id}`)}
                      className="p-3 sm:p-4 bg-surface border border-border rounded-lg hover:border-primary transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 text-sm text-textSecondary">
                            <span className="font-medium text-text">{getFriendDisplayName(note.userId)}</span>
                            <span>님의 오답노트</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                            <AppChip variant="success">{getCategoryLabel(note.category)}</AppChip>
                            <AppChip variant="primary">{getPlatformLabel(note.platform)}</AppChip>
                            <AppChip variant="purple">{getLanguageLabel(note.language)}</AppChip>
                            {note.grade && (
                              <AppChip variant="secondary">{getGradeLabel(note.platform, note.grade)}</AppChip>
                            )}
                            <AppChip
                              variant={
                                note.result === "correct" ? "success" : note.result === "timeout" ? "warning" : "error"
                              }
                            >
                              {getResultLabel(note.result)}
                            </AppChip>
                          </div>
                          <h3 className="text-text font-medium">{note.title || "제목 없음"}</h3>
                          <a
                            href={note.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-textSecondary hover:text-primary transition-colors truncate block"
                          >
                            {note.link}
                          </a>
                          <div className="flex items-center gap-2 mt-2 text-xs text-textSecondary">
                            <span>{note.date}</span>
                            {note.tags.length > 0 && (
                              <>
                                <span>·</span>
                                <span>{getTagLabels(note.tags).join(", ")}</span>
                              </>
                            )}
                          </div>
                          {note.comment && <p className="mt-2 text-sm text-textSecondary line-clamp-2">{note.comment}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <AppPagination
                  currentPage={friendPage}
                  totalPages={friendTotalPages}
                  pageSize={friendPageSize}
                  onPageChange={setFriendPage}
                />
              </>
            )}
          </div>
        )}

        {/* 작성 탭 */}
        {activeTab === "write" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
              <div>
                <label htmlFor="wrong-note-title" className="block text-sm font-medium text-text leading-[30px] mb-2">문제 이름</label>
                <AppTextInput
                  id="wrong-note-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="예: 두 수의 합, 타겟 넘버 등"
                />
              </div>
              <div>
                <label id="wrong-note-language-label" htmlFor="wrong-note-language" className="block text-sm font-medium text-text leading-[30px] mb-2">언어</label>
                <AppSelect
                  id="wrong-note-language"
                  ariaLabelledby="wrong-note-language-label"
                  options={languageOptions}
                  value={formData.language}
                  onChange={(value) => handleInputChange("language", value as string)}
                  placeholder="언어 선택"
                  fullWidth
                  size="md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="wrong-note-link" className="block text-sm font-medium text-text leading-[30px] mb-2">문제 링크</label>
              <AppTextInput
                id="wrong-note-link"
                type="url"
                value={formData.link}
                onChange={(e) => handleInputChange("link", e.target.value)}
                placeholder="https://programmers.co.kr/..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label id="wrong-note-date-label" htmlFor="wrong-note-date" className="block text-sm font-medium text-text leading-[30px] mb-2">날짜</label>
                <AppDatePicker
                  id="wrong-note-date"
                  ariaLabelledby="wrong-note-date-label"
                  value={formData.date}
                  onChange={(value) => handleInputChange("date", value)}
                />
              </div>
              <div>
                <label id="wrong-note-category-label" htmlFor="wrong-note-category" className="block text-sm font-medium text-text leading-[30px] mb-2">알고리즘</label>
                <AppSelect
                  id="wrong-note-category"
                  ariaLabelledby="wrong-note-category-label"
                  options={categoryOptions}
                  value={formData.category}
                  onChange={(value) => handleInputChange("category", value as string)}
                  placeholder="알고리즘 선택"
                  fullWidth
                  size="md"
                />
              </div>
              <div>
                <label id="wrong-note-platform-label" htmlFor="wrong-note-platform" className="block text-sm font-medium text-text leading-[30px] mb-2">플랫폼</label>
                <AppSelect
                  id="wrong-note-platform"
                  ariaLabelledby="wrong-note-platform-label"
                  options={platformOptions}
                  value={formData.platform}
                  onChange={(value) => handlePlatformChange(value as string)}
                  placeholder="플랫폼 선택"
                  fullWidth
                  size="md"
                />
              </div>
              <div>
                <label id="wrong-note-grade-label" htmlFor="wrong-note-grade" className="block text-sm font-medium text-text leading-[30px] mb-2">등급</label>
                <AppSelect
                  id="wrong-note-grade"
                  ariaLabelledby="wrong-note-grade-label"
                  options={getGradeOptions()}
                  value={formData.grade}
                  onChange={(value) => handleInputChange("grade", value as string)}
                  placeholder={formData.platform ? "등급 선택" : "플랫폼을 먼저 선택"}
                  disabled={!formData.platform}
                  fullWidth
                  size="md"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row w-full gap-4 sm:justify-between sm:items-start">
              <div className="w-full sm:w-[50%]">
                <label className="block text-sm font-medium text-text leading-[30px] mb-2">제출 결과</label>
                <ToggleButtonGroup
                  options={resultOptions}
                  value={formData.result}
                  onChange={(value) => handleInputChange("result", value)}
                />
              </div>
              <div className="w-full sm:w-[50%]">
                <label className="block text-sm font-medium text-text leading-[30px] mb-2">작성 이유 (복수 선택 가능)</label>
                <ToggleButtonGroup
                  options={tagOptions}
                  value={formData.tags}
                  onChange={(value) => handleInputChange("tags", value)}
                  multiple
                />
              </div>
            </div>

            <div className="flex w-full flex-col md:flex-row gap-4 md:gap-2">
              <div className="w-full space-y-3">
                <label className="block text-sm font-medium text-text leading-[30px]">내 풀이</label>
                <div className="border border-border rounded-lg p-3 bg-surface">
                  <div className="mb-2">
                    <AppTextInput
                      type="text"
                      size="sm"
                      value={formData.myCodeLabel}
                      onChange={(e) => handleInputChange("myCodeLabel", e.target.value)}
                      placeholder="라벨 (예: 브루트포스, 1차 시도 등)"
                      aria-label="내 풀이 라벨"
                    />
                  </div>
                  <CodeEditor
                    value={formData.myCode}
                    language={formData.language}
                    onChange={(value) => handleInputChange("myCode", value)}
                  />
                </div>
              </div>
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-text leading-[30px]">참조한 풀이</label>
                  {canAddSolution && (
                    <button
                      type="button"
                      onClick={addSolution}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      풀이 추가 ({formData.solutions.length}/3)
                    </button>
                  )}
                </div>
                {formData.solutions.map((solution, index) => (
                  <div key={index} className="relative border border-border rounded-lg p-3 bg-surface">
                    <div className="flex items-center gap-2 mb-2">
                      <AppTextInput
                        type="text"
                        size="sm"
                        className="flex-1"
                        value={solution.label}
                        onChange={(e) => updateSolution(index, "label", e.target.value)}
                        placeholder={`풀이 ${index + 1} 라벨 (예: BFS, DP 등)`}
                        aria-label={`풀이 ${index + 1} 라벨`}
                      />
                      {formData.solutions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSolution(index)}
                          className="p-1.5 text-textSecondary hover:text-error transition-colors"
                          title="풀이 삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <CodeEditor
                      value={solution.code}
                      language={formData.language}
                      onChange={(value: string) => updateSolution(index, "code", value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text leading-[30px] mb-2">코멘트</label>
              <AppTextarea
                value={formData.comment}
                onChange={(e) => handleInputChange("comment", e.target.value)}
                placeholder="이 문제에서 배운 점, 주의할 점 등을 기록하세요..."
                rows={4}
                resize="none"
              />
            </div>

            <AppCheckbox
              id="share"
              checked={formData.share}
              onChange={(e) => handleInputChange("share", e.target.checked)}
              label="다른 사용자에게 공유하기"
            />

            <div className="flex justify-end pt-4">
              <AppButton variant="solid" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : "오답노트 저장"}
              </AppButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
