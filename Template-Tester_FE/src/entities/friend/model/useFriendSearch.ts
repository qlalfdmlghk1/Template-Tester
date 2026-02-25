import { useState } from "react";
import { sendFriendRequest, getFriendshipStatus } from "../api/friend.api";
import { searchUserByDisplayName } from "@/entities/user/api/user.api";
import type { Friendship } from "./friend.type";
import type { UserProfile } from "@/entities/user/model/user.type";

export function useFriendSearch(currentUserId?: string) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedUserStatuses, setSearchedUserStatuses] = useState<
    Record<string, Friendship | null>
  >({});

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchUserByDisplayName(searchQuery.trim());
      setSearchResults(results);

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
      const status = await getFriendshipStatus(receiverUserId);
      setSearchedUserStatuses((prev) => ({
        ...prev,
        [receiverUserId]: status,
      }));
    } catch (error: unknown) {
      console.error("친구 요청 실패:", error);
      const message = error instanceof Error ? error.message : "친구 요청에 실패했습니다.";
      alert(message);
    }
  };

  const getRequestButtonText = (userId: string): string => {
    const status = searchedUserStatuses[userId];
    if (!status) return "친구 요청";
    if (status.status === "accepted") return "이미 친구";
    if (status.status === "pending") {
      if (status.requesterId === currentUserId) return "요청 보냄";
      return "요청 받음";
    }
    return "친구 요청";
  };

  const isRequestDisabled = (userId: string): boolean => {
    const status = searchedUserStatuses[userId];
    if (!status) return false;
    return status.status === "accepted" || status.status === "pending";
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    handleSearch,
    handleSendRequest,
    getRequestButtonText,
    isRequestDisabled,
  };
}
