import { test } from "node:test";
import { strict as assert } from "node:assert";
import "./mockdom.js";
import { compileTemplate, html } from "../core/index.js";

test("Basic", () => {

    let r = compileTemplate({
        type: "DIV",
        $: [
            { type: "SPAN", text: "foo" },
            { type: "SPAN", text: "bar" },
        ]
    })();

    assert.equal(r.rootNodes[0].childNodes.length, 2);
    assert.equal(r.rootNodes[0].childNodes[0].nodeName, "SPAN");
    assert.equal(r.rootNodes[0].childNodes[1].nodeName, "SPAN");
});

test("Child Nodes with Dynamic Text", () => {

    let val = "foo";
    let r = compileTemplate({
        type: "DIV",
        $: [
            { type: "SPAN", text: () => val },
        ]
    })();

    assert.equal(r.rootNodes[0].childNodes[0].textContent, val);
    val = "bar";
    r.update();
    assert.equal(r.rootNodes[0].childNodes[0].textContent, val);
});


test("Child Nodes with Static Text", () => {

    let val = "foo";
    let r = compileTemplate({
        type: "DIV",
        text: val,
    })();

    assert.equal(r.rootNodes[0].textContent, val);
});

test("Child Nodes with Static HTML", () => {

    let val = "<span>foo</span>";
    let r = compileTemplate({
        type: "DIV",
        text: html(val),
    })();

    assert.equal(r.rootNodes[0].innerHTML, val);
});

test("$: Static Text", () => {

    let val = "foo";
    let r = compileTemplate({
        type: "DIV",
        $: val,
    })();

    assert.equal(r.rootNodes[0].textContent, val);
});

test("$: Static HTML", () => {

    let val = "<span>foo</span>";
    let r = compileTemplate({
        type: "DIV",
        $: html(val),
    })();

    assert.equal(r.rootNodes[0].innerHTML, val);
});

