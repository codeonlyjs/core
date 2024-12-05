import { test } from "node:test";
import { strict as assert } from "node:assert";
import "./mockdom.js";
import { compileTemplate, html } from "../core/api.js";

test("Static Comment", () => {
    let r = compileTemplate({
        type: "#comment",
        text: "foo",
    })();

    assert.equal(r.rootNode.nodeType, 8);
    assert.equal(r.rootNode.nodeValue, "foo");
});

test("Dynamic Comment", () => {
    let val = "foo";
    let r = compileTemplate({
        type: "#comment",
        text: () => val,
    })();

    assert.equal(r.rootNode.nodeType, 8);
    assert.equal(r.rootNode.nodeValue, "foo");

    val = "bar";
    r.update();
    assert.equal(r.rootNode.nodeValue, "bar");

    val = "baz";
    r.update();
    assert.equal(r.rootNode.nodeValue, "baz");
});

test("Single Node", () => {

    let r = compileTemplate({
        type: "DIV",
    })();

    assert.equal(r.rootNodes[0].nodeName, "DIV");
});

test("Static Text Node", () => {

    let r = compileTemplate("Hello World")();

    assert.equal(r.rootNodes[0].nodeType, 3);
    assert.equal(r.rootNodes[0].nodeValue, "Hello World");
});

test("Dynamic Text Node", () => {

    let val = "foo";
    let r = compileTemplate(() => val)();

    let outer = coenv.document.createElement("div");
    outer.append(...r.rootNodes);

    assert.equal(outer.childNodes.length, 3);
    assert.deepStrictEqual(outer.childNodes, r.rootNodes);
    let contentNodes = outer.childNodes.filter(x => x.nodeType != 8 && x.nodeValue != "");
    assert.equal(contentNodes.length, 1);
    assert.equal(contentNodes[0].nodeType, 3);
    assert.equal(contentNodes[0].nodeValue, val);

    val = "bar";
    r.update();
    assert.equal(outer.childNodes.length, 3);
    assert.deepStrictEqual(outer.childNodes, r.rootNodes);
    contentNodes = outer.childNodes.filter(x => x.nodeType != 8 && x.nodeValue != "");
    assert.equal(contentNodes.length, 1);
    assert.equal(contentNodes[0].nodeType, 3);
    assert.equal(contentNodes[0].nodeValue, val);
});

test("Static Single-Node HTML", () => {

    let r = compileTemplate(html("Hello World"))();

    assert.equal(r.isSingleRoot, true);
    assert.equal(r.rootNodes[0].nodeType, 3);
    assert.equal(r.rootNodes[0].nodeValue, "Hello World");
});

test("Static Multi-Node HTML", () => {

    let r = compileTemplate(html("<div>Hello</div><div>World</div>"))();

    assert.equal(r.isSingleRoot, false);
    assert.equal(r.rootNodes.length, 2);
    assert.equal(r.rootNodes[0].nodeType, 1);
    assert.equal(r.rootNodes[0].textContent, "Hello");
    assert.equal(r.rootNodes[1].nodeType, 1);
    assert.equal(r.rootNodes[1].textContent, "World");
});

test("Empty HTML Node", () => {

    let r = compileTemplate(html(""))();

    assert.equal(r.isSingleRoot, false);
    assert.equal(r.rootNodes.length, 0);
});

test("Dynamic HTML Node", () => {

    let val = "foo";
    let r = compileTemplate(() => html(val))();

    let contentNodes = r.rootNodes.filter(x => x.nodeValue != "");
    assert.equal(contentNodes[0].nodeType, 3);
    assert.equal(contentNodes[0].nodeValue, val);

    val = "bar";
    r.update();

    contentNodes = r.rootNodes.filter(x => x.nodeValue != "");
    assert.equal(contentNodes[0].nodeType, 3);
    assert.equal(contentNodes[0].nodeValue, val);
});


test("Text Node", () => {

    let r = compileTemplate("Hello World")();

    assert.equal(r.rootNodes[0].nodeType, 3);
    assert.equal(r.rootNodes[0].nodeValue, "Hello World");
});

test("Inner Text", () => {

    let r = compileTemplate({
        type: "DIV",
        text: "Hello World",
    })();

    assert.equal(r.rootNodes[0].nodeName, "DIV");
    assert.equal(r.rootNodes[0].textContent, "Hello World");
});

test("Inner HTML", () => {

    let r = compileTemplate({
        type: "DIV",
        text: html("Hello World"),
    })();

    assert.equal(r.rootNodes[0].nodeName, "DIV");
    assert.equal(r.rootNodes[0].innerHTML, "Hello World");
});

test("Dynamic Text", () => {

    let text = 'foo';
    let r = compileTemplate({
        type: "DIV",
        text: () => text,
    })();

    assert.equal(r.rootNodes[0].textContent, "foo");

    text = 'bar';
    r.update();
    assert.equal(r.rootNodes[0].textContent, "bar");
});


test("Static ID Attribute", () => {

    let r = compileTemplate({
        type: "DIV",
        id: "foo",
    })();

    assert.equal(r.rootNodes[0].getAttribute("id"), "foo");
});

test("Dynamic ID Attribute", () => {

    let val = "foo";
    let r = compileTemplate({
        type: "DIV",
        id: () => val,
    })();

    assert.equal(r.rootNodes[0].getAttribute("id"), val);
    val = "bar";
    r.update();
    assert.equal(r.rootNodes[0].getAttribute("id"), val);
});

test("Static Class Attribute", () => {

    let r = compileTemplate({
        type: "DIV",
        class: "foo",
    })();

    assert.equal(r.rootNodes[0].getAttribute("class"), "foo");
});

test("Dynamic Class Attribute", () => {

    let val = "foo";
    let r = compileTemplate({
        type: "DIV",
        class: () => val,
    })();

    assert.equal(r.rootNodes[0].getAttribute("class"), val);
    val = "bar";
    r.update();
    assert.equal(r.rootNodes[0].getAttribute("class"), val);
});


test("Static Boolean Class", () => {

    let r = compileTemplate({
        type: "DIV",
        class_foo: true,
        class_bar: false,
    })();

    assert.equal(r.rootNodes[0].getAttribute("class"), "foo");
    assert(r.rootNodes[0].classList.has("foo"));
    assert(!r.rootNodes[0].classList.has("bar"));
});

test("Dynamic Boolean Class", () => {

    let val = true;
    let r = compileTemplate({
        type: "DIV",
        class_foo: () => val,
    })();

    assert.equal(r.rootNodes[0].getAttribute("class"), "foo");
    val = false;
    r.update();
    assert.equal(r.rootNodes[0].getAttribute("class"), "");
    val = true;
    r.update();
    assert.equal(r.rootNodes[0].getAttribute("class"), "foo");
});

test("Static Style", () => {

    let r = compileTemplate({
        type: "DIV",
        style_backgroundColor: "red",
    })();

    assert.equal(r.rootNodes[0].getAttribute("style"), "background-color: red");
});

test("Static Style (named)", () => {

    let r = compileTemplate({
        type: "DIV",
        "style_background-color": "red",
    })();

    assert.equal(r.rootNodes[0].getAttribute("style"), "background-color: red");
});

test("Dynamic Style", () => {

    let val = "red";
    let r = compileTemplate({
        type: "DIV",
        style_backgroundColor: () => val,
    })();

    assert.equal(r.rootNodes[0].getAttribute("style"), "background-color: red");

    val = "green";
    r.update();
    assert.equal(r.rootNodes[0].getAttribute("style"), "background-color: green");

    val = "blue";
    r.update();
    assert.equal(r.rootNodes[0].getAttribute("style"), "background-color: blue");
});


test("Static Display (false)", () => {

    let r = compileTemplate({
        type: "DIV",
        display: false,
    })();

    assert.equal(r.rootNodes[0].getAttribute("style"), "display: none");
});

test("Static Display (true)", () => {

    let r = compileTemplate({
        type: "DIV",
        display: true,
    })();

    assert.equal(r.rootNodes[0].getAttribute("style"), null);
});

test("Static Display (string)", () => {

    let r = compileTemplate({
        type: "DIV",
        display: "flex",
    })();

    assert.equal(r.rootNodes[0].getAttribute("style"), "display: flex");
});

test("Dynamic Display (with prior display set)", () => {

    let val = true;
    let r = compileTemplate({
        type: "DIV",
        style: "display: flex",
        display: () => val,
    })();

    assert.equal(r.rootNodes[0].getAttribute("style"), "display: flex");

    val = false;
    r.update();
    assert.equal(r.rootNodes[0].getAttribute("style"), "display: none");

    val = true;
    r.update();
    assert.equal(r.rootNodes[0].getAttribute("style"), "display: flex");

    val = "grid";
    r.update();
    assert.equal(r.rootNodes[0].getAttribute("style"), "display: grid");

    val = true;
    r.update();
    assert.equal(r.rootNodes[0].getAttribute("style"), "display: flex");
});

test("Dynamic Display (without prior display set)", () => {

    let val = true;
    let r = compileTemplate({
        type: "DIV",
        style: "",
        display: () => val,
    })();

    assert.equal(r.rootNodes[0].getAttribute("style"), "");

    val = false;
    r.update();
    assert.equal(r.rootNodes[0].getAttribute("style"), "display: none");

    val = true;
    r.update();
    assert.equal(r.rootNodes[0].getAttribute("style"), "");
});


test("Static Style Attribute", () => {

    let r = compileTemplate({
        type: "DIV",
        style: "foo",
    })();

    assert.equal(r.rootNodes[0].getAttribute("style"), "foo");
});

test("Dynamic Style Attribute", () => {

    let val = "foo";
    let r = compileTemplate({
        type: "DIV",
        style: () => val,
    })();

    assert.equal(r.rootNodes[0].getAttribute("style"), val);
    val = "bar";
    r.update();
    assert.equal(r.rootNodes[0].getAttribute("style"), val);
});


test("Static Attribute", () => {

    let r = compileTemplate({
        type: "DIV",
        attr_dataMyData: "foo",
    })();

    assert.equal(r.rootNodes[0].getAttribute("data-my-data"), "foo");
});

test("Dynamic Attribute", () => {

    let val = "foo";
    let r = compileTemplate({
        type: "DIV",
        attr_dataMyData: () => val,
    })();

    assert.equal(r.rootNodes[0].getAttribute("data-my-data"), val);
    val = "bar";
    r.update();
    assert.equal(r.rootNodes[0].getAttribute("data-my-data"), val);
});
