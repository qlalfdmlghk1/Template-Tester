import { api } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/api.type";
import type { WrongNote } from "../model/wrong-note.type";

export async function saveWrongNote(
  data: Omit<WrongNote, "id" | "userId" | "userEmail" | "createdAt">,
): Promise<string> {
  try {
    const { data: res } = await api.post<ApiResponse<{ id: string }>>(
      "/wrong-notes",
      data,
    );
    return res.data.id;
  } catch (error) {
    console.error("오답노트 저장 실패:", error);
    throw error;
  }
}

export async function getWrongNotes(): Promise<WrongNote[]> {
  try {
    const { data } = await api.get<ApiResponse<WrongNote[]>>("/wrong-notes");
    return data.data;
  } catch (error) {
    console.error("오답노트 조회 실패:", error);
    throw error;
  }
}

export async function updateWrongNote(
  noteId: string,
  data: Omit<WrongNote, "id" | "userId" | "userEmail" | "createdAt">,
): Promise<void> {
  try {
    await api.put(`/wrong-notes/${noteId}`, data);
  } catch (error) {
    console.error("오답노트 수정 실패:", error);
    throw error;
  }
}

export async function deleteWrongNote(noteId: string): Promise<void> {
  try {
    await api.delete(`/wrong-notes/${noteId}`);
  } catch (error) {
    console.error("오답노트 삭제 실패:", error);
    throw error;
  }
}

export async function getFriendsSharedWrongNotes(): Promise<WrongNote[]> {
  try {
    const { data } = await api.get<ApiResponse<WrongNote[]>>(
      "/wrong-notes/friends/shared",
    );
    return data.data;
  } catch (error) {
    console.error("친구 오답노트 조회 실패:", error);
    throw error;
  }
}

export async function getWrongNoteById(
  noteId: string,
): Promise<{ note: WrongNote | null; isOwner: boolean }> {
  try {
    const { data } = await api.get<
      ApiResponse<{ note: WrongNote | null; isOwner: boolean }>
    >(`/wrong-notes/${noteId}`);
    return data.data;
  } catch (error) {
    console.error("오답노트 조회 실패:", error);
    throw error;
  }
}

export async function getFriendSharedWrongNotes(
  friendUserId: string,
): Promise<WrongNote[]> {
  try {
    const { data } = await api.get<ApiResponse<WrongNote[]>>(
      `/wrong-notes/friends/${friendUserId}`,
    );
    return data.data;
  } catch (error) {
    console.error("친구 오답노트 조회 실패:", error);
    throw error;
  }
}
