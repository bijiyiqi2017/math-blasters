import { Card } from "../components/Card";
import { PageLayout } from "../components/PageLayout";
import { RenderMarkdown } from "../components/Markdown";

/**
 * Dev-only preview for the markdown renderer.
 *
 * The first two samples are the only shapes a lesson step actually produces
 * today - the parser splits a file on --explain--/--answer-- and hands over
 * the step body, never the frontmatter and never the criteria block. The rest
 * is defensive styling, kept so a change to it is visible somewhere.
 */
export default function MarkdownStyleGuideView() {
  return (
    <PageLayout heading={<h1>Markdown style guide</h1>}>
      <Card as="section" title="An explain step">
        <RenderMarkdown content={explainStep} />
      </Card>

      <Card as="section" title="An answer prompt">
        <RenderMarkdown content={answerPrompt} />
      </Card>

      <Card as="section" title="Everything else the renderer supports">
        <RenderMarkdown content={kitchenSink} />
      </Card>
    </PageLayout>
  );
}

const explainStep = `Addition is combining two or more numbers together to find a total sum. For example, if you have 3 apples and get 4 more, you count all of them together.`;

const answerPrompt = `What is $3 + 4$?`;

const kitchenSink = `
## Heading level two

Prose with inline math, $3 + 4 = 7$, and a [link](https://www.freecodecamp.org/learn/).

- First item
- Second item

A loose list, which markdown wraps each item of in a paragraph:

- First item

- Second item

| Name | Value |
| --- | ---: |
| Apples | 3 |
| Oranges | 4 |

\`\`\`js
const total = 3 + 4;
\`\`\`

$$
\\int_0^1 x^2 \\, dx = \\frac{1}{3}
$$

> A block quote, for when a lesson needs to set something apart.

---

### Heading level three

Text after a rule, to check the spacing either side of it.

<script>alert("not executed")</script>
`;
