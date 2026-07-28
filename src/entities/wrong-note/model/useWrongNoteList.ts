import { useState } from "react";
import { getWrongNotes, deleteWrongNote } from "../api/wrong-note.api";
import type { WrongNote, Filters } from "./wrong-note.type";

export function useWrongNoteList() {
  const [notes, setNotes] = useState<WrongNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const getFilteredNotes = (filters: Filters, searchQuery: string) => {
    return notes.filter((note) => {
      if (filters.platform && note.platform !== filters.platform) return false;
      if (filters.category && note.category !== filters.category) return false;
      if (filters.result && note.result !== filters.result) return false;
      if (filters.language && note.language !== filters.language) return false;
      if (filters.tag && !note.tags.includes(filters.tag)) return false;
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
    notes,
    isLoading,
    loadNotes,
    handleDelete,
    getFilteredNotes,
  };
}
