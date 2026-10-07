import assert from "node:assert/strict";
import test from "node:test";

import {
  isHtmlContent,
  parseJobDescriptionHtml,
} from "../lib/job-description.ts";

test("isHtmlContent distinguishes markup from plain text", () => {
  assert.equal(isHtmlContent("<p>Hello</p>"), true);
  assert.equal(isHtmlContent("<h1>Role</h1>"), true);
  assert.equal(isHtmlContent("Just a plain sentence."), false);
  assert.equal(isHtmlContent(null), false);
  assert.equal(isHtmlContent(""), false);
});

test("parses headings, paragraphs and lists into ordered blocks", () => {
  const html =
    "<h1>Our Mission</h1>" +
    '<p style="min-height:1.5em">Build robots.</p>' +
    "<h1>What You'll Work On</h1>" +
    '<ul style="min-height:1.5em">' +
    '<li><p style="min-height:1.5em">Operator interface</p></li>' +
    '<li><p style="min-height:1.5em">Alert triage</p></li>' +
    "</ul>";

  assert.deepEqual(parseJobDescriptionHtml(html), [
    { kind: "heading", text: "Our Mission" },
    { kind: "paragraph", text: "Build robots." },
    { kind: "heading", text: "What You'll Work On" },
    { kind: "list", items: ["Operator interface", "Alert triage"] },
  ]);
});

test("decodes entities and collapses whitespace", () => {
  const blocks = parseJobDescriptionHtml(
    "<p>Frontend&nbsp;&amp;&nbsp;backend &mdash; UI/UX</p>",
  );
  assert.deepEqual(blocks, [
    { kind: "paragraph", text: "Frontend & backend — UI/UX" },
  ]);
  assert.deepEqual(parseJobDescriptionHtml("<p>It&#39;s here</p>"), [
    { kind: "paragraph", text: "It's here" },
  ]);
});

test("keeps text around stray anchors and drops inline tags", () => {
  const html =
    '<p>Find <a href="https://example.com">Jobs in Switzerland</a> on Arbeitnow</a></p>';
  assert.deepEqual(parseJobDescriptionHtml(html), [
    { kind: "paragraph", text: "Find Jobs in Switzerland on Arbeitnow" },
  ]);
});

test("strips script and style content entirely", () => {
  const blocks = parseJobDescriptionHtml(
    "<style>p{color:red}</style><script>alert(1)</script><p>Real copy</p>",
  );
  assert.deepEqual(blocks, [{ kind: "paragraph", text: "Real copy" }]);
});

test("splits on <br> and ignores empty blocks", () => {
  const blocks = parseJobDescriptionHtml("<p>Line one<br>Line two</p><p></p>");
  assert.deepEqual(blocks, [
    { kind: "paragraph", text: "Line one Line two" },
  ]);
});