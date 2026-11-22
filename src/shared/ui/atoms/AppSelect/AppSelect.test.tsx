import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppSelect from "./AppSelect";

const monthOptions = [
  { value: 1, label: "1월" },
  { value: 2, label: "2월" },
  { value: 3, label: "3월" },
];

const tagOptions = [
  { value: "FE", label: "프론트엔드" },
  { value: "BE", label: "백엔드" },
  { value: "IT", label: "IT 일반" },
];

describe("AppSelect (DS 어댑터)", () => {
  it("값이 없으면 placeholder를, 있으면 해당 옵션 라벨을 보여준다", () => {
    const { rerender } = render(
      <AppSelect options={monthOptions} placeholder="월 선택" onChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "월 선택" })).toBeInTheDocument();

    rerender(<AppSelect options={monthOptions} value={2} placeholder="월 선택" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "2월" })).toBeInTheDocument();
  });

  it("숫자 value 옵션을 고르면 number 그대로 onChange에 넘긴다", async () => {
    const onChange = vi.fn();
    render(<AppSelect options={monthOptions} value={1} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "1월" }));
    await userEvent.click(screen.getByRole("option", { name: "3월" }));

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("value를 바꾸지 않으면 고른 옵션이 아니라 기존 value를 계속 보여준다 (제어 상태 유지)", async () => {
    render(<AppSelect options={monthOptions} placeholder="월 선택" onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "월 선택" }));
    await userEvent.click(screen.getByRole("option", { name: "2월" }));

    expect(screen.getByRole("button", { name: "월 선택" })).toBeInTheDocument();
  });

  it("multiple이면 선택 결과를 원래 value 배열로 넘긴다", async () => {
    const onChange = vi.fn();
    render(
      <AppSelect multiple options={tagOptions} value={["FE"]} placeholder="직무 전체" onChange={onChange} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /프론트엔드/ }));
    await userEvent.click(screen.getByRole("option", { name: "백엔드" }));

    expect(onChange).toHaveBeenCalledWith(["FE", "BE"]);
  });

  it("disabled면 목록이 열리지 않는다", async () => {
    render(<AppSelect options={monthOptions} disabled placeholder="월 선택" onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "월 선택" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("state가 error이고 hint가 있으면 문구를 보여주고 aria-invalid를 단다", () => {
    render(
      <AppSelect options={monthOptions} state="error" hint="필수 항목입니다." placeholder="월 선택" onChange={vi.fn()} />,
    );

    expect(screen.getByText("필수 항목입니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "월 선택" })).toHaveAttribute("aria-invalid", "true");
  });
  it("ariaLabel은 트리거 이름이 되어 값을 고른 뒤에도 '이름, 현재 값'으로 읽힌다", () => {
    render(<AppSelect options={monthOptions} value={2} ariaLabel="월" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "월 2월" })).toBeInTheDocument();
  });

  it("ariaLabelledby로 바깥 라벨을 트리거 이름으로 연결한다", () => {
    render(
      <>
        <span id="company-label">기업</span>
        <AppSelect options={tagOptions} ariaLabelledby="company-label" placeholder="선택해주세요" onChange={vi.fn()} />
      </>,
    );

    expect(screen.getByRole("button", { name: "기업 선택해주세요" })).toBeInTheDocument();
  });

  describe("너비 래퍼", () => {
    it.each([
      [{}],
      [{ fullWidth: true }],
      [{ fullWidth: true, width: "200px" }],
    ])("%o → 부모 너비를 채운다", (props) => {
      const { container } = render(<AppSelect options={monthOptions} onChange={vi.fn()} {...props} />);

      expect(container.firstElementChild).toHaveClass("w-full");
    });

    it("width만 주면 그 너비로 고정하고 줄어들지 않는다", () => {
      const { container } = render(<AppSelect options={monthOptions} width="200px" onChange={vi.fn()} />);
      const wrapper = container.firstElementChild as HTMLElement;

      expect(wrapper).not.toHaveClass("w-full");
      expect(wrapper.style.width).toBe("200px");
      expect(wrapper.style.flexShrink).toBe("0");
    });
  });
});
