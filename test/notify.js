import { test } from "node:test";
import { strict as assert } from "node:assert";
import { Notify } from "../core/Notify.js";

test("update manager", () => {

    // Create an update manager
    let notify = new Notify();

    // A source object to fire updates from
    let so = {};

    // Handler to count callbacks
    let count = 0;
    function handler(o)
    {
        assert.equal(so, o);
        count++;
    }

    // Add listener
    notify.addListener(so, handler);

    // Fire on two objects, check only heard from one
    notify.fire(so);
    notify.fire({});
    assert.equal(count, 1);

    // Add a second listener, ensure fires twice
    count = 0;
    notify.addListener(so, handler);
    notify.fire(so);
    assert.equal(count, 2);

    // Remove second listener, ensure fires once
    count = 0;
    notify.removeListener(so, handler);
    notify.fire(so);
    assert.equal(count, 1);

    // Remove last listener, ensure not fired
    count = 0;
    notify.removeListener(so, handler);
    notify.fire(so);
    assert.equal(count, 0);

    function handler2(o, p1, p2)
    {
        assert.equal(o, so);
        assert.equal(p1, "1");
        assert.equal(p2, "2");
        count++;
    }

    count = 0;
    notify.addListener(so, handler2);

});


test("named events", () => {

    // Create an update manager
    let notify = new Notify();

    // A source object to fire updates from
    let so = "Oi";

    // Handler to count callbacks
    let count = 0;
    function handler(o)
    {
        assert.equal(so, o);
        count++;
    }

    // Add listener
    notify.addListener(so, handler);

    // Fire on two objects, check only heard from one
    notify.fire(so);
    notify.fire({});
    assert.equal(count, 1);

    // Add a second listener, ensure fires twice
    count = 0;
    notify.addListener(so, handler);
    notify.fire(so);
    assert.equal(count, 2);

    // Remove second listener, ensure fires once
    count = 0;
    notify.removeListener(so, handler);
    notify.fire(so);
    assert.equal(count, 1);

    // Remove last listener, ensure not fired
    count = 0;
    notify.removeListener(so, handler);
    notify.fire(so);
    assert.equal(count, 0);

    function handler2(o, p1, p2)
    {
        assert.equal(o, so);
        assert.equal(p1, "1");
        assert.equal(p2, "2");
        count++;
    }

    count = 0;
    notify.addListener(so, handler2);

});