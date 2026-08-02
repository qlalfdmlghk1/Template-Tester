/**
 * Firestore는 문서 필드에 undefined를 허용하지 않는다.
 * 선택 필드를 그대로 넘기면 저장이 실패하므로 쓰기 전에 걷어낸다.
 */
export function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  const result: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue;
    result[key] = isPlainObject(item) ? stripUndefined(item) : item;
  }

  return result as Partial<T>;
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
