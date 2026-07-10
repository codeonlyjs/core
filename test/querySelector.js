import fs from "node:fs";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { querySelector, querySelectorAll  } from "../minidom/parseSelector.js";
import { Document } from "../minidom/api.js";


test("tag", () => {

    let doc = new Document("<div><h1>Heading</h1></div>");
    
    let r = querySelector(doc, "h1");
    assert.equal(r.nodeName, "h1");
});


test("id", () => {

    let doc = new Document(`<div><h1 id="heading">Heading</h1></div>`);
    
    let r = querySelector(doc, "#heading");
    assert.equal(r.nodeName, "h1");
});


test("class", () => {

    let doc = new Document(`<div><h1 class="c1 c2 c3">Heading</h1></div>`);
    
    let r = querySelector(doc, ".c2");
    assert.equal(r.nodeName, "h1");
});


test("all", () => {

    let doc = new Document(`<div><h1 id="heading" class="c1 c2 c3">Heading</h1></div>`);
    
    let r = querySelector(doc, "h1#heading.c2");
    assert.equal(r.nodeName, "h1");
});


test("multiple", () => {

    let doc = new Document(`<div><h1>Heading1</h1><h2>Heading2</h2><h3>Heading3</h3></div>`);
    
    let r = querySelectorAll(doc, "h1,h2,h3");
    assert.equal(r.length, 3);
    assert.equal(r[0].nodeName, "h1");
    assert.equal(r[1].nodeName, "h2");
    assert.equal(r[2].nodeName, "h3");
});

test("multiple with condition", () => {

    let doc = new Document(`<div><h1>Heading1</h1><h2>Heading2</h2><h2 id="match">Heading2</h2><h3>Heading3</h3></div>`);
    
    let r = querySelectorAll(doc, "h1,h2#match,h3");
    assert.equal(r.length, 3);
    assert.equal(r[0].nodeName, "h1");
    assert.equal(r[1].nodeName, "h2");
    assert.equal(r[1].id, "match");
    assert.equal(r[2].nodeName, "h3");
});

