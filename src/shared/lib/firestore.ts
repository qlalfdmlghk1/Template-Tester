import { deleteField } from "firebase/firestore";
import type { FieldValue } from "firebase/firestore";

/**
 * Firestore는 문서 필드에 undefined를 허용하지 않는다.
 * 선택 필드를 그대로 넘기면 저장이 실패하므로 쓰기 전에 걷어낸다.
 *
 * ⚠️ **생성(addDoc) 전용이다.** update 에 쓰면 값을 지울 수 없다 —
 * 키가 페이로드에서 빠지면 Firestore는 그 필드를 변경 없이 유지하므로,
 * 폼에서 값을 비워 undefined 로 보낸 것이 "안 건드림"으로 해석된다.
 * 수정 경로에는 `toUpdatePayload` 를 쓴다.
 */
export function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  const result: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue;
    result[key] = isPlainObject(item) ? stripUndefined(item) : item;
  }

  return result as Partial<T>;
}

/**
 * 수정(updateDoc) 페이로드.
 *
 * `undefined` 를 걷어내는 대신 `deleteField()` 로 바꿔, 폼에서 비운 값이 실제로 지워지게 한다.
 * 중첩 객체는 통째로 교체되므로 안쪽까지 훑지 않는다.
 */
export function toUpdatePayload<T extends Record<string, unknown>>(
  value: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(value)) {
    result[key] = item === undefined ? (deleteField() as FieldValue) : item;
  }

  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
