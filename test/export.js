import { test } from "node:test";
import { strict as assert } from "node:assert";
import "./mockdom.js";
import { Template } from "../codeonly.js";


test("Root Export", () => {

    let r = Template.compile({
        type: "DIV",
        export: "mydiv",
    })();

    assert.equal(r.rootNode, r.mydiv);
});

test("Non-root Export", () => {

    let r = Template.compile({
        type: "DIV",
        $:
        [
            {
                type: "P",
                export: "myPara",
                text: "foo",
            }
        ]
    })();

    assert.equal(r.myPara.textContent, "foo");
});

test("Export conditional", () => {

    let val = true;
    let r = Template.compile({
        type: "DIV",
        $:
        [
            {
                if: () => val,
                type: "P",
                export: "myPara",
                text: "foo",
            }
        ]
    })();

    assert.equal(r.myPara.textContent, "foo");

    val = false;
    r.update();
    assert.equal(r.myPara, null);

    val = true;
    r.update();
    assert.equal(r.myPara.textContent, "foo");
});

