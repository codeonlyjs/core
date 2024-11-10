import { TransitionCss } from "./TransitionCss.js";    

export function transition(value, cssClassPrefix)
{
    // Convert arg to options
    let options;
    if (value instanceof Function)
    {
        options = {
            value,
            cssClassPrefix,
        }
    }
    else
    {
        options = value;
    }

    // Create wrapper function
    let fnValue = function value()
    {
        return options.value(...arguments);
    }

    // Attach transition constructor
    fnValue.withTransition = function(context)
    {
        if (options.type)
            return new options.type(options, context);
        else
            return TransitionCss(options, context);
    }

    // Return value
    return fnValue;
}