import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ToggleButtonGroup from "./ToggleButtonGroup";

const options = [
  { value: "correct", label: "정답" },
  { value: "wrong", label: "오답" },
  { value: "timeout", label: "시간초과" },
];

describe("ToggleButtonGroup (DS AppChip 기반)", () => {
  it("단일 선택: 고른 칩만 켜짐(aria-pressed)으로 표시하고, 다른 칩을 누르면 그 값을 넘긴다", async () => {
    const onChange = vi.fn();
    render(<ToggleButtonGroup options={options} value="wrong" onChange={onChange} ariaLabel="제출 결과" />);

    expect(screen.getByRole("button", { name: /오답/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /정답/ })).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(screen.getByRole("button", { name: /시간초과/ }));
    expect(onChange).toHaveBeenCalledWith("timeout");
  });

  it("단일 선택: 켜진 칩을 다시 누르면 해제(빈 문자열)한다", async () => {
    const onChange = vi.fn();
    render(<ToggleButtonGroup options={options} value="wrong" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /오답/ }));

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("multiple: 누르면 배열에 더하고, 켜진 칩을 누르면 뺀다", async () => {
    const onChange = vi.fn();
    render(<ToggleButtonGroup multiple options={options} value={["correct"]} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /오답/ }));
    expect(onChange).toHaveBeenLastCalledWith(["correct", "wrong"]);

    await userEvent.click(screen.getByRole("button", { name: /정답/ }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("ariaLabelledby로 바깥 라벨을 묶음 이름으로 연결한다", () => {
    render(
      <>
        <span id="result-label">제출 결과</span>
        <ToggleButtonGroup options={options} value="" onChange={vi.fn()} ariaLabelledby="result-label" />
      </>,
    );

    expect(screen.getByRole("group", { name: "제출 결과" })).toBeInTheDocument();
  });
});
