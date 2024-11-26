import fs from "node:fs";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { Document, parseHtml, CharacterData } from "../minidom/index.js";

test("text node", () => {
    let nodes = parseHtml(new Document(), "Hello World");
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].nodeType, 3);
    assert.equal(nodes[0].nodeValue, "Hello World");
});

test("named entity", () => {
    let nodes = parseHtml(new Document(), "Hello &lt;World&gt;");
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].nodeType, 3);
    assert.equal(nodes[0].nodeValue, "Hello <World>");
});

test("decimal entity", () => {
    let nodes = parseHtml(new Document(), "Hello &#60;World&#62;");
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].nodeType, 3);
    assert.equal(nodes[0].nodeValue, "Hello <World>");
});

test("hex entity", () => {
    let nodes = parseHtml(new Document(), "Hello &#x3C;World&#X3E;");
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].nodeType, 3);
    assert.equal(nodes[0].nodeValue, "Hello <World>");
});

test("comment", () => {
    let nodes = parseHtml(new Document(), "<!-- comment -->");
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].nodeType, 8);
    assert.equal(nodes[0].nodeValue, " comment ");
});

test("comment with entity", () => {
    let nodes = parseHtml(new Document(), "<!-- &lt;comment&gt; -->");
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].nodeType, 8);
    assert.equal(nodes[0].nodeValue, " <comment> ");
});

test("element", () => {
    let nodes = parseHtml(new Document(), "<tag/>");
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].nodeType, 1);
    assert.equal(nodes[0].nodeName, "tag");
});

test("element with attribute", () => {
    let nodes = parseHtml(new Document(), "<tag attr=value/>");
    assert.equal(nodes[0].getAttribute("attr"), "value");
});


test("element with quoted attribute", () => {
    let nodes = parseHtml(new Document(), "<tag attr=\"value\"/>");
    assert.equal(nodes[0].getAttribute("attr"), "value");
});

test("element with attribute with entity", () => {
    let nodes = parseHtml(new Document(), "<tag attr=\"&lt;value&gt;\"/>");
    assert.equal(nodes[0].getAttribute("attr"), "<value>");
});

test("element with child nodes", () => {
    let nodes = parseHtml(new Document(), "<outer><inner1/><inner2/></outer>");
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].childNodes.length, 2);
});


test("element with mixed child nodes", () => {
    let nodes = parseHtml(new Document(), "<outer><!-- foo -->   bar   baz   <inner/></outer>");
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].childNodes.length, 3);
    assert.equal(nodes[0].childNodes[0].nodeType, 8);
    assert.equal(nodes[0].childNodes[0].nodeValue, " foo ");
    assert.equal(nodes[0].childNodes[1].nodeType, 3);
    assert.equal(nodes[0].childNodes[1].nodeValue, "   bar   baz   ");
    assert.equal(nodes[0].childNodes[2].nodeType, 1);
    assert.equal(nodes[0].childNodes[2].nodeName, "inner");
});


test("complex", () => {
    parseHtml(new Document(), `
  <div><textarea></textarea></div>
`);
});