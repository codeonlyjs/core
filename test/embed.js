import { test } from "node:test";
import { strict as assert } from "node:assert";
import "./mockdom.js";
import { Component } from "../core/Component.js";
import { compileTemplate } from "../core/TemplateCompiler.js";
import { EmbedSlot } from "../core/EmbedSlot.js";


test("Empty Embed", () => {

    let r = compileTemplate({
        type: "DIV",
        $: [
            "pre",
            {
                type: "embed-slot",
                export: "slot",
            },
            "post",
        ]
    })();

    assert(r.slot instanceof EmbedSlot);
    assert.equal(r.rootNode.childNodes.length, 4);      // pre + post + embed head/tail sentinals
});

test("Embedded Single Element", () => {

    let r = compileTemplate({
        type: "DIV",
        $: [
            "pre",
            {
                type: "embed-slot",
                export: "slot",
            },
            "post",
        ]
    })();

    assert(r.slot instanceof EmbedSlot);

    r.slot.content = coenv.document.createElement("span");

    assert.equal(r.rootNode.childNodes.length, 5);      // pre + post + embed head/tail sentinals + 2x spans

    r.slot.content = null;
    assert.equal(r.rootNode.childNodes.length, 4);
    
});

test("Embedded Multiple Elements", () => {

    let r = compileTemplate({
        type: "DIV",
        $: [
            "pre",
            {
                type: "embed-slot",
                export: "slot",
            },
            "post",
        ]
    })();

    assert(r.slot instanceof EmbedSlot);

    r.slot.content = [
        coenv.document.createElement("span"),
        coenv.document.createElement("span"),
    ]

    assert.equal(r.rootNode.childNodes.length, 6);      // pre + post + embed head/tail sentinals + 2x spans

    r.slot.content = null;
    assert.equal(r.rootNode.childNodes.length, 4);
    
});


test("Embedded with Placeholder", () => {

    let r = compileTemplate({
        type: "DIV",
        $: [
            "pre",
            {
                type: "embed-slot",
                export: "slot",
                placeholder: {
                    type: "span",
                    text: "placeholder content",
                },
            },
            "post",
        ]
    })();

    assert(r.slot instanceof EmbedSlot);

    r.slot.content = coenv.document.createElement('span');
    r.slot.content.textContent = "embedded content";

    assert.equal(r.rootNode.childNodes.length, 5);      // pre + post + embed head/tail sentinals + 2x spans
    assert.equal(r.rootNode.childNodes[2].textContent, "embedded content");

    r.slot.content = null;
    assert.equal(r.rootNode.childNodes[2].textContent, "placeholder content");
});





class MyComponent extends Component
{
    constructor()
    {
        super()
    }

    destroy()
    {
        this.wasDestroyed = true;
        super.destroy();
    }

    static template = {
        $: [
            "apples",
            "pears",
            "bananas",
        ]
    }
}


test("Embedded Component", () => {

    let r = compileTemplate({
        type: "DIV",
        $: [
            "pre",
            {
                type: "embed-slot",
                export: "slot",
            },
            "post",
        ]
    })();

    assert(r.slot instanceof EmbedSlot);

    r.slot.content = new MyComponent();

    assert.equal(r.rootNode.childNodes.length, 7);      // pre + post + embed head/tail sentinals + 3x spans from component

    r.slot.content = null;
    assert.equal(r.rootNode.childNodes.length, 4);

});


test("Embedded Component destroyed", () => {

    let r = compileTemplate({
        type: "DIV",
        $: [
            "pre",
            {
                type: "embed-slot",
                export: "slot",
            },
            "post",
        ]
    })();

    // Create component and load it into slot
    let c = new MyComponent();
    r.slot.content = c;

    // Destroy the outer component and check the embedded inner component's 
    // destroy method was called
    r.destroy();
    assert(c.wasDestroyed);

});
