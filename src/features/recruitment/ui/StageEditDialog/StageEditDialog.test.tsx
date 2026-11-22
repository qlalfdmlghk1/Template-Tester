import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StageEditDialog } from "./StageEditDialog";
import type { StageEntry } from "@/entities/job-application/model/application.type";

const entry: StageEntry = { status: "PENDING", schedule: null };

function renderDialog(overrides: Partial<React.ComponentProps<typeof StageEditDialog>> = {}) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(
    <StageEditDialog
      stageKey="resume"
      entry={entry}
      companyName="한화금융"
      defaultYear={2026}
      saving={false}
      onSave={onSave}
      onClose={onClose}
      {...overrides}
    />,
  );
  return { onSave, onClose };
}

describe("StageEditDialog (AppModal 사용처)", () => {
  it("단계 이름을 제목으로, 회사명을 설명으로 갖는 dialog를 띄운다", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: "자소서" });
    expect(dialog).toHaveAccessibleDescription("한화금융");
  });

  it("상태를 고르고 메모를 적어 footer의 저장을 누르면 onSave로 넘긴다 (form 속성 연결)", async () => {
    const { onSave } = renderDialog();

    // 아이콘은 aria-hidden이라 이름은 "합격" 그대로 ("불합격"과 구분)
    await userEvent.click(screen.getByRole("button", { name: "합격" }));
    await userEvent.type(screen.getByLabelText("메모"), "온라인 진행");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(onSave).toHaveBeenCalledWith({ status: "PASSED", schedule: null, memo: "온라인 진행" });
  });

  it("메모가 공백뿐이면 memo 없이 저장한다", async () => {
    const { onSave } = renderDialog();

    await userEvent.type(screen.getByLabelText("메모"), "   ");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(onSave).toHaveBeenCalledWith({ status: "PENDING", schedule: null, memo: undefined });
  });

  it("취소·Esc로 onClose를 부른다", async () => {
    const { onClose } = renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
