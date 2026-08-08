import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResearchSourceLinks } from "./ResearchSourceLinks";

describe("ResearchSourceLinks", () => {
  it("출처가 없으면 아무것도 그리지 않아야 한다", () => {
    const { container } = render(<ResearchSourceLinks urls={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("도메인을 라벨로 보여줘야 한다", () => {
    render(<ResearchSourceLinks urls={["https://www.samsunglife.com/about"]} />);

    // 번호만 보여주면 어디로 가는지 알 수 없다. www 는 뗀다
    expect(screen.getByRole("link", { name: "samsunglife.com" })).toHaveAttribute(
      "href",
      "https://www.samsunglife.com/about",
    );
  });

  it("허용되지 않는 스킴은 링크로 만들지 않아야 한다", () => {
    render(
      <ResearchSourceLinks
        urls={["javascript:alert(1)", "https://ok.example.com/a"]}
      />,
    );

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "ok.example.com" })).toBeInTheDocument();
  });

  it("전부 걸러지면 아무것도 그리지 않아야 한다", () => {
    const { container } = render(<ResearchSourceLinks urls={["javascript:alert(1)"]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("새 탭으로 열되 referrer 를 넘기지 않아야 한다", () => {
    render(<ResearchSourceLinks urls={["https://ok.example.com/a"]} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });
});
