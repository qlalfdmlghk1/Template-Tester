import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResearchSourceLinks } from "./ResearchSourceLinks";

/** 링크는 접혀 있으므로 펼쳐야 보인다 */
async function expand() {
  await userEvent.click(screen.getByRole("button"));
}

describe("ResearchSourceLinks — 접기", () => {
  it("출처가 없으면 아무것도 그리지 않아야 한다", () => {
    const { container } = render(<ResearchSourceLinks sources={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("처음에는 접혀 있고 개수만 보여줘야 한다", () => {
    // 항목마다 링크를 펼쳐두면 본문보다 링크가 더 눈에 띈다
    render(
      <ResearchSourceLinks
        sources={[{ url: "https://a.example.com/x" }, { url: "https://b.example.com/y" }]}
      />,
    );

    expect(screen.getByRole("button", { name: /출처 2/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("누르면 펼쳐지고 다시 누르면 접혀야 한다", async () => {
    render(<ResearchSourceLinks sources={[{ url: "https://a.example.com/x" }]} />);

    await expand();
    expect(screen.getAllByRole("link")).toHaveLength(1);

    await expand();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});

describe("ResearchSourceLinks — 라벨", () => {
  it("제공자가 준 제목을 라벨로 써야 한다", async () => {
    render(
      <ResearchSourceLinks
        sources={[{ url: "https://a.example.com/x", title: "삼성생명 채용" }]}
      />,
    );
    await expand();

    expect(screen.getByRole("link", { name: "삼성생명 채용" })).toHaveAttribute(
      "href",
      "https://a.example.com/x",
    );
  });

  it("제목이 없으면 도메인을 라벨로 써야 한다", async () => {
    render(<ResearchSourceLinks sources={[{ url: "https://www.samsunglife.com/about" }]} />);
    await expand();

    expect(screen.getByRole("link", { name: "samsunglife.com" })).toBeInTheDocument();
  });

  it("리다이렉트 주소는 제목이 없으면 번호로 구분해야 한다", async () => {
    // Gemini 검색 결과는 호스트가 전부 같아 도메인이 라벨 구실을 못 한다
    render(
      <ResearchSourceLinks
        sources={[
          { url: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/1" },
          { url: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/2" },
        ]}
      />,
    );
    await expand();

    expect(screen.getByRole("link", { name: "출처 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "출처 2" })).toBeInTheDocument();
  });

  it("리다이렉트 주소라도 제목이 있으면 제목을 쓴다", async () => {
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
    await expand();

    expect(screen.getByRole("link", { name: "samsunglife.com" })).toBeInTheDocument();
  });
});

describe("ResearchSourceLinks — 안전한 링크", () => {
  it("허용되지 않는 스킴은 링크로 만들지 않아야 한다", async () => {
    render(
      <ResearchSourceLinks
        sources={[{ url: "javascript:alert(1)" }, { url: "https://ok.example.com/a" }]}
      />,
    );
    await expand();

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "ok.example.com" })).toBeInTheDocument();
  });

  it("전부 걸러지면 아무것도 그리지 않아야 한다", () => {
    const { container } = render(
      <ResearchSourceLinks sources={[{ url: "javascript:alert(1)" }]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("새 탭으로 열되 referrer 를 넘기지 않아야 한다", async () => {
    render(<ResearchSourceLinks sources={[{ url: "https://ok.example.com/a" }]} />);
    await expand();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });
});
