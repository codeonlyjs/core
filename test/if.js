import { test } from "node:test";
import { strict as assert } from "node:assert";
import "./mockdom.js";
import { Template } from "../core/index.js";


test("If (true)", () => {

    let r = Template.compile({
        type: "DIV",
        $: [
            { 
                if: true,
                type: "SPAN", 
                text: "foo", 
            },
        ]
    })();

    assert.equal(r.rootNodes[0].childNodes[0].nodeType, 1);
});


test("If (false)", () => {

    let r = Template.compile({
        type: "DIV",
        $: [
            { type: "SPAN", text: "foo", if: false },
        ]
    })();

    assert.equal(r.rootNodes[0].childNodes.length, 1);
});


test("If", () => {

    let val = false;
    let r = Template.compile({
        type: "DIV",
        $: 
        [
            { 
                if: () => val,
                type: "DIV", 
                $: [ "A", "B", "C" ]
            },
        ]
    })();

    assert.equal(r.rootNodes[0].childNodes[0].nodeType, 8);
    val = true;
    r.update();
    assert.equal(r.rootNodes[0].childNodes[0].nodeType, 1);
    assert.equal(r.rootNodes[0].childNodes[0].nodeName, "DIV");
    val = false;
    r.update();
    assert.equal(r.rootNodes[0].childNodes[0].nodeType, 8);
});

test("If-Else", () => {

    let val = true;
    let r = Template.compile({
        type: "DIV",
        $: [
            { 
                if: () => val,
                type: "DIV", 
                text: "foo",
            },
            { 
                else: true,
                type: "DIV", 
                text: "bar",
            },
        ]
    })();

    assert.equal(r.rootNode.childNodes[0].nodeType, 1);
    assert.equal(r.rootNode.childNodes[0].textContent, "foo");

    val = false;
    r.update();

    assert.equal(r.rootNode.childNodes[0].nodeType, 1);
    assert.equal(r.rootNode.childNodes[0].textContent, "bar");
});

test("If-ElseIf", () => {

    let val = 1;
    let r = Template.compile({
        type: "DIV",
        $: [
            { 
                if: () => val == 1,
                type: "DIV", 
                text: "foo",
            },
            { 
                elseif: () => val == 2,
                type: "DIV", 
                text: "bar",
            },
        ]
    })();

    assert.equal(r.rootNode.childNodes[0].nodeType, 1);
    assert.equal(r.rootNode.childNodes[0].textContent, "foo");

    val = 2;
    r.update();

    assert.equal(r.rootNode.childNodes[0].nodeType, 1);
    assert.equal(r.rootNode.childNodes[0].textContent, "bar");

    val = 3;
    r.update();

    assert.equal(r.rootNode.childNodes[0].nodeType, 8);
});


test("If-ElseIf-Else", () => {

    let val = 1;
    let r = Template.compile({
        type: "DIV",
        $: [
            { 
                if: () => val == 1,
                type: "DIV", 
                text: "foo",
            },
            { 
                elseif: () => val == 2,
                type: "DIV", 
                text: "bar",
            },
            {
                else: true,
                type: "DIV", 
                text: "baz",
            },
        ]
    })();

    assert.equal(r.rootNode.childNodes[0].nodeType, 1);
    assert.equal(r.rootNode.childNodes[0].textContent, "foo");

    val = 2;
    r.update();

    assert.equal(r.rootNode.childNodes[0].nodeType, 1);
    assert.equal(r.rootNode.childNodes[0].textContent, "bar");

    val = 3;
    r.update();

    assert.equal(r.rootNode.childNodes[0].nodeType, 1);
    assert.equal(r.rootNode.childNodes[0].textContent, "baz");
});

test("If Foreach Fragment", () => {

    let val = true;
    let r = Template.compile({
        type: "DIV",
        $: [
            {
                if: () => val,
                $: [
                    "text",
                    { 
                        foreach: [ "A", "B", "C" ],
                        type: "DIV", 
                        text: x => x,
                    },
                ]
            }
        ]
    })();

    assert.equal(r.rootNode.childNodes.length, 7);      // if sentinal + text + foreach*2 + foreach head/tail sentinal

    val = false;
    r.update();

    assert.equal(r.rootNode.childNodes.length, 2);      // if sentinal + placeholder

    val = true;
    r.update();

    assert.equal(r.rootNode.childNodes.length,7);      // as before
});

test("If at root", () => {

    let val = true;
    let r = Template.compile({
        type: "DIV",
        if: () => val,
    })();

    let outer = coenv.document.createElement("DIV");
    outer.append(r.rootNode);

    assert.equal(r.rootNode.nodeType, 1);
    assert.equal(r.rootNode, outer.childNodes[0]);

    val = false;
    r.update();
    assert.equal(r.rootNode.nodeType, 8);
    assert.equal(r.rootNode, outer.childNodes[0]);

    val = true;
    r.update();
    assert.equal(r.rootNode.nodeType, 1);
    assert.equal(r.rootNode, outer.childNodes[0]);
});

test("If at root (true)", () => {

    let r = Template.compile({
        type: "DIV",
        if: true,
    })();

    let outer = coenv.document.createElement("DIV");
    outer.append(r.rootNode);

    assert.equal(r.rootNode.nodeType, 1);
});

test("If at root (false)", () => {

    let r = Template.compile({
        type: "DIV",
        if: false,
    })();

    let outer = coenv.document.createElement("DIV");
    outer.append(r.rootNode);

    assert.equal(r.rootNode.nodeType, 8);
});


test("If on fragment at root", () => {

    let val = true;
    let r = Template.compile({
        if: () => val,
        $: 
        [
            {
                type: "DIV",
            }
        ]
    })();

    let outer = coenv.document.createElement("DIV");
    outer.append(...r.rootNodes);

    assert.equal(r.rootNodes.length, 1);
    assert.equal(r.rootNodes[0].nodeType, 1);

    val = false;
    r.update();
    assert.equal(r.rootNodes.length, 1);
    assert.equal(r.rootNodes[0].nodeType, 8);

    val = true;
    r.update();
    assert.equal(r.rootNodes.length, 1);
    assert.equal(r.rootNodes[0].nodeType, 1);
});


