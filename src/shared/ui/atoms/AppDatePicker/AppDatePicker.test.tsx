import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppDatePicker from "./AppDatePicker";

describe("AppDatePicker (DS 어댑터)", () => {
  it("값이 없으면 placeholder를 보여준다", () => {
    render(<AppDatePicker value="" placeholder="날짜 선택" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /날짜 선택/ })).toBeInTheDocument();
  });

  it("달력에서 날짜를 고르면 'YYYY-MM-DD' 문자열로 onChange를 부른다", async () => {
    const onChange = vi.fn();
    render(<AppDatePicker value="2026-11-10" placeholder="날짜 선택" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /2026/ }));
    const day = document.querySelector<HTMLElement>('[data-key="2026-11-20"]');
    expect(day).not.toBeNull();
    await userEvent.click(day!);

    expect(onChange).toHaveBeenCalledWith("2026-11-20");
  });

  it("className은 래퍼에 붙어 너비 클래스로 기본 w-full을 덮어쓴다", () => {
    const { container } = render(<AppDatePicker value="" className="w-36" onChange={vi.fn()} />);

    expect(container.firstElementChild).toHaveClass("w-36");
    expect(container.firstElementChild).not.toHaveClass("w-full");
  });

  it("ariaLabel은 트리거의 이름이 되어 '이름, 현재 값'으로 읽힌다", () => {
    render(<AppDatePicker value="2026-11-22" ariaLabel="시작일" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /^시작일/ })).toHaveAccessibleName("시작일 2026.11.22");
  });

  it("ariaLabelledby로 바깥 라벨을 트리거 이름으로 연결한다", () => {
    render(
      <>
        <span id="date-label">날짜</span>
        <AppDatePicker value="" ariaLabelledby="date-label" placeholder="날짜 선택" onChange={vi.fn()} />
      </>,
    );

    expect(screen.getByRole("button", { name: /^날짜/ })).toBeInTheDocument();
  });

  describe("clearable", () => {
    it("값이 있을 때만 지우기 버튼을 보여주고, 누르면 빈 문자열로 onChange를 부른다", async () => {
      const onChange = vi.fn();
      const { rerender } = render(<AppDatePicker value="" ariaLabel="종료일" clearable onChange={onChange} />);
      expect(screen.queryByRole("button", { name: "종료일 지우기" })).not.toBeInTheDocument();

      rerender(<AppDatePicker value="2026-11-22" ariaLabel="종료일" clearable onChange={onChange} />);
      await userEvent.click(screen.getByRole("button", { name: "종료일 지우기" }));

      expect(onChange).toHaveBeenCalledWith("");
    });

    it("disabled면 지우기 버튼을 숨긴다", () => {
      render(<AppDatePicker value="2026-11-22" clearable disabled onChange={vi.fn()} />);

      expect(screen.queryByRole("button", { name: "날짜 지우기" })).not.toBeInTheDocument();
    });

    it("지우면 빈 칸(placeholder)으로 돌아가고 포커스는 날짜 트리거로 간다", async () => {
      function Harness() {
        const [value, setValue] = useState("2026-11-22");
        return <AppDatePicker value={value} ariaLabel="일자" placeholder="일자 선택" clearable onChange={setValue} />;
      }
      render(<Harness />);

      await userEvent.click(screen.getByRole("button", { name: "일자 지우기" }));

      const trigger = screen.getByRole("button", { name: /^일자/ });
      expect(trigger).toHaveTextContent("일자 선택");
      expect(trigger).toHaveFocus();
    });
  });

  it("빈 값에서 고르면 포커스가 트리거에 남고, 비운 뒤 다시 고른 날짜가 이전 날짜로 돌아가지 않는다", async () => {
    function Harness() {
      const [value, setValue] = useState("");
      return (
        <>
          <AppDatePicker value={value} ariaLabel="일자" placeholder="일자 선택" onChange={setValue} />
          <button type="button" onClick={() => setValue("")}>
            외부에서 비우기
          </button>
        </>
      );
    }
    render(<Harness />);
    const trigger = () => screen.getByRole("button", { name: /^일자/ });
    // 값이 비어 있으면 달력이 오늘이 있는 달로 열리므로, 열린 달에서 고를 수 있는 칸을 그대로 쓴다
    const pickNth = async (n: number) => {
      await userEvent.click(trigger());
      const day = document.querySelectorAll<HTMLElement>("button[data-key]:not(:disabled)")[n];
      const key = day.dataset.key!;
      await userEvent.click(day);
      return key.replace(/-/g, ".");
    };

    const first = await pickNth(0);
    expect(trigger()).toHaveTextContent(first);
    expect(trigger()).toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: "외부에서 비우기" }));
    expect(trigger()).toHaveTextContent("일자 선택");

    const second = await pickNth(1);
    expect(trigger()).toHaveTextContent(second);
    expect(trigger()).not.toHaveTextContent(first);
  });

  it("부모가 비우기를 반영하지 않으면, 나중에 다른 이유로 비워질 때 포커스를 가져가지 않는다", async () => {
    function Harness() {
      const [value, setValue] = useState("2026-11-22");
      const [tick, setTick] = useState(0);
      return (
        <>
          {/* 지우기(onChange(""))를 무시하고 다시 렌더만 한다 */}
          <AppDatePicker value={value} ariaLabel="일자" clearable onChange={() => setTick(tick + 1)} />
          <button type="button" onClick={() => setValue("")}>
            외부에서 비우기
          </button>
        </>
      );
    }
    render(<Harness />);

    await userEvent.click(screen.getByRole("button", { name: "일자 지우기" }));
    const external = screen.getByRole("button", { name: "외부에서 비우기" });
    await userEvent.click(external);

    expect(external).toHaveFocus();
  });
});
