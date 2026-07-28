import { useState } from "react";
import {
  getFriendList,
  getFriendshipStatus,
  deleteFriendship,
} from "../api/friend.api";
import type { FriendInfo } from "./friend.type";

export function useFriendList() {
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleDeleteFriend = async (friendUserId: string) => {
    if (!confirm("정말 이 친구를 삭제하시겠습니까?")) return;

    try {
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

  return {
    friends,
    isLoading,
    loadFriendList,
    handleDeleteFriend,
  };
}
