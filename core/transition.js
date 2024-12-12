import { TransitionCss } from "./TransitionCss.js";    


/**
 * Options for controlling behaviour of transitions.
 * 
 * See [Transition Options](templateTransitions#transition-options) for more information.
 * 
 * @typedef TransitionOptions
 * @property {(model:object, context:object) => any} options.value The value callback that triggers the animation when it changes
 * @property {string} [options.mode] Transition order - "concurrent", "enter-leave" or "leave-enter"
 * @property {name} [options.name] Transition name - used as prefix to CSS class names, default = "tx"
 * @property {object} [options.classNames] A map of class name mappings.
 * @property {number} [options.duration] The duration of the animation in milliseconds.
 * @property {boolean} [options.subtree] Whether to monitor the element's sub-trees for animations.
 */

/** Declares addition settings transition directives
 * @param {{TransitionOptions | string | Function}[]} options
 */
export function transition(...options)
{
    // Merge all args
    let optionsFinal = {};
    for (let i=0; i<options; i++)
    {
        let a = options[i];
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


/** 
 * Implemented by objects that handle transitions
 * @typedef {object} TransitionHandler
 * @property {(nodes: Node[]) => void} enterNodes Registers the nodes that will be transitioned in
 * @property {(nodes: Node[]) => void} leaveNodes Registers the nodes that will be transitioned out
 * @property {() => void} onWillEnter Registers a callback to be invoked when entry nodes should be added
 * @property {() => void} onDidLeave Registers callback to be invoked when leaving nodes can be removed
 * @property {() => void} start Instructs the TransitionHandler to start the transition
 * @property {() => void} finish Instructs the TranstitionHandler to cancel any pending transition and complete all callbacks.
 */

