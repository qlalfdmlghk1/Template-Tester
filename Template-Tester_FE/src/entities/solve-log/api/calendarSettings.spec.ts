import { describe, it, expect } from "vitest";
import { parseRepoPath } from "./calendarSettings.api";

describe("parseRepoPath", () => {
  it("owner/repo 형식을 파싱해야 한다", () => {
    expect(parseRepoPath("qlalfdmlghk1/Algorism_Python")).toEqual({
      owner: "qlalfdmlghk1",
      repo: "Algorism_Python",
    });
  });

  it("전체 URL을 붙여넣어도 파싱해야 한다", () => {
    expect(parseRepoPath("https://github.com/qlalfdmlghk1/Algorism_Python")).toEqual({
      owner: "qlalfdmlghk1",
      repo: "Algorism_Python",
    });
  });

  it("www와 http도 처리해야 한다", () => {
    expect(parseRepoPath("http://www.github.com/owner/repo")).toEqual({
      owner: "owner",
      repo: "repo",
    });
  });

  it("끝의 .git과 슬래시를 떼야 한다", () => {
    expect(parseRepoPath("https://github.com/owner/repo.git")).toEqual({
      owner: "owner",
      repo: "repo",
    });
    expect(parseRepoPath("owner/repo/")).toEqual({ owner: "owner", repo: "repo" });
  });

  it("앞뒤 공백을 무시해야 한다", () => {
    expect(parseRepoPath("  owner/repo  ")).toEqual({ owner: "owner", repo: "repo" });
  });

  it("형식이 아니면 null이어야 한다", () => {
    expect(parseRepoPath("owner")).toBeNull();
    expect(parseRepoPath("owner/repo/extra")).toBeNull();
    expect(parseRepoPath("")).toBeNull();
    expect(parseRepoPath("/repo")).toBeNull();
  });
});
