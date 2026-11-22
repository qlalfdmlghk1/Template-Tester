import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppTextarea from "./AppTextarea";

describe("AppTextarea (DS 어댑터)", () => {
  it("입력하면 onChange에 네이티브 change 이벤트와 입력한 값을 넘긴다", async () => {
    // 제어형이라 핸들러가 끝나면 DOM 값이 되돌아가므로 핸들러 안에서 읽는다
    const onChange = vi.fn((event: React.ChangeEvent<HTMLTextAreaElement>) => event.target.value);
    render(<AppTextarea aria-label="메모" value="" onChange={onChange} />);

    await userEvent.type(screen.getByRole("textbox", { name: "메모" }), "a");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target).toBeInstanceOf(HTMLTextAreaElement);
    expect(onChange.mock.results[0].value).toBe("a");
  });

  it("id로 화면의 별도 label과 연결되고 rows·placeholder·disabled를 전달한다", () => {
    render(
      <>
        <label htmlFor="memo">메모</label>
        <AppTextarea id="memo" rows={6} placeholder="자유롭게" disabled value="내용" onChange={vi.fn()} />
      </>,
    );

    const textarea = screen.getByLabelText("메모");
    expect(textarea).toHaveValue("내용");
    expect(textarea).toHaveAttribute("rows", "6");
    expect(textarea).toHaveAttribute("placeholder", "자유롭게");
    expect(textarea).toBeDisabled();
  });

  it("resize='none'이면 크기 조절을 막는다 (기본은 세로만)", () => {
    const { rerender } = render(<AppTextarea aria-label="메모" value="" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).not.toHaveClass("is-noresize");

    rerender(<AppTextarea aria-label="메모" resize="none" value="" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveClass("is-noresize");
  });

  it("className은 래퍼에 붙어 기본 w-full을 덮어쓴다", () => {
    const { container } = render(<AppTextarea aria-label="메모" className="w-60" value="" onChange={vi.fn()} />);

    expect(container.firstElementChild).toHaveClass("w-60");
    expect(container.firstElementChild).not.toHaveClass("w-full");
  });

  it("error가 있으면 문구를 보여주고 aria-invalid를 단다", () => {
    render(<AppTextarea aria-label="메모" error="필수 항목입니다." value="" onChange={vi.fn()} />);

    expect(screen.getByText("필수 항목입니다.")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });
});
