import fs from "node:fs";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { prettyHtml } from "../minidom/index.js";

test("p", () => {
    let doc = `<p>Hello World</p>`;
    let html = prettyHtml(doc);
    assert.equal(html, `<p>Hello World</p>\n`);
});

test("p > span", () => {
    let doc = `<p>Hello<span> World</span></p>`;
    let html = prettyHtml(doc);
    assert.equal(html, `<p>Hello<span> World</span></p>\n`);
});

test("p > div", () => {
    let doc = `<p><div>Hello World</div></p>`;
    let html = prettyHtml(doc);
    assert.equal(html, `<p>\n  <div>Hello World</div>\n</p>\n`);
});


test("div > div", () => {
    let doc = `<div><div>Hello World</div></div>`;
    let html = prettyHtml(doc);
    assert.equal(html, `<div>\n  <div>Hello World</div>\n</div>\n`);
});

test("script", () => {
    let doc = `<script>anything \n can \n go \n in \n here</script>`;
    let html = prettyHtml(doc);
    assert.equal(html, `<script>\nanything \n can \n go \n in \n here\n</script>\n`);
});

test("textarea", () => {
    let doc = `<textarea>anything \n can \n go \n in \n here</textarea>`;
    let html = prettyHtml(doc);
    assert.equal(html, `<textarea>anything \n can \n go \n in \n here</textarea>\n`);
});

test("pre > code", () => {
    let doc = `<pre><code>anything \n can \n go \n in \n here</code></pre>`;
    let html = prettyHtml(doc);
    assert.equal(html, `<pre><code>anything \n can \n go \n in \n here</code></pre>\n`);
});



