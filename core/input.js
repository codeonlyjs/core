/**
 * Options for controlling input bindings
 * @typedef {object} InputOptions
 * @property {string} event The name of the event (usually "change" or "input") to trigger the input binding
 * @property {string} [prop] The name of the property on the target object
 * @property {string | (model: object) => string} [target] The target object providing the binding property
 * @property {(value:any) => string} [format] Format the property value into a string for display
 * @property {(value:string) => any} [parse] Parse a display string into a property value
 * @property {(model:any, context:any) => any} [get] Get the value of the property
 * @property {(model:any, value: any, context:any) => void} [set] Set the value of the property
 * @property {(model:any, event: Event) => any} [on_change] A callback to be invoked when the property value is changed by the user
 */

/** Declares additional settings for input bindings
 * @param {InputOptions} options Additional input options
 * @returns {object}
 */

export function input(options)
{
    let el;
    let ctx;
    let inputEvent = options.event ?? "input";
    let getValue;
    let setValue;
    let castToInput;
    let castFromInput;
    let inputProp;
    let parseValue = options.parse ?? (x => x);
    let formatValue = options.format ?? (x => x);

    if (typeof(options) === 'string')
        options = { prop: options }

    if (options.get && options.set)
    {
        getValue = () => options.get(ctx.model, ctx);
        setValue = (value) => options.set(ctx.model, value, ctx);
    }
    else if (typeof(options.prop) === 'string')
    {
        // Resolve base object
        let baseObj;
        if (options.target instanceof Function)
            baseObj = () => options.target(ctx.model, ctx);
        else if (options.target)
            baseObj = () => options.target;
        else
            baseObj = () => ctx.model;

        // String can be a simple.dotted.property
        let props = options.prop.split('.');
        let prop = props.pop()
        function getObj()
        {
            // Expand .dotted.sub.props
            let o = baseObj();
            for (let i=0; i<props.length; i++)
                o = o[props[i]];
            return o;
        }
        getValue = () => getObj()[prop];
        setValue = (value) => getObj()[prop] = value;
    }
    else
    {
        throw new Error("Invalid input binding");
    }

    function onInput(ev)
    {
        let v = castFromInput(el[inputProp]);
        if (v !== undefined)
            v = parseValue(v);
        if (v !== undefined)
            setValue(v);
        options.on_change?.(ctx.model, ev);
    }

    function update()
    {
        let v = formatValue(getValue())
        if (v !== undefined)
            v = castToInput(v);
        if (v !== undefined)
            el[inputProp] = v;
    }

    function create(element, context)
    {
        el = element;
        ctx = context;

        inputProp = "value";
        castToInput = v => v;
        castFromInput = v => v;
        
        if (el.tagName == "INPUT")
        {   
            let inputType = el.getAttribute("type").toLowerCase();
            if (inputType == 'checkbox')
            {
                inputProp = 'checked';
                castFromInput = v => !!v;
            }
            else if (inputType == 'radio')
            {
                inputProp = 'checked';
                castFromInput = v => v ? el.getAttribute('value') : undefined;
                castToInput = v => el.getAttribute('value') == v ? true : undefined;
            }
        }
        else if (el.tagName == "SELECT" && el.hasAttribute("multiple"))
        {
            inputProp = "selectedOptions";
            castFromInput = v => Array.from(v).map(x => x.value);
            castToInput = v => {
                Array.from(el.options).forEach(o => {
                    o.selected = v.indexOf(o.value) >= 0;
                });
                return undefined;
            }
        }

        el.addEventListener(inputEvent, onInput);
    }

    function destroy()
    {
        el.removeEventListener(inputEvent, onInput);
        el = null;
    }

    return {
        create,
        update,
        destroy,
    }
}

