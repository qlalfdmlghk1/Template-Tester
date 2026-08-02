import { describe, it, expect } from "vitest";
import { safeUrl } from "./safeUrl";

describe("safeUrl", () => {
  it("http·https 주소는 통과시킨다", () => {
    expect(safeUrl("https://koscom.applyin.co.kr/jobs/20925")).toBe(
      "https://koscom.applyin.co.kr/jobs/20925",
    );
    expect(safeUrl("http://example.com/")).toBe("http://example.com/");
  });

  it("mailto 는 허용한다", () => {
    expect(safeUrl("mailto:hr@example.com")).toBe("mailto:hr@example.com");
  });

  it("javascript· data 스킴은 막는다 — 외부 파일에서 들어온 값이 그대로 저장된다", () => {
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("JavaScript:alert(1)")).toBeNull();
    expect(safeUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeUrl("vbscript:msgbox(1)")).toBeNull();
  });

  it("앞뒤 공백이 섞인 위험 스킴도 막는다", () => {
    expect(safeUrl("  javascript:alert(1)  ")).toBeNull();
  });

  it("빈 값은 null", () => {
    expect(safeUrl(null)).toBeNull();
    expect(safeUrl(undefined)).toBeNull();
    expect(safeUrl("   ")).toBeNull();
  });

  it("주소로 해석되지 않으면 null", () => {
    expect(safeUrl("http://")).toBeNull();
  });
});
