import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RenderMarkdown } from "../src/components/Markdown";

describe("Markdown tests", () => {
  it("renders a h1 heading", () => {
    render(<RenderMarkdown content="# Heading" />);
    expect(screen.getByRole("heading", { level: 1, name: "Heading" })).toBeInTheDocument();
  });

  it("renders a h2 heading", () => {
    render(<RenderMarkdown content="## Heading" />);
    expect(screen.getByRole("heading", { level: 2, name: "Heading" })).toBeInTheDocument();
  });

  it("renders inline math with KaTeX", () => {
    const { container } = render(
      <RenderMarkdown content="$3 + 4 = 7$" />,
    );

    expect(container.querySelector(".katex")).toBeInTheDocument();
    expect(container.querySelector(".katex-mathml")).toBeInTheDocument();
  });

  it("renders a code block", () => {
    render(
      <RenderMarkdown content={"```js\nconst foo = 'bar';\n```"} />,
    );

    expect(screen.getByText("const foo = 'bar';")).toBeInTheDocument();
  });

  it("does not turn a raw script into an element", () => {
    // Asserted on the DOM, not on text: testing-library ignores script and
    // style elements, so a queryByText assertion here passes even when a real
    // script element is present and cannot catch the regression it guards.
    const { container } = render(
      <RenderMarkdown content="<script>alert('hi')</script>" />,
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container).toHaveTextContent("<script>alert('hi')</script>");
  });

  it("wraps a table in its own focusable scroll container", () => {
    const { container } = render(
      <RenderMarkdown content={"| A | B |\n| --- | --- |\n| 1 | 2 |"} />,
    );

    const wrapper = container.querySelector(".markdown-table-wrapper");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.querySelector("table")).toBeInTheDocument();
    expect(wrapper).toHaveAttribute("tabindex", "0");
  });

  it("makes a code block focusable so it can be scrolled by keyboard", () => {
    const { container } = render(
      <RenderMarkdown content={"```js\nconst foo = 'bar';\n```"} />,
    );

    expect(container.querySelector("pre")).toHaveAttribute("tabindex", "0");
  });
});
