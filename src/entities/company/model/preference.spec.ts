import { describe, it, expect } from "vitest";
import { sortByPreference, preferenceOrder } from "./preference";
import type { Company, CompanyPreference } from "./company.type";

function makeCompany(name: string, preference?: CompanyPreference): Company {
  return {
    id: name,
    userId: "u1",
    name,
    preference,
    createdAt: new Date("2026-01-01"),
  };
}

describe("sortByPreference", () => {
  it("등급이 높은 기업이 먼저 와야 한다", () => {
    const sorted = sortByPreference([
      makeCompany("씨기업", "C"),
      makeCompany("에이기업", "A"),
      makeCompany("디기업", "D"),
      makeCompany("비기업", "B"),
    ]);

    expect(sorted.map((company) => company.name)).toEqual([
      "에이기업",
      "비기업",
      "씨기업",
      "디기업",
    ]);
  });

  it("등급을 안 매긴 기업은 D보다도 뒤에 와야 한다", () => {
    // 아직 안 정한 것과 안 갈 것은 다르다
    const sorted = sortByPreference([
      makeCompany("미지정"),
      makeCompany("디기업", "D"),
    ]);

    expect(sorted.map((company) => company.name)).toEqual(["디기업", "미지정"]);
  });

  it("같은 등급이면 기업명 가나다순이어야 한다", () => {
    const sorted = sortByPreference([
      makeCompany("하나은행", "A"),
      makeCompany("가나기업", "A"),
    ]);

    expect(sorted.map((company) => company.name)).toEqual(["가나기업", "하나은행"]);
  });

  it("등급이 모두 없으면 기업명 가나다순이어야 한다", () => {
    const sorted = sortByPreference([makeCompany("나기업"), makeCompany("가기업")]);

    expect(sorted.map((company) => company.name)).toEqual(["가기업", "나기업"]);
  });

  it("원본 배열을 바꾸지 않아야 한다", () => {
    const original = [makeCompany("씨기업", "C"), makeCompany("에이기업", "A")];

    sortByPreference(original);

    expect(original.map((company) => company.name)).toEqual(["씨기업", "에이기업"]);
  });
});

describe("preferenceOrder", () => {
  it("알 수 없는 등급이 저장돼 있어도 미지정과 같이 뒤로 보내야 한다", () => {
    // 손으로 데이터를 고치거나 등급 체계가 바뀌는 경우를 대비한다
    const unknown = { ...makeCompany("이상"), preference: "X" as CompanyPreference };

    expect(preferenceOrder(unknown)).toBe(preferenceOrder(makeCompany("미지정")));
  });
});
