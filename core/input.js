export function input(opts)
{
    let el;
    let ctx;
    let inputEvent = opts.event ?? "input";
    let getValue;
    let setValue;
    let castToInput;
    let castFromInput;
    let inputProp;
    let parseValue = opts.parse ?? (x => x);
    let formatValue = opts.format ?? (x => x);

    if (typeof(opts) === 'string')
        opts = { prop: opts }

    if (opts.get && opts.set)
    {
        getValue = () => opts.get(ctx.model, ctx);
        setValue = (value) => opts.set(ctx.model, value, ctx);
    }
    else if (typeof(opts.prop) === 'string')
    {
        // Resolve base object
        let baseObj;
        if (opts.target instanceof Function)
            baseObj = () => opts.target(ctx.model, ctx);
        else if (opts.target)
            baseObj = () => opts.target;
        else
            baseObj = () => ctx.model;

        // String can be a simple.dotted.property
        let props = opts.prop.split('.');
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
        opts.on_change?.(ctx.model, ev);
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

