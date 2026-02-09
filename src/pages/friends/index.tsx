import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/model/useAuth";
import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import {
  getFriendList,
  getReceivedFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  deleteFriendship,
  sendFriendRequest,
  getFriendshipStatus,
} from "@/entities/friend/api/friend.api";
import { searchUserByDisplayName } from "@/entities/user/api/user.api";
import type { FriendInfo, Friendship } from "@/entities/friend/model/friend.type";
import type { UserProfile } from "@/entities/user/model/user.type";

type TabType = "list" | "requests" | "add";

export default function Friends() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("list");
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 친구 추가 탭 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedUserStatuses, setSearchedUserStatuses] = useState<Record<string, Friendship | null>>({});

  // 로그인 체크
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (!user) return;

    if (activeTab === "list") {
      loadFriendList();
    } else if (activeTab === "requests") {
      loadRequests();
    }
  }, [activeTab, user]);

  const loadFriendList = async () => {
    setIsLoading(true);
    try {
      const data = await getFriendList();
      setFriends(data);
    } catch (error) {
      console.error("친구 목록 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const [received, sent] = await Promise.all([getReceivedFriendRequests(), getSentFriendRequests()]);
      setReceivedRequests(received);
      setSentRequests(sent);
    } catch (error) {
      console.error("친구 요청 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (friendshipId: string) => {
    try {
      await acceptFriendRequest(friendshipId);
      alert("친구 요청을 수락했습니다.");
      loadRequests();
    } catch (error) {
      console.error("친구 수락 실패:", error);
      alert("친구 요청 수락에 실패했습니다.");
    }
  };

  const handleReject = async (friendshipId: string) => {
    try {
      await rejectFriendRequest(friendshipId);
      alert("친구 요청을 거절했습니다.");
      loadRequests();
    } catch (error) {
      console.error("친구 거절 실패:", error);
      alert("친구 요청 거절에 실패했습니다.");
    }
  };

  const handleCancelRequest = async (friendshipId: string) => {
    try {
      await deleteFriendship(friendshipId);
      alert("친구 요청을 취소했습니다.");
      loadRequests();
    } catch (error) {
      console.error("요청 취소 실패:", error);
      alert("친구 요청 취소에 실패했습니다.");
    }
  };

  const handleDeleteFriend = async (friendUserId: string) => {
    if (!confirm("정말 이 친구를 삭제하시겠습니까?")) return;

    try {
      // 친구 관계 ID 찾기
      const status = await getFriendshipStatus(friendUserId);
      if (status?.id) {
        await deleteFriendship(status.id);
        alert("친구를 삭제했습니다.");
        loadFriendList();
      }
    } catch (error) {
      console.error("친구 삭제 실패:", error);
      alert("친구 삭제에 실패했습니다.");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchUserByDisplayName(searchQuery.trim());
      setSearchResults(results);

      // 각 사용자의 친구 관계 상태 확인
      const statuses: Record<string, Friendship | null> = {};
      for (const user of results) {
        const status = await getFriendshipStatus(user.uid);
        statuses[user.uid] = status;
      }
      setSearchedUserStatuses(statuses);
    } catch (error) {
      console.error("사용자 검색 실패:", error);
      alert("사용자 검색에 실패했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (receiverUserId: string) => {
    try {
      await sendFriendRequest(receiverUserId);
      alert("친구 요청을 보냈습니다.");
      // 상태 업데이트
      const status = await getFriendshipStatus(receiverUserId);
      setSearchedUserStatuses((prev) => ({
        ...prev,
        [receiverUserId]: status,
      }));
    } catch (error: any) {
      console.error("친구 요청 실패:", error);
      alert(error.message || "친구 요청에 실패했습니다.");
    }
  };

  const getRequestButtonText = (userId: string): string => {
    const status = searchedUserStatuses[userId];
    if (!status) return "친구 요청";
    if (status.status === "accepted") return "이미 친구";
    if (status.status === "pending") {
      if (status.requesterId === user?.uid) return "요청 보냄";
      return "요청 받음";
    }
    return "친구 요청";
  };

  const isRequestDisabled = (userId: string): boolean => {
    const status = searchedUserStatuses[userId];
    if (!status) return false;
    return status.status === "accepted" || status.status === "pending";
  };

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
              {isLoading ? (
                <div className="text-center py-12 text-textSecondary">불러오는 중...</div>
              ) : friends.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">👥</div>
                  <p className="text-textSecondary mb-4">아직 친구가 없습니다.</p>
                  <AppButton variant="solid" size="md" onClick={() => setActiveTab("add")}>
                    친구 추가하기
                  </AppButton>
                </div>
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
              {/* 받은 요청 */}
              <div>
                <h3 className="text-lg font-semibold text-text mb-3">받은 요청</h3>
                {isLoading ? (
                  <div className="text-center py-8 text-textSecondary">불러오는 중...</div>
                ) : receivedRequests.length === 0 ? (
                  <div className="text-center py-8 bg-surface border border-border rounded-lg">
                    <p className="text-textSecondary">받은 친구 요청이 없습니다.</p>
                  </div>
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

              {/* 보낸 요청 */}
              <div>
                <h3 className="text-lg font-semibold text-text mb-3">보낸 요청</h3>
                {sentRequests.length === 0 ? (
                  <div className="text-center py-8 bg-surface border border-border rounded-lg">
                    <p className="text-textSecondary">보낸 친구 요청이 없습니다.</p>
                  </div>
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
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="닉네임 또는 이메일을 입력하세요"
                    className="flex-1 px-4 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:border-primary"
                  />
                  <AppButton variant="solid" onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? "검색 중..." : "검색"}
                  </AppButton>
                </div>
              </div>

              {/* 검색 결과 */}
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
                <div className="text-center py-12 bg-surface border border-border rounded-lg">
                  <p className="text-textSecondary">검색 결과가 없습니다.</p>
                </div>
              ) : (
                <div className="text-center py-12 bg-surface border border-border rounded-lg">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-textSecondary">닉네임을 검색해서 친구를 추가해보세요.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
