/**
 * 클립보드·파일에서 받은 이미지를 API 로 보낼 수 있는 형태로 바꾼다.
 *
 * 화면 캡처(Win+Shift+S 등)는 클립보드에 이미지로 들어오므로 붙여넣기 이벤트에서
 * 곧바로 꺼낼 수 있다. 별도 업로드 저장소를 쓰지 않고 요청에 실어 보낸다.
 */

export interface ReadImageOptions {
  /** 허용할 MIME 타입 */
  allowedTypes: readonly string[];
  /** 한 장의 용량 상한 (바이트) */
  maxBytes: number;
}

export type ReadImageFailure = "type" | "size" | "read";

export interface ReadImageResult {
  mediaType: string;
  data: string;
  /** 미리보기용 data URL */
  dataUrl: string;
}

/** 실패 사유를 문구로 — 무엇을 고쳐야 하는지 알려준다 */
export const READ_IMAGE_MESSAGES: Record<ReadImageFailure, string> = {
  type: "PNG·JPG·WEBP·GIF 이미지만 붙여넣을 수 있습니다.",
  size: "이미지가 너무 큽니다. 화면 일부만 잘라 캡처해 주세요.",
  read: "이미지를 읽지 못했습니다. 다시 캡처해 주세요.",
};

/** data URL 에서 base64 본문만 떼어낸다 */
export function toBase64Payload(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

/**
 * 파일 하나를 검사해 base64 로 바꾼다.
 * 통과하지 못하면 사유를 돌려준다 — 던지지 않는 것은 여러 장을 한 번에 붙여넣을 때
 * 한 장이 걸려도 나머지를 살리기 위해서다.
 */
export async function readImageFile(
  file: File,
  { allowedTypes, maxBytes }: ReadImageOptions,
): Promise<ReadImageResult | ReadImageFailure> {
  if (!allowedTypes.includes(file.type)) return "type";
  if (file.size > maxBytes) return "size";

  const dataUrl = await new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

  if (!dataUrl) return "read";

  return { mediaType: file.type, data: toBase64Payload(dataUrl), dataUrl };
}

/** 붙여넣기 이벤트에서 이미지 파일만 골라낸다 */
export function pickImageFiles(items: DataTransferItemList | null): File[] {
  if (!items) return [];

  const files: File[] = [];
  for (const item of Array.from(items)) {
    if (item.kind !== "file" || !item.type.startsWith("image/")) continue;
    const file = item.getAsFile();
    if (file) files.push(file);
  }

  return files;
}
