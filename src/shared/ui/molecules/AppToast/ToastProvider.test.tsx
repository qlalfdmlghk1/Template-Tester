import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "./ToastProvider";
import { useToast } from "./useToast";

function Trigger() {
  const { showToast } = useToast();

  return (
    <>
      <button type="button" onClick={() => showToast("저장했습니다.")}>
        성공
      </button>
      <button type="button" onClick={() => showToast("저장하지 못했습니다.", "error")}>
        실패
      </button>
    </>
  );
}

function renderWithProvider() {
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  );
}

describe("ToastProvider (DS 어댑터)", () => {
  it("showToast(message) 호출 시 해당 문구의 성공 토스트를 띄운다", async () => {
    renderWithProvider();

    await userEvent.click(screen.getByRole("button", { name: "성공" }));

    const toast = screen.getByText("저장했습니다.").closest(".cds-toast");
    expect(toast).toHaveClass("cds-toast--success");
  });

  it("type이 error면 danger 톤 + role=alert로 띄운다", async () => {
    renderWithProvider();

    await userEvent.click(screen.getByRole("button", { name: "실패" }));

    const toast = screen.getByText("저장하지 못했습니다.").closest(".cds-toast");
    expect(toast).toHaveClass("cds-toast--danger");
    expect(toast).toHaveAttribute("role", "alert");
  });

  it("Provider 밖에서 useToast를 쓰면 에러를 던진다", () => {
    expect(() => render(<Trigger />)).toThrow("ToastProvider");
  });
});
