import { TransitionCss } from "./TransitionCss.js";    

export function transition()
{
    // Merge all args
    let options = {};
    for (let i=0; i<arguments.length; i++)
    {
        let a = arguments[i];
        if (a instanceof Function)
            options.value = a;
        else if (typeof(a) === 'string')
            options.name = a;
        else if (typeof(a) === 'object')
            Object.assign(options, a);
        else
            throw new Error("Invalid argument to transition");
    }

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