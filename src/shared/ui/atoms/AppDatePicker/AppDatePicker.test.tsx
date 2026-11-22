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

  it("ariaLabel을 주면 래퍼가 그 이름의 group이 된다", () => {
    render(<AppDatePicker value="2026-11-22" ariaLabel="시작일" onChange={vi.fn()} />);

    expect(screen.getByRole("group", { name: "시작일" })).toBeInTheDocument();
  });
});
