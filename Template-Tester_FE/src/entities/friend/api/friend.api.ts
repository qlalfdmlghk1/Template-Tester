import { api } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/api.type";
import type { Friendship, FriendInfo } from "../model/friend.type";

export async function getFriendshipStatus(
  otherUserId: string,
): Promise<Friendship | null> {
  try {
    const { data } = await api.get<ApiResponse<Friendship | null>>(
      `/friends/status/${otherUserId}`,
    );
    return data.data;
  } catch (error) {
    console.error("친구 관계 확인 실패:", error);
    throw error;
  }
}

export async function sendFriendRequest(receiverUserId: string): Promise<string> {
  try {
    const { data } = await api.post<ApiResponse<{ id: string }>>("/friends/requests", {
      receiverUserId,
    });
    return data.data.id;
  } catch (error: any) {
    const message = error.response?.data?.message;
    if (message) {
      throw new Error(message);
    }
    console.error("친구 요청 전송 실패:", error);
    throw error;
  }
}

export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  try {
    await api.put(`/friends/requests/${friendshipId}/accept`);
  } catch (error) {
    console.error("친구 요청 수락 실패:", error);
    throw error;
  }
}

export async function rejectFriendRequest(friendshipId: string): Promise<void> {
  try {
    await api.put(`/friends/requests/${friendshipId}/reject`);
  } catch (error) {
    console.error("친구 요청 거절 실패:", error);
    throw error;
  }
}

export async function deleteFriendship(friendshipId: string): Promise<void> {
  try {
    await api.delete(`/friends/${friendshipId}`);
  } catch (error) {
    console.error("친구 삭제 실패:", error);
    throw error;
  }
}

export async function getSentFriendRequests(): Promise<Friendship[]> {
  try {
    const { data } = await api.get<ApiResponse<Friendship[]>>("/friends/requests/sent");
    return data.data;
  } catch (error) {
    console.error("보낸 친구 요청 조회 실패:", error);
    throw error;
  }
}

export async function getReceivedFriendRequests(): Promise<Friendship[]> {
  try {
    const { data } = await api.get<ApiResponse<Friendship[]>>("/friends/requests/received");
    return data.data;
  } catch (error) {
    console.error("받은 친구 요청 조회 실패:", error);
    throw error;
  }
}

export async function getFriendList(): Promise<FriendInfo[]> {
  try {
    const { data } = await api.get<ApiResponse<FriendInfo[]>>("/friends");
    return data.data;
  } catch (error) {
    console.error("친구 목록 조회 실패:", error);
    throw error;
  }
}
