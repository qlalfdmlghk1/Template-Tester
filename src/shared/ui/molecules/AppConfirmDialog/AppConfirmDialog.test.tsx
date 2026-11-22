import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppConfirmDialog from "./AppConfirmDialog";

describe("AppConfirmDialog (DS 어댑터)", () => {
  it("open이 false면 아무것도 그리지 않는다", () => {
    render(<AppConfirmDialog open={false} title="삭제할까요?" onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("confirmText·cancelText를 버튼 문구로 쓰고, 각 버튼이 onConfirm·onCancel을 부른다", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <AppConfirmDialog
        open
        title="삭제할까요?"
        confirmText="삭제"
        cancelText="닫기"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("danger면 확인 버튼이 danger 스타일이고 처음 포커스가 취소 버튼에 간다", () => {
    render(
      <AppConfirmDialog open danger title="삭제할까요?" confirmText="삭제" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "삭제" })).toHaveClass("cds-btn--danger");
    expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();
  });

  it("Esc를 누르면 onCancel을 부른다", async () => {
    const onCancel = vi.fn();
    render(<AppConfirmDialog open title="삭제할까요?" onConfirm={vi.fn()} onCancel={onCancel} />);

    await userEvent.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("loading 중에는 Esc로 닫히지 않고 취소 버튼이 비활성화된다", async () => {
    const onCancel = vi.fn();
    render(<AppConfirmDialog open loading title="삭제할까요?" onConfirm={vi.fn()} onCancel={onCancel} />);

    await userEvent.keyboard("{Escape}");

    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();
  });

  it("description과 children을 함께 그린다", () => {
    render(
      <AppConfirmDialog open title="기업을 삭제할까요?" description="조사 내용이 사라집니다." onConfirm={vi.fn()} onCancel={vi.fn()}>
        <label>
          <input type="checkbox" />
          지원 건도 함께 삭제
        </label>
      </AppConfirmDialog>,
    );

    expect(screen.getByText("조사 내용이 사라집니다.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "지원 건도 함께 삭제" })).toBeInTheDocument();
  });
});
