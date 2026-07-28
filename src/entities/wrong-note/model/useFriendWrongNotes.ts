import { useState } from "react";
import { getFriendsSharedWrongNotes } from "../api/wrong-note.api";
import { getFriendList } from "@/entities/friend/api/friend.api";
import type { WrongNote, Filters } from "./wrong-note.type";
import type { FriendInfo } from "@/entities/friend/model/friend.type";

export function useFriendWrongNotes() {
  const [friendNotes, setFriendNotes] = useState<WrongNote[]>([]);
  const [friendList, setFriendList] = useState<FriendInfo[]>([]);
  const [isFriendNotesLoading, setIsFriendNotesLoading] = useState(false);
  const [friendFilter, setFriendFilter] = useState("");

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

  const getFriendDisplayName = (userId: string): string => {
    const friend = friendList.find((f) => f.odUserId === userId);
    return friend?.displayName || friend?.email || "알 수 없음";
  };

  const getFilteredFriendNotes = (filters: Filters, searchQuery: string) => {
    return friendNotes.filter((note) => {
      if (friendFilter && note.userId !== friendFilter) return false;
      if (filters.platform && note.platform !== filters.platform) return false;
      if (filters.category && note.category !== filters.category) return false;
      if (filters.result && note.result !== filters.result) return false;
      if (filters.language && note.language !== filters.language) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title?.toLowerCase().includes(query);
        const matchesLink = note.link?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesLink) return false;
      }
      return true;
    });
  };

  return {
    friendNotes,
    friendList,
    friendFilter,
    setFriendFilter,
    isFriendNotesLoading,
    loadFriendNotes,
    getFriendDisplayName,
    getFilteredFriendNotes,
  };
}
