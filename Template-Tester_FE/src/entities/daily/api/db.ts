// Daily 학습용 IndexedDB 래퍼 (기획서 3.6.3 스키마)
// 네이티브 IndexedDB API 직접 사용 (idb 라이브러리 미도입)

export const DB_NAME = "template-tester-daily";
export const DB_VERSION = 1;

/** object store 이름 */
export const STORE = {
  subjects: "subjects",
  concepts: "concepts",
  attempts: "attempts",
} as const;

export type StoreName = (typeof STORE)[keyof typeof STORE];

let dbPromise: Promise<IDBDatabase> | null = null;

/** DB 연결 (최초 1회 스키마 생성, 이후 캐싱된 연결 재사용) */
export function openDailyDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE.subjects)) {
        db.createObjectStore(STORE.subjects, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORE.concepts)) {
        const concepts = db.createObjectStore(STORE.concepts, { keyPath: "id" });
        concepts.createIndex("by_subject", "subjectId", { unique: false });
        concepts.createIndex("by_nextReview", "nextReviewAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE.attempts)) {
        const attempts = db.createObjectStore(STORE.attempts, { keyPath: "id" });
        attempts.createIndex("by_concept", "conceptId", { unique: false });
        attempts.createIndex("by_solvedAt", "solvedAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/** IDBRequest → Promise 변환 */
function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** 쓰기 트랜잭션 완료 대기 */
function awaitTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// ===== 제네릭 CRUD 헬퍼 =====

/** 전체 조회 */
export async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDailyDB();
  const request = db.transaction(store, "readonly").objectStore(store).getAll();
  return promisifyRequest<T[]>(request);
}

/** id로 단건 조회 (없으면 undefined) */
export async function getById<T>(
  store: StoreName,
  id: string,
): Promise<T | undefined> {
  const db = await openDailyDB();
  const request = db.transaction(store, "readonly").objectStore(store).get(id);
  return promisifyRequest<T | undefined>(request);
}

/** 인덱스 + 키 범위로 조회 */
export async function getAllByIndex<T>(
  store: StoreName,
  indexName: string,
  query: IDBValidKey | IDBKeyRange,
): Promise<T[]> {
  const db = await openDailyDB();
  const request = db
    .transaction(store, "readonly")
    .objectStore(store)
    .index(indexName)
    .getAll(query);
  return promisifyRequest<T[]>(request);
}

/** 저장 (upsert) */
export async function putRecord<T>(store: StoreName, value: T): Promise<T> {
  const db = await openDailyDB();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).put(value);
  await awaitTransaction(tx);
  return value;
}

/** 삭제 */
export async function removeRecord(store: StoreName, id: string): Promise<void> {
  const db = await openDailyDB();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).delete(id);
  await awaitTransaction(tx);
}
