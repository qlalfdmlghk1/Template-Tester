import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getWrongNoteById, deleteWrongNote } from "../api/wrong-note.api";
import type { WrongNote, FormData } from "./wrong-note.type";

export function useWrongNoteDetail(id: string | undefined) {
  const navigate = useNavigate();
  const [note, setNote] = useState<WrongNote | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const loadNote = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const { note: found, isOwner: owner } = await getWrongNoteById(id);
        setNote(found);
        setIsOwner(owner);
      } catch (error) {
        console.error("조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNote();
  }, [id]);

  const handleDelete = async () => {
    if (!note?.id || !confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteWrongNote(note.id);
      navigate("/wrong-notes");
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  const noteToFormData = (n: WrongNote): FormData => ({
    title: n.title || "",
    link: n.link,
    language: n.language || "",
    date: n.date,
    platform: n.platform,
    grade: n.grade,
    category: n.category,
    myCode: n.myCode,
    solution: n.solution,
    comment: n.comment,
    share: n.share,
    tags: n.tags,
    result: n.result,
  });

  const handleSaveSuccess = () => {
    if (note) {
      const updatedNote = { ...note };
      setNote(updatedNote);
    }
    setIsEditMode(false);
    alert("수정되었습니다.");
  };

  const handleCancel = () => {
    setIsEditMode(false);
  };

  return {
    note,
    isOwner,
    isLoading,
    isEditMode,
    setIsEditMode,
    handleDelete,
    handleCancel,
    handleSaveSuccess,
    noteToFormData,
  };
}
