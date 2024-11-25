import { test } from "node:test";
import { strict as assert } from "node:assert";
import { HtmlInjector } from "../ssr/HtmlInjector.js";


test("No-op", () => {

    let inj = new HtmlInjector(`<div></div>`);

    assert.equal(`<div></div>`, inj.inject({}));
});

test("Simple", () => {

    let inj = new HtmlInjector(`<div></div>`);

    assert.equal(
        inj.inject({ "div": [ "inj" ]}),
        `<div>inj</div>`
        );
});

test("Multiple at same position", () => {

    let inj = new HtmlInjector(`<div></div>`);

    assert.equal(
        inj.inject({ "div": [ "foo", "bar", "baz" ]}),
        `<div>foobarbaz</div>`
        );
});

test("Multiple in order", () => {

    let inj = new HtmlInjector(`<div><div id="a"></div><div id="b"></div></div>`);

    assert.equal(
        inj.inject({ 
            "#a": [ "A" ],
            "#b": [ "B" ],
        }),
        `<div><div id="a">A</div><div id="b">B</div></div>`
        );
});

test("Multiple out of order", () => {

    let inj = new HtmlInjector(`<div><div id="a"></div><div id="b"></div></div>`);

    assert.equal(
        inj.inject({ 
            "#b": [ "B" ],
            "#a": [ "A" ],
        }),
        `<div><div id="a">A</div><div id="b">B</div></div>`
        );
});

