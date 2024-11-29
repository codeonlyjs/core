import { test } from "node:test";
import { strict as assert } from "node:assert";

import "./mockdom.js";

test("sessionStorage", () => {

    coenv.reset();
    assert.equal(coenv.window.sessionStorage.getItem("x"), null);

    coenv.window.sessionStorage.setItem("x", "y");
    assert.equal(coenv.window.sessionStorage.getItem("x"), "y");

});

test("history initial state", () => {
    coenv.reset();
    assert.equal(coenv.window.location.href, "http://toptensoftware.com/");
    assert.equal(coenv.window.history.state, null);
});

test("history replace state", async () => {
    coenv.reset();

    let state = {x:1};
    coenv.window.history.replaceState(state, null);

    assert.equal(coenv.window.location.href, "http://toptensoftware.com/");
    assert.deepEqual(coenv.window.history.state, state);
});

test("history replace url", async () => {
    coenv.reset();

    coenv.window.history.replaceState(null, "url");

    assert.equal(coenv.window.location.href, "http://toptensoftware.com/url");
    assert.deepEqual(coenv.window.history.state, null);
});

test("history push state", async () => {
    coenv.reset();

    let state = { x: 1 };
    coenv.window.history.pushState(state, "");

    assert.equal(coenv.window.location.href, "http://toptensoftware.com/");
    assert.deepEqual(coenv.window.history.state, state);
});

test("push url", async () => {
    coenv.reset();

    coenv.window.history.pushState(null, "", "url");

    assert.equal(coenv.window.location.href, "http://toptensoftware.com/url");
    assert.deepEqual(coenv.window.history.state, null);
});

test("popstate", async () => {
    coenv.reset();

    // Setup listener
    let pops = [];
    coenv.window.addEventListener("popstate", ev => {
        pops.push({
            state: ev.state,
            location: coenv.window.location,
        });
    });

    // Push 2 states
    let state1 = { x: 1 };
    coenv.window.history.pushState(state1, "", "url1");
    let state2 = { x: 2 };
    coenv.window.history.pushState(state2, "", "url2");

    // Go back once
    coenv.window.history.go(-1);
    await coenv.window.waitAnimationFrames();
    assert.equal(coenv.window.location.href, "http://toptensoftware.com/url1");
    assert.deepEqual(coenv.window.history.state, state1);
    assert.equal(pops.length, 1);
    assert.equal(pops[0].state, state1);
    assert.equal(pops[0].location, coenv.window.location);

    // Go back a second time
    coenv.window.history.go(-1);
    await coenv.window.waitAnimationFrames();
    assert.equal(pops.length, 2);
    assert.equal(coenv.window.location.href, "http://toptensoftware.com/");
    assert.deepEqual(coenv.window.history.state, null);
    assert.equal(pops[1].state, null);
    assert.equal(pops[1].location, coenv.window.location);

    // Go forward once
    coenv.window.history.go(1);
    await coenv.window.waitAnimationFrames();
    assert.equal(pops.length, 3);
    assert.equal(coenv.window.location.href, "http://toptensoftware.com/url1");
    assert.deepEqual(coenv.window.history.state, state1);
    assert.equal(pops[2].state, state1);
    assert.equal(pops[2].location, coenv.window.location);

    // Go forward again
    coenv.window.history.go(1);
    await coenv.window.waitAnimationFrames();
    assert.equal(pops.length, 4);
    assert.equal(coenv.window.location.href, "http://toptensoftware.com/url2");
    assert.deepEqual(coenv.window.history.state, state2);
    assert.equal(pops[3].state, state2);
    assert.equal(pops[3].location, coenv.window.location);

    // Go back twice
    coenv.window.history.go(-2);
    await coenv.window.waitAnimationFrames();
    assert.equal(coenv.window.location.href, "http://toptensoftware.com/");
    assert.deepEqual(coenv.window.history.state, null);
    assert.equal(pops.length, 5);
    assert.equal(pops[4].state, null);
    assert.equal(pops[4].location, coenv.window.location);
});

test("forward hash nav", async () => {
    coenv.reset();

    let pops = [];
    coenv.window.addEventListener("popstate", ev => {
        pops.push({
            state: ev.state,
            location: coenv.window.location,
        });
    });

    coenv.window.history.hashnav("foo");

    assert.equal(coenv.window.location.href, "http://toptensoftware.com/#foo");
    assert.deepEqual(coenv.window.history.state, null);
    assert.equal(pops.length, 1);
    assert.equal(pops[0].state, null);
    assert.equal(pops[0].location, coenv.window.location);



});
