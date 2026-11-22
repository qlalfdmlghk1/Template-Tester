import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/model/useAuth";
import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { AppTextInput } from "@/shared/ui/atoms/AppTextInput";
import AppFallback from "@/shared/ui/molecules/AppFallback/AppFallback";
import { useFriendList } from "@/entities/friend/model/useFriendList";
import { useFriendRequests } from "@/entities/friend/model/useFriendRequests";
import { useFriendSearch } from "@/entities/friend/model/useFriendSearch";

type TabType = "list" | "requests" | "add";

export default function Friends() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("list");

  const { friends, isLoading: isListLoading, loadFriendList, handleDeleteFriend } = useFriendList();
  const {
    receivedRequests,
    sentRequests,
    isLoading: isRequestsLoading,
    loadRequests,
    handleAccept,
    handleReject,
    handleCancelRequest,
  } = useFriendRequests();
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    handleSearch,
    handleSendRequest,
    getRequestButtonText,
    isRequestDisabled,
  } = useFriendSearch(user?.uid);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    if (activeTab === "list") {
      loadFriendList();
    } else if (activeTab === "requests") {
      loadRequests();
    }
  }, [activeTab, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-textSecondary">로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <PageHeader title="친구" />

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mt-6 border-b border-border">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "list"
                ? "border-primary text-primary"
                : "border-transparent text-textSecondary hover:text-text"
            }`}
          >
            친구 목록
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "requests"
                ? "border-primary text-primary"
                : "border-transparent text-textSecondary hover:text-text"
            }`}
          >
            요청 관리
            {receivedRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {receivedRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "add"
                ? "border-primary text-primary"
                : "border-transparent text-textSecondary hover:text-text"
            }`}
          >
            친구 추가
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="mt-6">
          {/* 친구 목록 탭 */}
          {activeTab === "list" && (
            <div>
              {isListLoading ? (
                <div className="text-center py-12 text-textSecondary">불러오는 중...</div>
              ) : friends.length === 0 ? (
                <AppFallback
                  type="empty"
                  title="아직 친구가 없습니다."
                  description="닉네임을 검색해서 친구를 추가해보세요."
                  buttonText="친구 추가하기"
                  buttonIcon={null}
                  onAction={() => setActiveTab("add")}
                />
              ) : (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div
                      key={friend.odUserId}
                      className="p-4 bg-surface border border-border rounded-lg flex items-center justify-between hover:border-primary transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {friend.photoURL ? (
                          <img
                            src={friend.photoURL}
                            alt={friend.displayName || "User"}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            👤
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-text">{friend.displayName || "이름 없음"}</p>
                          <p className="text-sm text-textSecondary">{friend.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteFriend(friend.odUserId)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 요청 관리 탭 */}
          {activeTab === "requests" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text mb-3">받은 요청</h3>
                {isRequestsLoading ? (
                  <div className="text-center py-8 text-textSecondary">불러오는 중...</div>
                ) : receivedRequests.length === 0 ? (
                  <AppFallback
                    type="empty"
                    title="받은 친구 요청이 없습니다."
                    description="친구가 요청을 보내면 여기에 표시됩니다."
                    hideButton
                  />
                ) : (
                  <div className="space-y-3">
                    {receivedRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 bg-surface border border-border rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {request.requesterPhotoURL ? (
                            <img
                              src={request.requesterPhotoURL}
                              alt={request.requesterDisplayName || "User"}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              👤
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-text">{request.requesterDisplayName || "이름 없음"}</p>
                            <p className="text-sm text-textSecondary">{request.requesterEmail}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <AppButton variant="solid" size="sm" onClick={() => handleAccept(request.id!)}>
                            수락
                          </AppButton>
                          <AppButton variant="outline" size="sm" onClick={() => handleReject(request.id!)}>
                            거절
                          </AppButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-text mb-3">보낸 요청</h3>
                {sentRequests.length === 0 ? (
                  <AppFallback
                    type="empty"
                    title="보낸 친구 요청이 없습니다."
                    description="친구를 검색해서 요청을 보내보세요."
                    hideButton
                  />
                ) : (
                  <div className="space-y-3">
                    {sentRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 bg-surface border border-border rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {request.receiverPhotoURL ? (
                            <img
                              src={request.receiverPhotoURL}
                              alt={request.receiverDisplayName || "User"}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              👤
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-text">{request.receiverDisplayName || "이름 없음"}</p>
                            <p className="text-sm text-textSecondary">{request.receiverEmail}</p>
                          </div>
                        </div>
                        <AppButton variant="outline" size="sm" onClick={() => handleCancelRequest(request.id!)}>
                          취소
                        </AppButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 친구 추가 탭 */}
          {activeTab === "add" && (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-text mb-2">닉네임 또는 이메일로 검색</label>
                <div className="flex gap-2">
                  <AppTextInput
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="닉네임 또는 이메일을 입력하세요"
                    aria-label="닉네임 또는 이메일로 검색"
                    className="flex-1"
                  />
                  <AppButton variant="solid" onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? "검색 중..." : "검색"}
                  </AppButton>
                </div>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-textSecondary">검색 결과 ({searchResults.length}명)</h3>
                  {searchResults.map((searchUser) => (
                    <div
                      key={searchUser.uid}
                      className="p-4 bg-surface border border-border rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {searchUser.photoURL ? (
                          <img
                            src={searchUser.photoURL}
                            alt={searchUser.displayName || "User"}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            👤
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-text">{searchUser.displayName || "이름 없음"}</p>
                          <p className="text-sm text-textSecondary">{searchUser.email}</p>
                        </div>
                      </div>
                      <AppButton
                        variant={isRequestDisabled(searchUser.uid) ? "outline" : "solid"}
                        size="sm"
                        disabled={isRequestDisabled(searchUser.uid)}
                        onClick={() => handleSendRequest(searchUser.uid)}
                      >
                        {getRequestButtonText(searchUser.uid)}
                      </AppButton>
                    </div>
                  ))}
                </div>
              ) : searchQuery && !isSearching ? (
                <AppFallback
                  type="empty"
                  title="검색 결과가 없습니다."
                  description="다른 닉네임으로 다시 검색해보세요."
                  hideButton
                />
              ) : (
                <AppFallback
                  type="empty"
                  title="닉네임을 검색해서 친구를 추가해보세요."
                  description="위 검색창에 닉네임 또는 이메일을 입력하세요."
                  hideButton
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
