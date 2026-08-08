import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResearchSourceLinks } from "./ResearchSourceLinks";

describe("ResearchSourceLinks", () => {
  it("출처가 없으면 아무것도 그리지 않아야 한다", () => {
    const { container } = render(<ResearchSourceLinks sources={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("제공자가 준 제목을 라벨로 써야 한다", () => {
    render(
      <ResearchSourceLinks
        sources={[{ url: "https://a.example.com/x", title: "삼성생명 채용" }]}
      />,
    );

    expect(screen.getByRole("link", { name: "삼성생명 채용" })).toHaveAttribute(
      "href",
      "https://a.example.com/x",
    );
  });

  it("제목이 없으면 도메인을 라벨로 써야 한다", () => {
    render(<ResearchSourceLinks sources={[{ url: "https://www.samsunglife.com/about" }]} />);

    expect(screen.getByRole("link", { name: "samsunglife.com" })).toBeInTheDocument();
  });

  it("리다이렉트 주소는 제목이 없으면 번호로 구분해야 한다", () => {
    // Gemini 검색 결과는 호스트가 전부 같아 도메인이 라벨 구실을 못 한다
    render(
      <ResearchSourceLinks
        sources={[
          { url: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/1" },
          { url: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/2" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "출처 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "출처 2" })).toBeInTheDocument();
  });

  it("리다이렉트 주소라도 제목이 있으면 제목을 쓴다", () => {
    render(
      <ResearchSourceLinks
        sources={[
          {
            url: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/1",
            title: "samsunglife.com",
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "samsunglife.com" })).toBeInTheDocument();
  });

  it("허용되지 않는 스킴은 링크로 만들지 않아야 한다", () => {
    render(
      <ResearchSourceLinks
        sources={[{ url: "javascript:alert(1)" }, { url: "https://ok.example.com/a" }]}
      />,
    );

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "ok.example.com" })).toBeInTheDocument();
  });

  it("전부 걸러지면 아무것도 그리지 않아야 한다", () => {
    const { container } = render(
      <ResearchSourceLinks sources={[{ url: "javascript:alert(1)" }]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("새 탭으로 열되 referrer 를 넘기지 않아야 한다", () => {
    render(<ResearchSourceLinks sources={[{ url: "https://ok.example.com/a" }]} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });
});
