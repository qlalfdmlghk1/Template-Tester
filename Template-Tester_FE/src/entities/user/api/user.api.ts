import { api } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/api.type";
import type { UserProfile } from "../model/user.type";

export async function searchUserByDisplayName(
  searchQuery: string,
): Promise<UserProfile[]> {
  try {
    const { data } = await api.get<ApiResponse<UserProfile[]>>("/users/search", {
      params: { q: searchQuery },
    });
    return data.data;
  } catch (error) {
    console.error("사용자 검색 실패:", error);
    throw error;
  }
}
