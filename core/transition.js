import { TransitionCss } from "./TransitionCss.js";    


/** 
 * @typedef {object} TransitionHandler
 * @property {Function} enterNodes
 * @property {Function} leaveNodes
 * @property {Function} onWillEntry
 * @property {Function} onWillLeave
 * @property {Function} start
 * @property {Function} finish
 */

/** Declares addition settings transition directives
 * @param {object} options
 * @param {(model:object, context:object) => any} options.value The value callback that triggers the animation when it changes
 * @param {string} [options.mode] Transition order - concurrent, enter-leave or leave-enter
 * @param {name} [options.name] Transition name - used as prefix to CSS class names, default = "tx"
 * @param {object} [options.classNames] A map of class name mappings
 * @param {number} [options.duration] The duration of the animation in milliseconds
 * @param {boolean} [options.subtree] Whether to monitor the element's sub-trees for animations
 * @returns {TransitionHandler}
 */
export function transition(options)
{
    // Merge all args
    let optionsFinal = {};
    for (let i=0; i<arguments.length; i++)
    {
        let a = arguments[i];
        if (a instanceof Function)
            optionsFinal.value = a;
        else if (typeof(a) === 'string')
            optionsFinal.name = a;
        else if (typeof(a) === 'object')
            Object.assign(optionsFinal, a);
        else
            throw new Error("Invalid argument to transition");
    }

    options = optionsFinal;

    // Create wrapper function
    let fnValue = function value()
    {
        return options.value(...arguments);
    }

    // Attach transition constructor
    fnValue.withTransition = function(context)
    {
        // Construct the transition
        if (options.type)
            return new options.type(options, context);
        else
            return TransitionCss(options, context);
    }

    // Return value
    return fnValue;
}