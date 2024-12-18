import { test } from "node:test";
import { strict as assert } from "node:assert";
import "./mockdom.js";
import { compileTemplate } from "../core/TemplateCompiler.js";



test("Root Element", () => {

    let model = {
        get mydiv() { return this._mydiv; },
        set mydiv(value) { this._mydiv = value; },
    };

    let r = compileTemplate({
        type: "DIV",
        bind: "mydiv",
    })({ model });

    assert.equal(r.rootNode, model.mydiv);
});

test("Non-root Element", () => {

    let model = {};

    let r = compileTemplate({
        type: "DIV",
        $:
        [
            {
                type: "P",
                bind: "myPara",
                text: "foo",
            }
        ]
    })({ model });

    assert.equal(model.myPara.textContent, "foo");
});

test("Conditionally Included Element", () => {

    let model = {
        get myPara() { return this._p; },
        set myPara(value) { this._p = value; },
    };

    let val = true;
    let r = compileTemplate({
        type: "DIV",
        $:
        [
            {
                if: () => val,
                type: "P",
                bind: "myPara",
                text: "foo",
            }
        ]
    })({ model });

    assert.equal(model.myPara.textContent, "foo");
    assert.equal(model.myPara, model._p);

    val = false;
    r.update();
    assert.equal(model.myPara, null);
    assert.equal(model.myPara, model._p);

    val = true;
    r.update();
    assert.equal(model.myPara.textContent, "foo");
    assert.equal(model.myPara, model._p);
});



test("Simple Rebind", () => {

    // First bind to this model
    let model = {};
    let ctx = { model };

    let r = compileTemplate({
        type: "DIV",
        $:
        [
            {
                type: "P",
                bind: "myPara",
                text: "foo",
            }
        ]
    })(ctx);

    // check bound
    assert.equal(model.myPara.textContent, "foo");

    // Create a new model, store it in the context and rebind
    let model2 = {};
    ctx.model = model2;
    r.rebind();

    assert.equal(model.myPara, null);
    assert.equal(model2.myPara.textContent, "foo");
});


test("Conditional Rebind", () => {

    // First bind to this model
    let model = {};
    let ctx = { model };

    let val = true;

    let r = compileTemplate({
        type: "DIV",
        $:
        [
            {
                if: () => val,
                type: "P",
                bind: "myPara",
                text: "foo",
            }
        ]
    })(ctx);

    // check bound
    assert.equal(model.myPara.textContent, "foo");

    // Turn off with conditional
    val = false;
    r.update();
    assert.equal(model.myPara, null);

    val = true;
    r.update();
    assert.equal(model.myPara.textContent, "foo");

    // Create a new model, store it in the context and rebind
    let model2 = {};
    ctx.model = model2;
    r.rebind();

    // Should now be bound to the new model
    assert.equal(model.myPara, null);
    assert.equal(model2.myPara.textContent, "foo");

    // Turn off with condition and check nulled
    val = false;
    r.update();
    assert.equal(model2.myPara, null);

});

