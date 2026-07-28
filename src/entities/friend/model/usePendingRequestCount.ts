import { useState, useEffect } from "react";
import { getReceivedFriendRequests } from "../api/friend.api";

export function usePendingRequestCount(isLoggedIn: boolean) {
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadPendingRequests = async () => {
      try {
        const requests = await getReceivedFriendRequests();
        setPendingRequestCount(requests.length);
      } catch (error) {
        console.error("친구 요청 수 로드 실패:", error);
      }
    };

    loadPendingRequests();
    const interval = setInterval(loadPendingRequests, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  return { pendingRequestCount };
}
