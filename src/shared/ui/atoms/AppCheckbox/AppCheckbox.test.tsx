import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppCheckbox from "./AppCheckbox";

describe("AppCheckbox (DS 어댑터)", () => {
  it("문구를 눌러도 토글되고, onChange에 네이티브 change 이벤트를 넘긴다", async () => {
    // 제어형이라 핸들러가 끝나면 DOM 값이 되돌아가므로 핸들러 안에서 읽는다
    const onChange = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => event.target.checked);
    render(<AppCheckbox label="다른 사용자에게 공유하기" checked={false} onChange={onChange} />);

    await userEvent.click(screen.getByText("다른 사용자에게 공유하기"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.results[0].value).toBe(true);
  });

  it("label이 이름이 되고, description을 함께 보여준다", () => {
    render(<AppCheckbox label="함께 삭제" description="체크하지 않으면 남습니다." checked onChange={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: /함께 삭제/ })).toBeChecked();
    expect(screen.getByText("체크하지 않으면 남습니다.")).toBeInTheDocument();
  });

  it("문구 없이 aria-label로 이름을 준다 (표의 행 선택)", () => {
    render(<AppCheckbox aria-label="가비아 가져오기" checked={false} onChange={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: "가비아 가져오기" })).not.toBeChecked();
  });

  it("indeterminate면 aria-checked='mixed'와 input.indeterminate를 단다", () => {
    render(<AppCheckbox aria-label="전체 선택" indeterminate checked={false} onChange={vi.fn()} />);

    const checkbox = screen.getByRole("checkbox", { name: "전체 선택" }) as HTMLInputElement;
    expect(checkbox).toHaveAttribute("aria-checked", "mixed");
    expect(checkbox.indeterminate).toBe(true);
  });

  it("disabled면 토글되지 않는다", async () => {
    const onChange = vi.fn();
    render(<AppCheckbox label="공유" disabled checked={false} onChange={onChange} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "공유" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
