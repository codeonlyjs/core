import { html } from "./HtmlString.js";
import { htmlEncode } from "./htmlEncode.js";

class TemplateBuilder
{
    constructor(type)
    {
        this.$node = { type }
    }

    append(...items)
    {
        items = items.flat(1000).map(x => x.$node ?? x);
        if (this.$node.$)
            this.$node.$.push(...items)
        else
            this.$node.$ = [...items];
    }

    attr(name, value)
    {
        if ((name == "class" || name == "style") && arguments.length > 2)
        {
            name = `${name}_${value}`;
            value = arguments[2];
        }
        else if (name == "on" && arguments.length > 2)
        {
            name = `on_${value}`;
            value = arguments[2];
        }
        else if (name == "type")
            name = "attr_type";

        if (this.$node[name] !== undefined)
            throw new Error(`duplicate attribute: ${name}`);
        this.$node[name] = value;
    }
}

// This is the proxy wrapper for the TemplateBuilder's append
// method.  If a property is accessed on the function itself,
// then return a function to set an attribute with the property's
// name.
let AppendProxy = 
{
    get: function(object, key)
    {
        if (key != 'bind' && key != 'name')
        {
            // Check if underlying property
            let underlying = Reflect.get(object, key);
            if (underlying !== undefined)
                return underlying;
        }

        // Return a function to set an attribute
        return (...args) => {

            // Get the builder
            let tb = Reflect.get(object, "$tb");

            // Set attribute
            tb.attr(key, ...args);

            // Return the outer proxy for chaining
            return Reflect.get(object, "$proxy");;
        }
    }
}

// This is the proxy for the roo
let RootProxy = 
{
    get: function(object, key)
    {
        let underlying = Reflect.get(object, key);
        if (underlying !== undefined)
            return underlying;

        return constructTemplateBuilder(key);
    }
}

function constructTemplateBuilder(type)
{
    // Create  template builder
    let tb = new TemplateBuilder(type);

    // Wrap the append function in a proxy that
    // can create attributes
    let fnAppendProxy;
    let fnAppend = function () { 
        tb.append(...arguments); 
        return fnAppendProxy; 
    }
    fnAppend.$tb = tb;
    fnAppend.$node = tb.$node;
    fnAppendProxy = new Proxy(fnAppend, AppendProxy);
    fnAppend.$proxy = fnAppendProxy;
    return fnAppendProxy;
}

constructTemplateBuilder.html = html;
constructTemplateBuilder.encode = htmlEncode;

// Export the proxied template builder

/**
 * Entry point into the fluent template builder API
 * 
 * The API to the fluent object is dynamic and can't be documented
 * as a typical API interface.
 * 
 * See the (Fluent Templates](templateFluent) for how to use this API.
 * 
 * @type {any}
 */
export let $ = new Proxy(constructTemplateBuilder,  RootProxy);

