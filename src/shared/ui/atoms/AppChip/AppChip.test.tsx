import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AppChip from "./AppChip";

describe("AppChip (DS 어댑터)", () => {
  it.each([
    ["primary", "cds-badge--brand"],
    ["secondary", "cds-badge--neutral"],
    ["success", "cds-badge--success"],
    ["error", "cds-badge--danger"],
  ] as const)("%s → %s", (variant, dsClass) => {
    render(<AppChip variant={variant}>라벨</AppChip>);

    expect(screen.getByText("라벨")).toHaveClass("cds-badge", "cds-badge--soft", "cds-badge--sm", dsClass);
  });

  it.each([
    ["warning", "app-chip--warning"],
    ["purple", "app-chip--purple"],
  ] as const)("DS에 없는 %s는 앱 색 클래스 %s를 덧입힌다", (variant, appClass) => {
    render(<AppChip variant={variant}>라벨</AppChip>);

    expect(screen.getByText("라벨")).toHaveClass("cds-badge", appClass);
  });

  it("기본 variant는 primary(brand)이고, className은 그대로 붙인다", () => {
    render(<AppChip className="ml-1">기본</AppChip>);

    const chip = screen.getByText("기본");
    expect(chip).toHaveClass("cds-badge--brand", "ml-1");
    expect(chip.className).not.toMatch(/app-chip--/);
  });
});
