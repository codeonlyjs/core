let frameCallbacks = [];
let needSort = false;

/**
 * Invokes a callback on the next update cycle.
 * 
 * @param {() => void} callback The callback to be invoked.
 * @param {Number} [order] The priority of the callback in related to others (lowest first, default 0).
 * @returns {void}
 */
export function nextFrame(callback, order)
{
    if (!callback)
        return;

    // Resolve order and track if sort needed
    order = order ?? 0;
    if (order != 0)
        needSort = true;

    // Add callback
    frameCallbacks.push({
        callback, 
        order
    });

    // If it's the first one, request animation callback
    if (frameCallbacks.length == 1)
    {
        coenv.window.requestAnimationFrame(function() {

            // Capture pending callbacks
            let pending = frameCallbacks;
            if (needSort)
            {
                // Reverse order because we iterate in reverse below
                pending.sort((a,b) => b.order - a.order);   
                needSort = false;
            }
            
            // Reset 
            frameCallbacks = [];

            // Dispatch
            for (let i=pending.length - 1; i>=0; i--)
                pending[i].callback();

        });
    }
}

/** 
 * Invokes a callback after all other nextFrame callbacks have been invoked, or
 * immediately if there are no pending nextFrame callbacks.
 * @param {() => void} callback The callback to invoke
 * @returns {void}
 */
export function postNextFrame(callback)
{
    if (frameCallbacks.length == 0)
        callback();
    else
        nextFrame(callback, Number.MAX_SAFE_INTEGER);
}

/** 
 * Check if there are any pending nextFrame callbacks
 * @returns {boolean}
 */
export function anyPendingFrames()
{
    return frameCallbacks.length != 0;
}