import fs from "node:fs";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseSelector } from "../minidom/parseSelector.js";


test("tag", () => {
    let sel = parseSelector("div");
    assert.deepStrictEqual(sel, [
        { tag: "div" }
    ]);
});

test("id", () => {
    let sel = parseSelector("#id");
    assert.deepStrictEqual(sel, [
        { id: "id" }
    ]);
});

test("class", () => {
    let sel = parseSelector(".class");
    assert.deepStrictEqual(sel, [
        { class: [ "class" ] }
    ]);
});

test("classes", () => {
    let sel = parseSelector(".foo.bar.baz");
    assert.deepStrictEqual(sel, [
        { class: [ "foo", "bar", "baz" ] }
    ]);
});

test("all", () => {
    let sel = parseSelector("div#id.foo.bar.baz");
    assert.deepStrictEqual(sel, [
        { tag: "div", id: "id", class: [ "foo", "bar", "baz" ] }
    ]);
});

test("nested", () => {
    let sel = parseSelector("outer inner.cls div#id.foo.bar.baz");
    assert.deepStrictEqual(sel, [
        { tag: "outer",  },
        { tag: "inner", class: [ "cls" ] },
        { tag: "div", id: "id", class: [ "foo", "bar", "baz" ] },
    ]);
});

