import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSubjectForm } from "./useSubjectForm";

function setup(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const hook = renderHook(() => useSubjectForm({ onSubmit }));
  return { ...hook, onSubmit };
}

describe("useSubjectForm", () => {
  it("초기 상태는 유효하지 않다", () => {
    const { result } = setup();
    expect(result.current.isValid).toBe(false);
    expect(result.current.concepts).toEqual([]);
  });

  it("개념 추가 시 공백이 제거되고 입력창이 비워진다", () => {
    const { result } = setup();
    act(() => {
      result.current.setConceptInput("  클로저  ");
    });
    act(() => {
      result.current.addConcept();
    });
    expect(result.current.concepts).toEqual(["클로저"]);
    expect(result.current.conceptInput).toBe("");
  });

  it("대소문자 무시하고 중복 개념은 추가하지 않는다", () => {
    const { result } = setup();
    act(() => result.current.setConceptInput("Hoisting"));
    act(() => result.current.addConcept());
    act(() => result.current.setConceptInput("hoisting"));
    act(() => result.current.addConcept());
    expect(result.current.concepts).toEqual(["Hoisting"]);
  });

  it("빈 문자열은 개념으로 추가되지 않는다", () => {
    const { result } = setup();
    act(() => result.current.setConceptInput("   "));
    act(() => result.current.addConcept());
    expect(result.current.concepts).toEqual([]);
  });

  it("addConcepts는 여러 개념을 중복 제거하며 병합한다", () => {
    const { result } = setup();
    act(() => result.current.addConcepts(["클로저", "호이스팅", "클로저", "  "]));
    expect(result.current.concepts).toEqual(["클로저", "호이스팅"]);
  });

  it("removeConcept로 개념을 제거한다", () => {
    const { result } = setup();
    act(() => result.current.addConcepts(["a", "b"]));
    act(() => result.current.removeConcept("a"));
    expect(result.current.concepts).toEqual(["b"]);
  });

  it("topic/sub/detail + 개념 1개 이상이면 유효하다", () => {
    const { result } = setup();
    act(() => {
      result.current.setTopic("프론트엔드");
      result.current.setSub("JavaScript");
      result.current.setDetail("함수");
    });
    expect(result.current.isValid).toBe(false);
    act(() => result.current.addConcepts(["클로저"]));
    expect(result.current.isValid).toBe(true);
  });

  it("제출 시 trim된 값으로 onSubmit을 호출하고 폼을 초기화한다", async () => {
    const { result, onSubmit } = setup();
    act(() => {
      result.current.setTopic("  프론트엔드 ");
      result.current.setSub(" JavaScript ");
      result.current.setDetail(" 함수 ");
    });
    act(() => result.current.addConcepts(["클로저"]));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith({
      topic: "프론트엔드",
      sub: "JavaScript",
      detail: "함수",
      conceptNames: ["클로저"],
    });
    expect(result.current.topic).toBe("");
    expect(result.current.concepts).toEqual([]);
  });

  it("유효하지 않으면 onSubmit을 호출하지 않는다", async () => {
    const { result, onSubmit } = setup();
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
