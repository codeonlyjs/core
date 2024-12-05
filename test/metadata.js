import { test } from "node:test";
import { strict as assert } from "node:assert";
import "./mockdom.js";
import { compileTemplate } from "../core/api.js";


test("Single-root", () => {

    let component = compileTemplate({
        type: "DIV",
        text: "foo",
    });

    assert.equal(component.isSingleRoot, true);
});


test("Single-root fragment", () => {

    let component = compileTemplate({
        $: [
            "apples",
        ]
    });

    assert.equal(component.isSingleRoot, true);
});

test("Multi-root fragment", () => {

    let component = compileTemplate({
        $: [
            "apples",
            "pears",
            "bananas",
        ]
    });

    assert.equal(component.isSingleRoot, false);
});
