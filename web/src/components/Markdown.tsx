import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type RenderMarkdownProps = {
  content: string;
};

/**
 * Renders a markdown string. Takes the string as a prop and reads nothing
 * itself - lesson files are parsed elsewhere and the step body is handed in.
 *
 * rehype-raw is deliberately absent: content is trusted because it lives in
 * the repo, but raw HTML lets an author hand-roll markup that no design token
 * touches.
 */
export function RenderMarkdown({ content }: RenderMarkdownProps) {
  return (
    <article className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          /*
           * Both of these scroll horizontally when their content is wider than
           * the page. tabIndex makes them focusable so a keyboard-only reader
           * can actually scroll them - a scroll container that cannot be
           * focused is unreachable without a pointer.
           */
          table: ({ children }) => (
            <div className="markdown-table-wrapper" tabIndex={0}>
              <table>{children}</table>
            </div>
          ),
          pre: ({ children }) => <pre tabIndex={0}>{children}</pre>,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
