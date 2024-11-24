import { strict as assert } from "node:assert";
import { tokenizer } from "../minidom/tokenizer.js";
import { test } from "node:test";

test("comment", () => {
    let tokens = tokenizer("<!-- foo bar -->");
    assert.equal(tokens().comment, " foo bar " );
    assert.equal(tokens().token, '\0');
});

test("text", () => {
    let tokens = tokenizer(" foo bar ");
    assert.equal(tokens().text, " foo bar ");
    assert.equal(tokens().token, '\0' );
});

test("self closing tag", () => {
    let tokens = tokenizer("<tag />");
    assert.equal(tokens().token, '<');
    assert.equal(tokens().identifier, 'tag' );
    assert.equal(tokens().token, '/>');
    assert.equal(tokens().token, '\0' );
});

test("opening tag", () => {
    let tokens = tokenizer("<tag>");
    assert.equal(tokens().token, '<');
    assert.equal(tokens().identifier, 'tag') ;
    assert.equal(tokens().token, '>');
    assert.equal(tokens().token, '\0' );
});

test("closing tag", () => {
    let tokens = tokenizer("</tag>");
    assert.equal(tokens().token, '</');
    assert.equal(tokens().identifier, 'tag' );
    assert.equal(tokens().token, '>');
    assert.equal(tokens().token, '\0' );
});

test("boolean attribute", () => {
    let tokens = tokenizer("<tag attr>");
    assert.equal(tokens().token, '<');
    assert.equal(tokens().identifier, 'tag' );
    assert.equal(tokens().identifier, 'attr' );
    assert.equal(tokens().token, '>');
    assert.equal(tokens().token, '\0' );
});

test("attribute with value", () => {
    let tokens = tokenizer("<tag attr = value >");
    assert.equal(tokens().token, '<');
    assert.equal(tokens().identifier, 'tag');
    assert.equal(tokens().identifier, 'attr');
    assert.equal(tokens().token, '=');
    assert.equal(tokens().identifier, 'value');
    assert.equal(tokens().token, '>');
    assert.equal(tokens().token, '\0' );
});

test("attribute with single quoted value", () => {
    let tokens = tokenizer("<tag attr = 'value' >");
    assert.equal(tokens().token, '<');
    assert.equal(tokens().identifier, 'tag');
    assert.equal(tokens().identifier, 'attr');
    assert.equal(tokens().token, '=');
    assert.equal(tokens().string, 'value');
    assert.equal(tokens().token, '>');
    assert.equal(tokens().token, '\0' );
});

test("attribute with double quoted value", () => {
    let tokens = tokenizer("<tag attr = \"value\" >");
    assert.equal(tokens().token, '<');
    assert.equal(tokens().identifier, 'tag');
    assert.equal(tokens().identifier, 'attr');
    assert.equal(tokens().token, '=');
    assert.equal(tokens().string, 'value');
    assert.equal(tokens().token, '>');
    assert.equal(tokens().token, '\0' );
});

test("identifier with dash", () => {
    let tokens = tokenizer("<my-tag>");
    assert.equal(tokens().token, '<');
    assert.equal(tokens().identifier, 'my-tag');
    assert.equal(tokens().token, '>');
    assert.equal(tokens().token, '\0' );
});

test("unquoted attribute value", () => {
    let tokens = tokenizer("<tag attr=some-value-23>");
    assert.equal(tokens().token, '<');
    assert.equal(tokens().identifier, 'tag');
    assert.equal(tokens().identifier, 'attr');
    assert.equal(tokens().token, '=' );
    assert.equal(tokens(true).string, 'some-value-23');
    assert.equal(tokens().token, '>');
    assert.equal(tokens().token, '\0' );
});

