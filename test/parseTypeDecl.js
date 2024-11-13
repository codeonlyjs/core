import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseTypeDecl } from "../core/parseTypeDecl.js";

test("typename", () => {

    let r =parseTypeDecl("div");

    assert.equal(r.type, "div");

});

test("typename id", () => {

    let r =parseTypeDecl("div #myid");

    assert.equal(r.type, "div");
    assert.equal(r.id, "myid");

});

test("typename class", () => {

    let r =parseTypeDecl("div .class1 .class2");

    assert.equal(r.type, "div");
    assert.equal(r.class, "class1 class2");

});

test("no value attribute", () => {

    let r =parseTypeDecl("div foo");

    assert.equal(r.type, "div");
    assert.equal(r.foo, "foo");

});

test("unquoted attribute", () => {

    let r =parseTypeDecl("div foo=bar");

    assert.equal(r.type, "div");
    assert.equal(r.foo, "bar");

});

test("single quoted attribute", () => {

    let r =parseTypeDecl("div foo='bar'");

    assert.equal(r.type, "div");
    assert.equal(r.foo, "bar");

});


test("double quoted attribute", () => {

    let r =parseTypeDecl("div foo=\"bar\"");

    assert.equal(r.type, "div");
    assert.equal(r.foo, "bar");

});


test("everything", () => {

    let r = parseTypeDecl("div #myid .class1 .class2 foo=\"bar\" baz");

    assert.equal(r.type, "div");
    assert.equal(r.id, "myid");
    assert.equal(r.class, "class1 class2");
    assert.equal(r.foo, "bar");
    assert.equal(r.baz, "baz");

});

test("without spaces", () => {

    let r = parseTypeDecl("div#myid.class1.class2 foo=\"bar\" baz");

    assert.equal(r.type, "div");
    assert.equal(r.id, "myid");
    assert.equal(r.class, "class1 class2");
    assert.equal(r.foo, "bar");
    assert.equal(r.baz, "baz");

});

test("input type", () => {

    let r = parseTypeDecl("input type=password");

    assert.equal(r.type, "input");
    assert.equal(r.attr_type, "password");

});


test("event handler", () => {

    let r = parseTypeDecl("input on_click=onInputClick");

    assert.equal(r.type, "input");
    assert(r.on_click instanceof Function);

    // Fire a fake event and check received
    let received;
    let comp = {
        onInputClick: (ev) => {
            received = ev;
        }
    }
    r.on_click(comp, "signal");
    assert.equal(received, "signal");
});