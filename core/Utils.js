/** Convert a camelCaseName to a dashed-name
 * @internal
 * @param {string} name The name to convert
 * @returns {string}
 */
export function camel_to_dash(name)
{
    return name.replace(/[A-Z]/g, x => `-${x.toLowerCase()}`);
}

/** Check if a function is a constructor 
 * @internal
 * @param {Function} fn The function to check
 * @returns {boolean}
 */
export function is_constructor(fn) 
{ 
    return fn instanceof Function && !!fn.prototype && !!fn.prototype.constructor; 
}

let rxIdentifier = /^[a-zA-Z$][a-zA-Z0-9_$]*$/;

/** Helper to create member accessor in generated code
 * 
 * Returns either ".name" or "[name]" depending if name is a valid
 * javascript identifier
 * 
 * @internal
 * @param {string} name Name of the member to be accessed
 * @returns {string}
 */
export function member(name)
{
    if (name.match(rxIdentifier))
        return `.${name}`;
    else
        return `[${JSON.stringify(name)}]`;
}

/** Invokes a callback when a target object (environment or component) has finished loading
 * @internal
 * @param {object} target The target to check
 * @param {Function} callback The callback to invoke when load finished (or immediately if not currently loading
 * @returns {void}
 */
export function whenLoaded(target, callback)
{
    if (target.loading)
        target.addEventListener("loaded", callback, { once :true });
    else
        callback();
}

/** Returns a promise that resolves when a target objects has finished loading
 * @param {object} target The target to check
 * @returns {Promise<void>}
 */
export function untilLoaded(target)
{
    return new Promise((res) => whenLoaded(target, res));
}