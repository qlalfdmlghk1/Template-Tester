import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppPagination from "./AppPagination";

describe("AppPagination (DS 어댑터)", () => {
  it("페이지가 1개 이하이고 페이지 크기 선택도 없으면 그리지 않는다", () => {
    const { container } = render(
      <AppPagination currentPage={1} totalPages={1} pageSize={10} onPageChange={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("현재 페이지를 aria-current로 표시한다", () => {
    render(<AppPagination currentPage={3} totalPages={5} pageSize={10} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "3페이지" })).toHaveAttribute("aria-current", "page");
  });

  it("번호·이전·다음을 누르면 onPageChange에 해당 페이지를 넘긴다", async () => {
    const onPageChange = vi.fn();
    render(<AppPagination currentPage={3} totalPages={5} pageSize={10} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole("button", { name: "5페이지" }));
    await userEvent.click(screen.getByRole("button", { name: "이전 페이지" }));
    await userEvent.click(screen.getByRole("button", { name: "다음 페이지" }));

    expect(onPageChange.mock.calls).toEqual([[5], [2], [4]]);
  });

  it("첫 페이지에서는 이전, 마지막 페이지에서는 다음이 비활성이다", () => {
    const { rerender } = render(
      <AppPagination currentPage={1} totalPages={3} pageSize={10} onPageChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "이전 페이지" })).toBeDisabled();

    rerender(<AppPagination currentPage={3} totalPages={3} pageSize={10} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "다음 페이지" })).toBeDisabled();
  });

  it("현재 페이지 양옆 2개까지 보이고 그 밖은 생략한다", () => {
    render(<AppPagination currentPage={10} totalPages={20} pageSize={10} onPageChange={vi.fn()} />);

    for (const page of [1, 8, 9, 10, 11, 12, 20]) {
      expect(screen.getByRole("button", { name: `${page}페이지` })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "7페이지" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "13페이지" })).not.toBeInTheDocument();
  });
});
