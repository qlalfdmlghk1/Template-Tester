import { useState } from "react";
import {
  getReceivedFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  deleteFriendship,
} from "../api/friend.api";
import type { Friendship } from "./friend.type";

export function useFriendRequests() {
  const [receivedRequests, setReceivedRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const [received, sent] = await Promise.all([
        getReceivedFriendRequests(),
        getSentFriendRequests(),
      ]);
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

  return {
    receivedRequests,
    sentRequests,
    isLoading,
    loadRequests,
    handleAccept,
    handleReject,
    handleCancelRequest,
  };
}
