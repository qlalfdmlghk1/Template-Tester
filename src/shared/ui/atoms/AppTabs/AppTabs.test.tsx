import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppTabs from "./AppTabs";

const items = [
  { value: "list", label: "목록" },
  { value: "friends", label: "친구 오답노트" },
];

describe("AppTabs (DS 어댑터)", () => {
  it("이름 붙은 tablist에 탭을 그리고, 지금 탭을 aria-selected로 표시한다", () => {
    render(<AppTabs items={items} value="list" onChange={vi.fn()} ariaLabel="오답노트 보기" />);

    expect(screen.getByRole("tablist", { name: "오답노트 보기" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "목록" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "친구 오답노트" })).toHaveAttribute("aria-selected", "false");
  });

  it("탭을 누르면 그 값을 넘긴다", async () => {
    const onChange = vi.fn();
    render(<AppTabs items={items} value="list" onChange={onChange} />);

    await userEvent.click(screen.getByRole("tab", { name: "친구 오답노트" }));

    expect(onChange).toHaveBeenCalledWith("friends");
  });

  it("방향키로 다음 탭으로 옮긴다", async () => {
    const onChange = vi.fn();
    render(<AppTabs items={items} value="list" onChange={onChange} />);

    screen.getByRole("tab", { name: "목록" }).focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith("friends");
  });

  it("value가 items에 없으면(작성 화면 등) 선택된 탭이 없다", () => {
    render(<AppTabs items={items} value="write" onChange={vi.fn()} />);

    for (const tab of screen.getAllByRole("tab")) expect(tab).toHaveAttribute("aria-selected", "false");
  });

  it("value가 items에 없어도 Tab 키로 첫 탭에 들어갈 수 있다", async () => {
    render(
      <>
        <button type="button">앞</button>
        <AppTabs items={items} value="write" onChange={vi.fn()} />
      </>,
    );

    screen.getByRole("button", { name: "앞" }).focus();
    await userEvent.tab();

    expect(screen.getByRole("tab", { name: "목록" })).toHaveFocus();
  });

  it("선택이 생기면 선택된 탭만 Tab 키를 받는다", () => {
    const { rerender } = render(<AppTabs items={items} value="write" onChange={vi.fn()} />);
    rerender(<AppTabs items={items} value="friends" onChange={vi.fn()} />);

    expect(screen.getByRole("tab", { name: "목록" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("tab", { name: "친구 오답노트" })).toHaveAttribute("tabindex", "0");
  });

  it("actions를 탭 줄 오른쪽에 함께 그린다", () => {
    render(<AppTabs items={items} value="list" onChange={vi.fn()} actions={<button type="button">+ 작성</button>} />);

    expect(screen.getByRole("button", { name: "+ 작성" })).toBeInTheDocument();
  });
});
