import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppModal from "./AppModal";

describe("AppModal (DS 어댑터)", () => {
  it("제목을 이름으로 갖는 dialog를 body에 띄우고, 보조 문구를 설명으로 연결한다", () => {
    render(
      <AppModal title="자소서" description="한화금융" onClose={vi.fn()}>
        본문
      </AppModal>,
    );

    const dialog = screen.getByRole("dialog", { name: "자소서" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("한화금융");
    expect(dialog.closest(".cds-modal")?.parentElement).toBe(document.body);
  });

  it("Esc를 누르면 onClose를 부른다", async () => {
    const onClose = vi.fn();
    render(
      <AppModal title="설정" onClose={onClose}>
        <input aria-label="키" />
      </AppModal>,
    );

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("바깥(어두운 영역)을 누르면 닫고, closeOnOverlay={false}면 닫지 않는다", async () => {
    const onClose = vi.fn();
    const { rerender } = render(<AppModal title="설정" onClose={onClose} />);

    await userEvent.click(document.querySelector<HTMLElement>(".cds-modal__scrim")!);
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<AppModal title="설정" onClose={onClose} closeOnOverlay={false} />);
    await userEvent.click(document.querySelector<HTMLElement>(".cds-modal__scrim")!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("formId를 주면 본문을 form으로 감싸고, footer의 submit 버튼(form 속성)으로 제출된다", async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <AppModal
        title="메모"
        onClose={vi.fn()}
        formId="memo-form"
        onSubmit={onSubmit}
        footer={
          <button type="submit" form="memo-form">
            저장
          </button>
        }
      >
        <input aria-label="메모" />
      </AppModal>,
    );

    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("toolbar를 본문 첫 줄에 그리고, size='xl'이면 넓은 패널 클래스를 단다", () => {
    render(
      <AppModal title="가져오기" size="xl" onClose={vi.fn()} toolbar={<button type="button">채우기</button>}>
        본문
      </AppModal>,
    );

    expect(screen.getByRole("button", { name: "채우기" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveClass("app-modal--xl");
  });

  it("busy면 Esc·닫기(X)·바깥 클릭을 모두 무시한다", async () => {
    const onClose = vi.fn();
    render(<AppModal title="저장 중" busy onClose={onClose} />);

    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    await userEvent.click(document.querySelector<HTMLElement>(".cds-modal__scrim")!);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("open={false}면 그리지 않는다", () => {
    render(<AppModal open={false} title="설정" onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
