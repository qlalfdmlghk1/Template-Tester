import { describe, it, expect } from "vitest";
import { pickImageFiles, readImageFile, toBase64Payload } from "./clipboardImage";

const OPTIONS = {
  allowedTypes: ["image/png", "image/jpeg"] as const,
  maxBytes: 100,
};

function makeFile(type: string, size: number): File {
  return new File([new Uint8Array(size)], "capture.png", { type });
}

/** DataTransferItemList 를 흉내 낸다 — jsdom 에는 클립보드 항목 생성 수단이 없다 */
function makeItems(
  entries: { kind: string; type: string; file: File | null }[],
): DataTransferItemList {
  return entries.map((entry) => ({
    kind: entry.kind,
    type: entry.type,
    getAsFile: () => entry.file,
  })) as unknown as DataTransferItemList;
}

describe("toBase64Payload", () => {
  it("data URL 접두사를 떼어내야 한다", () => {
    expect(toBase64Payload("data:image/png;base64,AAAA")).toBe("AAAA");
  });

  it("접두사가 없으면 그대로 둬야 한다", () => {
    expect(toBase64Payload("AAAA")).toBe("AAAA");
  });
});

describe("pickImageFiles", () => {
  it("이미지 파일만 골라야 한다", () => {
    const png = makeFile("image/png", 10);
    const items = makeItems([
      { kind: "file", type: "image/png", file: png },
      { kind: "string", type: "text/plain", file: null },
      { kind: "file", type: "application/pdf", file: makeFile("application/pdf", 10) },
    ]);

    expect(pickImageFiles(items)).toEqual([png]);
  });

  it("항목이 없으면 빈 배열이어야 한다", () => {
    expect(pickImageFiles(null)).toEqual([]);
  });
});

describe("readImageFile", () => {
  it("허용하지 않는 형식은 type 으로 거절해야 한다", async () => {
    expect(await readImageFile(makeFile("image/bmp", 10), OPTIONS)).toBe("type");
  });

  it("용량을 넘기면 size 로 거절해야 한다", async () => {
    expect(await readImageFile(makeFile("image/png", 200), OPTIONS)).toBe("size");
  });

  it("통과하면 base64 와 미리보기 URL 을 줘야 한다", async () => {
    const result = await readImageFile(makeFile("image/png", 10), OPTIONS);

    expect(typeof result).not.toBe("string");
    if (typeof result === "string") return;

    expect(result.mediaType).toBe("image/png");
    expect(result.dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    // API 로는 접두사 없는 본문만 보낸다
    expect(result.data.includes(",")).toBe(false);
  });
});
