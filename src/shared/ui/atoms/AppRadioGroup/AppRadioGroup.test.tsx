import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppRadioGroup from "./AppRadioGroup";

const options = [
  { value: "paragraph", label: "줄글형" },
  { value: "problem", label: "문제형" },
] as const;

describe("AppRadioGroup (DS 어댑터)", () => {
  it("value에 해당하는 선택지가 선택돼 있고, 다른 선택지를 고르면 그 값을 넘긴다", async () => {
    const onChange = vi.fn();
    render(<AppRadioGroup options={[...options]} value="paragraph" onChange={onChange} ariaLabel="템플릿 형태" />);

    expect(screen.getByRole("radio", { name: "줄글형" })).toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: "문제형" }));

    expect(onChange).toHaveBeenCalledWith("problem");
  });

  it("ariaLabel만 주면 그 이름의 group으로 묶인다", () => {
    render(<AppRadioGroup options={[...options]} value="paragraph" onChange={vi.fn()} ariaLabel="템플릿 형태" />);

    expect(screen.getByRole("group", { name: "템플릿 형태" })).toBeInTheDocument();
  });

  it("label을 주면 fieldset의 legend가 그룹 이름이 된다", () => {
    render(<AppRadioGroup options={[...options]} value="paragraph" onChange={vi.fn()} label="형태" />);

    expect(screen.getByRole("group", { name: "형태" })).toBeInTheDocument();
  });

  it("disabled면 모든 선택지가 비활성이다", () => {
    render(<AppRadioGroup options={[...options]} value="paragraph" onChange={vi.fn()} ariaLabel="형태" disabled />);

    for (const radio of screen.getAllByRole("radio")) expect(radio).toBeDisabled();
  });
});
