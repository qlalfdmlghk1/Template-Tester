import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppSwitch from "./AppSwitch";

describe("AppSwitch (DS 어댑터)", () => {
  it("checked 상태를 role=switch로 노출한다", () => {
    render(<AppSwitch checked label="조사된 기업" onChange={vi.fn()} />);

    expect(screen.getByRole("switch", { name: "조사된 기업" })).toBeChecked();
  });

  it("누르면 다음 상태(boolean)로 onChange를 부른다", async () => {
    const onChange = vi.fn();
    render(<AppSwitch checked={false} label="조사된 기업" onChange={onChange} />);

    await userEvent.click(screen.getByRole("switch"));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("라벨을 눌러도 토글된다", async () => {
    const onChange = vi.fn();
    render(<AppSwitch checked label="조사된 기업" onChange={onChange} />);

    await userEvent.click(screen.getByText("조사된 기업"));

    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("disabled면 눌러도 onChange를 부르지 않는다", async () => {
    const onChange = vi.fn();
    render(<AppSwitch checked={false} disabled label="조사된 기업" onChange={onChange} />);

    await userEvent.click(screen.getByRole("switch"));

    expect(screen.getByRole("switch")).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
