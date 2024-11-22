import { test } from "node:test";
import { strict as assert } from "node:assert";

import "./mockdom.js";
import { getEnv } from "../core/Environment.js";

test("sessionStorage", () => {

    getEnv().reset();
    assert.equal(getEnv().window.sessionStorage.getItem("x"), null);

    getEnv().window.sessionStorage.setItem("x", "y");
    assert.equal(getEnv().window.sessionStorage.getItem("x"), "y");

});

test("history initial state", () => {
    getEnv().reset();
    assert.equal(getEnv().window.location.href, "http://toptensoftware.com/");
    assert.equal(getEnv().window.history.state, null);
});

test("history replace state", async () => {
    getEnv().reset();

    let state = {x:1};
    getEnv().window.history.replaceState(state, null);

    assert.equal(getEnv().window.location.href, "http://toptensoftware.com/");
    assert.deepEqual(getEnv().window.history.state, state);
});

test("history replace url", async () => {
    getEnv().reset();

    getEnv().window.history.replaceState(null, "url");

    assert.equal(getEnv().window.location.href, "http://toptensoftware.com/url");
    assert.deepEqual(getEnv().window.history.state, null);
});

test("history push state", async () => {
    getEnv().reset();

    let state = { x: 1 };
    getEnv().window.history.pushState(state, "");

    assert.equal(getEnv().window.location.href, "http://toptensoftware.com/");
    assert.deepEqual(getEnv().window.history.state, state);
});

test("push url", async () => {
    getEnv().reset();

    getEnv().window.history.pushState(null, "", "url");

    assert.equal(getEnv().window.location.href, "http://toptensoftware.com/url");
    assert.deepEqual(getEnv().window.history.state, null);
});

test("popstate", async () => {
    getEnv().reset();

    // Setup listener
    let pops = [];
    getEnv().window.addEventListener("popstate", ev => {
        pops.push({
            state: ev.state,
            location: getEnv().window.location,
        });
    });

    // Push 2 states
    let state1 = { x: 1 };
    getEnv().window.history.pushState(state1, "", "url1");
    let state2 = { x: 2 };
    getEnv().window.history.pushState(state2, "", "url2");

    // Go back once
    getEnv().window.history.go(-1);
    await getEnv().window.waitAnimationFrames();
    assert.equal(getEnv().window.location.href, "http://toptensoftware.com/url1");
    assert.deepEqual(getEnv().window.history.state, state1);
    assert.equal(pops.length, 1);
    assert.equal(pops[0].state, state1);
    assert.equal(pops[0].location, getEnv().window.location);

    // Go back a second time
    getEnv().window.history.go(-1);
    await getEnv().window.waitAnimationFrames();
    assert.equal(pops.length, 2);
    assert.equal(getEnv().window.location.href, "http://toptensoftware.com/");
    assert.deepEqual(getEnv().window.history.state, null);
    assert.equal(pops[1].state, null);
    assert.equal(pops[1].location, getEnv().window.location);

    // Go forward once
    getEnv().window.history.go(1);
    await getEnv().window.waitAnimationFrames();
    assert.equal(pops.length, 3);
    assert.equal(getEnv().window.location.href, "http://toptensoftware.com/url1");
    assert.deepEqual(getEnv().window.history.state, state1);
    assert.equal(pops[2].state, state1);
    assert.equal(pops[2].location, getEnv().window.location);

    // Go forward again
    getEnv().window.history.go(1);
    await getEnv().window.waitAnimationFrames();
    assert.equal(pops.length, 4);
    assert.equal(getEnv().window.location.href, "http://toptensoftware.com/url2");
    assert.deepEqual(getEnv().window.history.state, state2);
    assert.equal(pops[3].state, state2);
    assert.equal(pops[3].location, getEnv().window.location);

    // Go back twice
    getEnv().window.history.go(-2);
    await getEnv().window.waitAnimationFrames();
    assert.equal(getEnv().window.location.href, "http://toptensoftware.com/");
    assert.deepEqual(getEnv().window.history.state, null);
    assert.equal(pops.length, 5);
    assert.equal(pops[4].state, null);
    assert.equal(pops[4].location, getEnv().window.location);
});

test("forward hash nav", async () => {
    getEnv().reset();

    let pops = [];
    getEnv().window.addEventListener("popstate", ev => {
        pops.push({
            state: ev.state,
            location: getEnv().window.location,
        });
    });

    getEnv().window.history.hashnav("foo");

    assert.equal(getEnv().window.location.href, "http://toptensoftware.com/#foo");
    assert.deepEqual(getEnv().window.history.state, null);
    assert.equal(pops.length, 1);
    assert.equal(pops[0].state, null);
    assert.equal(pops[0].location, getEnv().window.location);



});
