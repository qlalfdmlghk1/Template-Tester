import { useEffect, useState } from "react";

/**
 * 값이 잠잠해질 때까지 기다렸다가 반영한다.
 *
 * 검색어처럼 타이핑마다 바뀌는 값을 그대로 흘려보내면 필터링·주소 갱신이
 * 글자 수만큼 일어난다. 마지막 입력 후 `delay` 만큼 조용해야 넘긴다.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    // 다음 입력이 들어오면 이전 예약을 취소한다
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
