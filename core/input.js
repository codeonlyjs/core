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

    if (opts.get && opts.set)
    {
        getValue = () => opts.get(ctx.model, ctx);
        setValue = (value) => opts.set(ctx.model, value, ctx);
    }
    else if (typeof(opts) === 'string')
    {
        getValue = () => ctx.model[opts];
        setValue = (value) => ctx.model[opts] = value;
    }
    else if (opts && 
             opts.target instanceof Function && 
             typeof(opts.prop) === 'string')
    {
        getValue = () => opts.target(ctx.model, ctx)[opts.prop];
        setValue = (value) => opts.target(ctx.model, ctx)[opts.prop] = value;
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

