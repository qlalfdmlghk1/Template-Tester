import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import SelectBox from "@/components/ui/SelectBox";
import {
  getWrongNotes,
  deleteWrongNote,
  getFriendsSharedWrongNotes,
  getFriendList,
  type WrongNote,
} from "@/firebase/services";
import type { FriendInfo } from "@/types/friendship.types";
import { wrongNoteSortOptions } from "@/constants/options.constants";
import {
  getCategoryLabel,
  getGradeLabel,
  getLanguageLabel,
  getPlatformLabel,
  getResultLabel,
  getTagLabels,
} from "@/utils/options.utils";
import WrongNoteFilter from "@/components/WrongNoteFilter";
import { useWrongNoteFilter } from "@/hooks/wront-notes/useWrongNoteFilter";
import { WriteSection } from "@/components/wrong-notes/write";

export default function WrongNotes() {
  const [activeTab, setActiveTab] = useState<"write" | "list" | "friends">(
    "list",
  );
  const [notes, setNotes] = useState<WrongNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
  const navigate = useNavigate();

  // 친구 오답노트 관련 state
  const [friendNotes, setFriendNotes] = useState<WrongNote[]>([]);
  const [friendList, setFriendList] = useState<FriendInfo[]>([]);
  const [isFriendNotesLoading, setIsFriendNotesLoading] = useState(false);
  const [friendFilter, setFriendFilter] = useState<string>("");

  // 친구별 필터링된 노트
  const filteredFriendNotes = useMemo(() => {
    return friendNotes
      .filter((note) => {
        if (friendFilter && note.userId !== friendFilter) return false;
        if (filters.platform && note.platform !== filters.platform)
          return false;
        if (filters.category && note.category !== filters.category)
          return false;
        if (filters.result && note.result !== filters.result) return false;
        if (filters.language && note.language !== filters.language)
          return false;
        if (
          searchQuery &&
          !note.title?.toLowerCase().includes(searchQuery.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();

        if (sortBy === "latest") return dateB - dateA;
        if (sortBy === "oldest") return dateA - dateB;

        return 0;
      });
  }, [friendNotes, filters, friendFilter, searchQuery, sortBy]);

  // 친구 이름 가져오기 helper
  const getFriendDisplayName = (userId: string): string => {
    const friend = friendList.find((f) => f.odUserId === userId);
    return friend?.displayName || friend?.email || "알 수 없음";
  };

  // 필터링된 노트
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        if (filters.platform && note.platform !== filters.platform)
          return false;
        if (filters.category && note.category !== filters.category)
          return false;
        if (filters.result && note.result !== filters.result) return false;
        if (filters.language && note.language !== filters.language)
          return false;
        if (filters.tag && !note.tags.includes(filters.tag)) return false;

        if (
          searchQuery &&
          !note.title?.toLowerCase().includes(searchQuery.toLowerCase())
        )
          return false;

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();

        if (sortBy === "latest") return dateB - dateA;
        if (sortBy === "oldest") return dateA - dateB;

        return 0;
      });
  }, [notes, filters, searchQuery, sortBy]);

  // 목록 불러오기
  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const data = await getWrongNotes();
      setNotes(data);
    } catch (error) {
      console.error("조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 친구 오답노트 불러오기
  const loadFriendNotes = async () => {
    try {
      setIsFriendNotesLoading(true);
      const [notes, friends] = await Promise.all([
        getFriendsSharedWrongNotes(),
        getFriendList(),
      ]);
      setFriendNotes(notes);
      setFriendList(friends);
    } catch (error) {
      console.error("친구 오답노트 조회 실패:", error);
    } finally {
      setIsFriendNotesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "list") {
      loadNotes();
    } else if (activeTab === "friends") {
      loadFriendNotes();
    }
    clearFilters();
  }, [activeTab]);

  const handleDelete = async (noteId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteWrongNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  const handleActiveTab = () => {
    setActiveTab("list");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <PageHeader title="오답노트" />

        {/* 탭 */}
        <div className="flex gap-2 mt-6 border-b border-border">
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
          <button
            onClick={() => setActiveTab("write")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "write"
                ? "text-primary border-primary"
                : "text-textSecondary border-transparent hover:text-text"
            }`}
          >
            작성
          </button>
        </div>

        {/* 목록 탭 */}
        {activeTab === "list" && (
          <div className="mt-6">
            {/* 필터 */}
            {notes.length > 0 && (
              <WrongNoteFilter
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filters={filters}
                onFilterChange={handleFilterChange}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
              />
            )}

            <div className="flex flex-row w-full justify-between items-center mb-4">
              <span className="text-xs text-textSecondary">
                {filteredNotes.length}개 / 전체 {notes.length}개
              </span>
              <SelectBox
                options={wrongNoteSortOptions}
                value={sortBy}
                onChange={(e) => handleSortByChange(e.target.value)}
                placeholder="정렬순 선택"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-textSecondary">
                불러오는 중...
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-textSecondary mb-4">
                  아직 작성한 오답노트가 없습니다.
                </p>
                <Button variant="primary" onClick={() => setActiveTab("write")}>
                  첫 오답노트 작성하기
                </Button>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-textSecondary mb-4">
                  필터 조건에 맞는 오답노트가 없습니다.
                </p>
                <Button variant="ghost" onClick={clearFilters}>
                  필터 초기화
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => navigate(`/wrong-notes/${note.id}`)}
                    className="p-4 bg-surface border border-border rounded-lg hover:border-primary transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Chip variant="success">
                            {getCategoryLabel(note.category)}
                          </Chip>
                          <Chip variant="primary">
                            {getPlatformLabel(note.platform)}
                          </Chip>
                          <Chip variant="purple">
                            {getLanguageLabel(note.language)}
                          </Chip>
                          {note.grade && (
                            <Chip variant="secondary">
                              {getGradeLabel(note.platform, note.grade)}
                            </Chip>
                          )}
                          <Chip
                            variant={
                              note.result === "correct"
                                ? "success"
                                : note.result === "timeout"
                                  ? "warning"
                                  : "error"
                            }
                          >
                            {getResultLabel(note.result)}
                          </Chip>
                        </div>
                        <h3 className="text-text font-medium">
                          {note.title || "제목 없음"}
                        </h3>
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
                          <p className="mt-2 text-sm text-textSecondary line-clamp-2">
                            {note.comment}
                          </p>
                        ) : null}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (note.id) handleDelete(note.id);
                        }}
                        className="p-2 text-textSecondary hover:text-error transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
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
            )}
          </div>
        )}

        {/* 친구 오답노트 탭 */}
        {activeTab === "friends" && (
          <div className="mt-6">
            {/* 필터 */}
            {friendNotes.length > 0 && (
              <WrongNoteFilter
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filters={filters}
                onFilterChange={handleFilterChange}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
              />
            )}

            <div className="flex flex-row w-full justify-between items-center mb-4">
              <span className="text-xs text-textSecondary">
                {filteredFriendNotes.length}개 / 전체 {friendNotes.length}개
              </span>
              <SelectBox
                options={wrongNoteSortOptions}
                value={sortBy}
                onChange={(e) => handleSortByChange(e.target.value)}
                placeholder="정렬순 선택"
              />
            </div>

            {isFriendNotesLoading ? (
              <div className="text-center py-12 text-textSecondary">
                불러오는 중...
              </div>
            ) : friendList.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-textSecondary mb-4">아직 친구가 없습니다.</p>
                <Button variant="primary" onClick={() => navigate("/friends")}>
                  친구 추가하러 가기
                </Button>
              </div>
            ) : friendNotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-textSecondary">
                  친구들이 공유한 오답노트가 없습니다.
                </p>
              </div>
            ) : filteredFriendNotes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-textSecondary mb-4">
                  필터 조건에 맞는 오답노트가 없습니다.
                </p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFriendFilter("");
                    clearFilters();
                  }}
                >
                  필터 초기화
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFriendNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => navigate(`/wrong-notes/${note.id}`)}
                    className="p-4 bg-surface border border-border rounded-lg hover:border-primary transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* 작성자 정보 */}
                        <div className="flex items-center gap-2 mb-2 text-sm text-textSecondary">
                          <span className="font-medium text-text">
                            {getFriendDisplayName(note.userId)}
                          </span>
                          <span>님의 오답노트</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Chip variant="success">
                            {getCategoryLabel(note.category)}
                          </Chip>
                          <Chip variant="primary">
                            {getPlatformLabel(note.platform)}
                          </Chip>
                          <Chip variant="purple">
                            {getLanguageLabel(note.language)}
                          </Chip>
                          {note.grade && (
                            <Chip variant="secondary">
                              {getGradeLabel(note.platform, note.grade)}
                            </Chip>
                          )}
                          <Chip
                            variant={
                              note.result === "correct"
                                ? "success"
                                : note.result === "timeout"
                                  ? "warning"
                                  : "error"
                            }
                          >
                            {getResultLabel(note.result)}
                          </Chip>
                        </div>
                        <h3 className="text-text font-medium">
                          {note.title || "제목 없음"}
                        </h3>
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
                        {note.comment && (
                          <p className="mt-2 text-sm text-textSecondary line-clamp-2">
                            {note.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 작성 탭 */}
        {activeTab === "write" && <WriteSection cb={handleActiveTab} />}
      </div>
    </div>
  );
}
