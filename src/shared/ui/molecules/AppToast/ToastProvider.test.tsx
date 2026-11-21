import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastProvider } from "./ToastProvider";
import { useToast } from "./useToast";
import type { ToastType } from "./ToastContext";

let capturedShowToast: ((message: string, type?: ToastType) => void) | null = null;

function Capture() {
  capturedShowToast = useToast().showToast;
  return null;
}

function renderWithProvider() {
  render(
    <ToastProvider>
      <Capture />
    </ToastProvider>,
  );
  return capturedShowToast!;
}

describe("ToastProvider (DS 어댑터)", () => {
  it("showToast(message) 호출 시 해당 문구의 성공 토스트를 띄운다", () => {
    const showToast = renderWithProvider();

    act(() => showToast("저장했습니다."));

    const title = screen.getByText("저장했습니다.");
    expect(title.closest(".cds-toast")).toHaveClass("cds-toast--success");
  });

  it("type이 error면 danger 톤 + role=alert로 띄운다", () => {
    const showToast = renderWithProvider();

    act(() => showToast("저장하지 못했습니다.", "error"));

    const toast = screen.getByText("저장하지 못했습니다.").closest(".cds-toast");
    expect(toast).toHaveClass("cds-toast--danger");
    expect(toast).toHaveAttribute("role", "alert");
  });

  it("Provider 밖에서 useToast를 쓰면 에러를 던진다", () => {
    expect(() => render(<Capture />)).toThrow("ToastProvider");
  });
});
