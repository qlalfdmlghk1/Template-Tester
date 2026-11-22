import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScheduleInput } from "./ScheduleInput";

/** 날짜 칸의 트리거 — 같은 이름으로 시작하는 "… 지우기" 버튼과 구분한다 */
function dateTrigger(name: string) {
  return screen
    .getAllByRole("button", { name: new RegExp(`^${name}`) })
    .find((button) => button.getAttribute("aria-haspopup") === "dialog")!;
}

/** 열린 달력(portal이라 document.body 아래)에서 날짜 칸을 누른다 */
async function pickDay(key: string) {
  const day = document.querySelector<HTMLElement>(`[data-key="${key}"]`);
  expect(day).not.toBeNull();
  await userEvent.click(day!);
}

describe("ScheduleInput", () => {
  describe("정확한 일시", () => {
    it("날짜를 고르면 입력해 둔 시각을 유지한 'YYYY-MM-DDTHH:mm'으로 넘긴다", async () => {
      const onChange = vi.fn();
      render(
        <ScheduleInput
          value={{ kind: "exact", at: "2026-11-10T14:30", hasTime: true }}
          defaultYear={2026}
          onChange={onChange}
        />,
      );

      await userEvent.click(dateTrigger("일자"));
      await pickDay("2026-11-20");

      expect(onChange).toHaveBeenCalledWith({ kind: "exact", at: "2026-11-20T14:30", hasTime: true });
    });

    it("날짜를 지우면 시각도 함께 비운다", async () => {
      const onChange = vi.fn();
      render(
        <ScheduleInput
          value={{ kind: "exact", at: "2026-11-10T14:30", hasTime: true }}
          defaultYear={2026}
          onChange={onChange}
        />,
      );

      await userEvent.click(screen.getByRole("button", { name: "일자 지우기" }));

      expect(onChange).toHaveBeenCalledWith({ kind: "exact", at: "", hasTime: false });
    });
  });

  describe("기간", () => {
    const range = { kind: "range" as const, start: "2026-11-10", end: "2026-11-12", hasTime: false };

    it("시작일과 종료일을 각각 갱신한다", async () => {
      const onChange = vi.fn();
      render(<ScheduleInput value={range} defaultYear={2026} onChange={onChange} />);

      await userEvent.click(dateTrigger("시작일"));
      await pickDay("2026-11-05");
      expect(onChange).toHaveBeenLastCalledWith({ ...range, start: "2026-11-05" });

      await userEvent.click(dateTrigger("종료일"));
      await pickDay("2026-11-25");
      expect(onChange).toHaveBeenLastCalledWith({ ...range, end: "2026-11-25" });
    });

    it("종료일만 지워 미정으로 되돌릴 수 있다", async () => {
      const onChange = vi.fn();
      render(<ScheduleInput value={range} defaultYear={2026} onChange={onChange} />);

      await userEvent.click(screen.getByRole("button", { name: "종료일 지우기" }));

      expect(onChange).toHaveBeenCalledWith({ ...range, end: "" });
    });
  });

  it("일정 종류를 바꾸면 그 종류의 빈 일정으로 넘기고, '일정 없음'은 null로 넘긴다", async () => {
    const onChange = vi.fn();
    render(
      <ScheduleInput
        value={{ kind: "exact", at: "2026-11-10", hasTime: false }}
        defaultYear={2026}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /^일정 종류/ }));
    await userEvent.click(screen.getByRole("option", { name: "기간" }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: "range", start: "", end: "", hasTime: false });

    await userEvent.click(screen.getByRole("button", { name: /^일정 종류/ }));
    await userEvent.click(screen.getByRole("option", { name: "일정 없음" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
