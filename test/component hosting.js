import { test } from "node:test";
import { strict as assert } from "node:assert";
import "./mockdom.js";
import { compileTemplate } from "../core/TemplateCompiler.js";
import { cloak } from "../core/CloakedValue.js";


test("Single root component at root level", () => {

    let component = compileTemplate({
        type: "DIV",
        text: "foo",
    });

    let r = compileTemplate({
        type: component,
    })();

    assert.equal(r.isSingleRoot, true);
    assert.equal(r.rootNode.textContent, "foo");

});


test("Single root component as child", () => {

    let component = compileTemplate({
        type: "DIV",
        text: "foo",
    });

    let r = compileTemplate({
        type: "DIV",
        $:
        [
            {
                type: component,
            }
        ]
    })();

    assert.equal(r.isSingleRoot, true);
    assert.equal(r.rootNode.childNodes[0].textContent, "foo");
});


test("Multi-root component at root level", () => {

    let component = compileTemplate({
        $:
        [
            "foo", 
            "bar"
        ]
    });

    let r = compileTemplate({
        type: component,
    })();

    assert.equal(r.isSingleRoot, false);
    assert.equal(r.rootNodes[0].nodeValue, "foo");
    assert.equal(r.rootNodes[1].nodeValue, "bar");

});


test("Multi-root component as child", () => {

    let component = compileTemplate({
        $:
        [
            "foo", 
            "bar"
        ]
    });

    let r = compileTemplate({
        type: "DIV",
        $:
        [
            {
                type: component,
            }
        ]
    })();

    assert.equal(r.isSingleRoot, true);
    assert.equal(r.rootNode.childNodes[0].nodeValue, "foo");
    assert.equal(r.rootNode.childNodes[1].nodeValue, "bar");
});


test("Conditional single-root component", () => {

    let component = compileTemplate({
        type: "DIV",
        $:
        [
            "foo", 
            "bar"
        ]
    });

    let value = true;
    let r = compileTemplate({
        type: "DIV",
        $:
        [
            {
                if: () => value,
                type: component,
            }
        ]
    })();

    assert.equal(r.isSingleRoot, true);
    assert.equal(r.rootNode.childNodes[0].childNodes[0].nodeValue, "foo");
    assert.equal(r.rootNode.childNodes[0].childNodes[1].nodeValue, "bar");

    value = false;
    r.update();
    assert.equal(r.rootNode.childNodes[0].nodeType, 8);

    value = true;
    r.update();
    assert.equal(r.rootNode.childNodes[0].childNodes[0].nodeValue, "foo");
    assert.equal(r.rootNode.childNodes[0].childNodes[1].nodeValue, "bar");
});

test("Conditional multi-root component", () => {

    let component = compileTemplate({
        $:
        [
            "foo", 
            "bar"
        ]
    });

    let value = true;
    let r = compileTemplate({
        type: "DIV",
        $:
        [
            {
                if: () => value,
                type: component,
            }
        ]
    })();

    assert.equal(r.isSingleRoot, true);
    assert.equal(r.rootNode.childNodes[0].nodeType, 8);
    assert.equal(r.rootNode.childNodes[1].nodeValue, "foo");
    assert.equal(r.rootNode.childNodes[2].nodeValue, "bar");

    value = false;
    r.update();
    assert.equal(r.rootNode.childNodes[0].nodeType, 8);
    assert.equal(r.rootNode.childNodes[1].nodeType, 8);

    value = true;
    r.update();
    assert.equal(r.rootNode.childNodes[0].nodeType, 8);
    assert.equal(r.rootNode.childNodes[1].nodeValue, "foo");
    assert.equal(r.rootNode.childNodes[2].nodeValue, "bar");
});



test("Foreach single-root component", () => {

    let component = compileTemplate({
        type: "DIV",
        $:
        [
            "foo", 
            "bar"
        ]
    });

    let value = ["apples", "pears", "bananas"];
    let r = compileTemplate({
        type: "DIV",
        $:
        [
            {
                foreach: () => value,
                type: component,
            }
        ]
    })();

    assert.equal(r.isSingleRoot, true);
    assert.equal(r.rootNode.childNodes.length, 5);

    value.unshift("foo", "bar");
    r.update();
    assert.equal(r.rootNode.childNodes.length, 7);

});


test("Foreach multi-root component", () => {

    let component = compileTemplate({
        $:
        [
            "foo", 
            "bar"
        ]
    });

    let value = ["apples", "pears", "bananas"];
    let r = compileTemplate({
        type: "DIV",
        $:
        [
            {
                foreach: () => value,
                type: component,
            }
        ]
    })();

    assert.equal(r.isSingleRoot, true);
    assert.equal(r.rootNode.childNodes.length, 8);

    value.unshift("foo", "bar");
    r.update();
    assert.equal(r.rootNode.childNodes.length, 12);
});



test("Component properties", () => {

    let component = compileTemplate({
        type: "DIV",
        text: "foo",
    });

    let val = "foo";
    let r = compileTemplate({
        type: "DIV",
        $:
        [
            {
                type: component,
                export: "instance",
                stringProperty: "Hello World",
                boolProperty: true,
                numberProperty: 23,
                arrayProperty: [1,2,3],
                dynamicProperty: () => val,
                functionProperty: cloak(() => val), // Pass function through to underlying component
            }
        ]
    })();

    assert.equal(r.isSingleRoot, true);
    assert.equal(r.instance.stringProperty, "Hello World");
    assert.equal(r.instance.boolProperty, true);
    assert.equal(r.instance.numberProperty, 23);
    assert.equal(r.instance.dynamicProperty, "foo");
    assert(r.instance.functionProperty instanceof Function);
    assert.deepStrictEqual(r.instance.arrayProperty, [1,2,3]);

    val = "bar";
    r.update();
    assert.equal(r.instance.dynamicProperty, "bar");

    r.update();
    assert.equal(r.instance.dynamicProperty, "bar");

});



test("Component Embed Slots (single root)", () => {

    let component = compileTemplate({
        type: "a",
        $: {
            type: "embed-slot",
            export: "content",
        }
    });
    component.slots = [ "content" ];

    let val = "foo";
    let r = compileTemplate({
        type: "DIV",
        $:{
            export: "anchor",
            type: component,
            content: {
                type: "span",
                text: () => val,
            }
        }
    })();

    assert.equal(r.anchor.rootNode.nodeName, "a");
    assert.equal(r.anchor.rootNode.textContent, "foo");

    val = "bar";
    r.update();
    assert.equal(r.anchor.rootNode.textContent, "bar");

});

test("Component Embed Slots (multi root)", () => {

    let component = compileTemplate({
        type: "a",
        $: {
            type: "embed-slot",
            export: "content",
        }
    });
    component.slots = [ "content" ];

    let val = "foo";
    let r = compileTemplate({
        type: "DIV",
        $:{
            export: "anchor",
            type: component,
            content: [
                {
                    type: "span",
                    text: () => val,
                },
                "-baz"
            ]
        }
    })();

    assert.equal(r.anchor.rootNode.nodeName, "a");
    assert.equal(r.anchor.rootNode.textContent, "foo-baz");

    val = "bar";
    r.update();
    assert.equal(r.anchor.rootNode.textContent, "bar-baz");

});

test("Component Embed Slots ($ content)", () => {

    let component = compileTemplate({
        type: "a",
        $: {
            type: "embed-slot",
            export: "content",
        }
    });
    component.slots = [ "content" ];

    let val = "foo";
    let r = compileTemplate({
        type: "div",
        $:{
            type: component,
            $: [ () => val, "-baz" ]
        }
    })();

    assert.equal(r.rootNode.innerHTML, "<a>foo-baz</a>");

    val = "bar";
    r.update();
    assert.equal(r.rootNode.innerHTML, "<a>bar-baz</a>");
});

