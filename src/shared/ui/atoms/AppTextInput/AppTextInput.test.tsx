import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppTextInput from "./AppTextInput";

describe("AppTextInput (DS 어댑터)", () => {
  it("입력하면 onChange에 네이티브 change 이벤트를 넘긴다", async () => {
    const onChange = vi.fn();
    render(<AppTextInput aria-label="문제 이름" value="" onChange={onChange} />);

    await userEvent.type(screen.getByRole("textbox", { name: "문제 이름" }), "a");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target).toBeInstanceOf(HTMLInputElement);
  });

  it("id로 화면의 별도 label과 연결된다", () => {
    render(
      <>
        <label htmlFor="title">문제 이름</label>
        <AppTextInput id="title" value="두 수의 합" onChange={vi.fn()} />
      </>,
    );

    expect(screen.getByLabelText("문제 이름")).toHaveValue("두 수의 합");
  });

  it("type 등 네이티브 속성을 그대로 전달한다", () => {
    render(<AppTextInput aria-label="비밀번호" type="password" required value="" onChange={vi.fn()} />);

    const input = screen.getByLabelText("비밀번호");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toBeRequired();
  });

  it("className은 래퍼에 붙어 너비 클래스로 기본 w-full을 덮어쓴다", () => {
    const { container } = render(
      <AppTextInput aria-label="검색" className="sm:w-48 w-40" value="" onChange={vi.fn()} />,
    );

    expect(container.firstElementChild).toHaveClass("w-40", "sm:w-48");
    expect(container.firstElementChild).not.toHaveClass("w-full");
  });

  it("size를 DS 높이 클래스로 넘기고, error면 문구와 aria-invalid를 단다", () => {
    const { container } = render(
      <AppTextInput aria-label="링크" size="sm" error="주소 형식이 아닙니다." value="" onChange={vi.fn()} />,
    );

    expect(container.querySelector(".cds-input--sm")).toBeInTheDocument();
    expect(screen.getByText("주소 형식이 아닙니다.")).toBeInTheDocument();
    expect(screen.getByLabelText("링크")).toHaveAttribute("aria-invalid", "true");
  });
});
