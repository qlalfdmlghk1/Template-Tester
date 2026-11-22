import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppButton from "./AppButton";

describe("AppButton (DS 어댑터)", () => {
  it.each([
    [{ variant: "solid", color: "primary" }, "cds-btn--primary"],
    [{ variant: "solid", color: "blue" }, "cds-btn--primary"],
    [{ variant: "solid", color: "red" }, "cds-btn--danger"],
    [{ variant: "solid", color: "gray" }, "cds-btn--secondary"],
    [{ variant: "outline", color: "primary" }, "cds-btn--secondary"],
    [{ variant: "ghost", color: "gray" }, "cds-btn--ghost"],
  ] as const)("%o → %s", (props, dsClass) => {
    render(<AppButton {...props}>확인</AppButton>);

    expect(screen.getByRole("button", { name: "확인" })).toHaveClass(dsClass);
  });

  it("outline·ghost의 red는 빨간 글자 클래스를 붙인다 (solid red는 danger 채움이라 붙이지 않음)", () => {
    render(
      <>
        <AppButton variant="outline" color="red">테두리 삭제</AppButton>
        <AppButton variant="ghost" color="red">투명 삭제</AppButton>
        <AppButton color="red">채움 삭제</AppButton>
      </>,
    );

    expect(screen.getByRole("button", { name: "테두리 삭제" })).toHaveClass("app-btn--danger");
    expect(screen.getByRole("button", { name: "투명 삭제" })).toHaveClass("app-btn--danger");
    expect(screen.getByRole("button", { name: "채움 삭제" })).not.toHaveClass("app-btn--danger");
  });

  it("xs는 DS sm 크기로 그린다", () => {
    render(<AppButton size="xs">작게</AppButton>);

    expect(screen.getByRole("button", { name: "작게" })).toHaveClass("cds-btn--sm");
  });

  it("기본 type은 button이고, 클릭하면 onClick을 부른다", async () => {
    const onClick = vi.fn();
    render(<AppButton onClick={onClick}>저장</AppButton>);

    const button = screen.getByRole("button", { name: "저장" });
    await userEvent.click(button);

    expect(button).toHaveAttribute("type", "button");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("loading이면 클릭을 막는다", async () => {
    const onClick = vi.fn();
    render(<AppButton loading onClick={onClick}>저장</AppButton>);

    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("width는 인라인 너비로, className은 그대로 붙인다", () => {
    render(<AppButton width="120px" className="ml-auto">추가</AppButton>);

    const button = screen.getByRole("button", { name: "추가" });
    expect(button).toHaveStyle({ width: "120px" });
    expect(button).toHaveClass("ml-auto");
  });
});
