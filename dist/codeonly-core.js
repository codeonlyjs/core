/** Convert a camelCaseName to a dashed-name
 * @internal
 * @param {string} name The name to convert
 * @returns {string}
 */
function camel_to_dash(name)
{
    return name.replace(/[A-Z]/g, x => `-${x.toLowerCase()}`);
}

/** Check if a function is a constructor 
 * @internal
 * @param {Function} fn The function to check
 * @returns {boolean}
 */
function is_constructor(fn) 
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
function member(name)
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
function whenLoaded(target, callback)
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
function untilLoaded(target)
{
    return new Promise((res) => whenLoaded(target, res));
}

/** The base class for all environment types 
 * @extends {EventTarget}
 */
class Environment extends EventTarget
{
    /** Constructs a new Environment */
    constructor()
    {
        super();

        /**
         * True when running in browser environment
         */
        this.browser = false;

        /**
         * True when running in a rendering environment
         */
        this.ssr = false;
    }

    #loading = 0;

    /** Notifies the environment that an async load operation is starting
     * @returns {void}
     */
    enterLoading()
    {
        this.#loading++;
        if (this.#loading == 1)
            this.dispatchEvent(new Event("loading"));
    }

    /** Notifies the environment that an async load operation has finished
     * @returns {void}
     */
    leaveLoading()
    {
        this.#loading--;
        if (this.#loading == 0)
            this.dispatchEvent(new Event("loaded"));
    }

    /** Indicates if there are async data load operations in progress
     * @type {boolean}
     */
    get loading()
    {
        return this.#loading != 0;
    }

    /** Runs an async data load operation
     * @param {() => Promise<any>} callback A callback that performs the data load
     * @returns {Promise<any>}
     */
    async load(callback)
    {
        this.enterLoading();
        try
        {
            return await callback();
        }
        finally
        {
            this.leaveLoading();
        }
    }

    /** Returns a promise that resolves when any pending load operation has finished
     * @returns {Promise<void>}
     */
    untilLoaded()
    {
        return untilLoaded(this);
    }
}

let getEnv;

Object.defineProperty(globalThis, "coenv", {
    get()
    {
        return getEnv();
    }
});


/** Sets an environment provider
 * @param {() => Environment} value A callback to provide the current environment object
 * @returns {void}
 */
function setEnvProvider(value)
{
    getEnv = value;
}

/** Contains a HTML string
 */
class HtmlString
{
    /** Constructs a new HtmlString object
     * @param {string} html The HTML string
     */
    constructor(html)
    {
        this.html = html;
    }

    /** The HTML string 
     * @type {string}
     */
    html;
    
    /** 
     * Compares two values and returns true if they
     * are both HtmlString instances and both have the
     * same inner `html` value.
     * @param {any} a The first value to compare
     * @param {any} b The second value to compare
     * @returns {boolean}
     */
    static areEqual(a, b)
    {
        return (
            a instanceof HtmlString &&
            b instanceof HtmlString &&
            a.html == b.html
        );
    }
}

/** Marks a string as being HTML instead of plain text
 * 
 * Normally strings passed to templates are treated as plain text.  Wrapping
 * a value in html() indicates the string should be treated as HTML instead.
 * 
 * @param {string | (...args: any[]) => string} html The HTML value to be wrapped, or a function that returns a string
 * @returns {HtmlString}
 */
function html(html)
{
    if (html instanceof Function)
    {
        return (...args) => {
            return new HtmlString(html(...args));
        }
    }
    else
    {
        return new HtmlString(html);
    }
}

/** @internal */
class CloakedValue
{
    constructor(value)
    {
        this.value = value;
    }
}

/** @internal */
function cloak(value)
{
    return new CloakedValue(value);
}

/** Utility functions for working with CSS styles
 */
class Style
{
    /** Declares a CSS style string to be added to the `<head>` block
     * @param {string} css The CSS string to be added
     * @returns {void}
     */
    static declare(css)
    {
        coenv.declareStyle(css);
    }
}

/** Declares a CSS style string to be added to the `<head>` block
 * 
 * This function is intended to be used as a template literal tag
 * @param {string[]} strings The CSS to be added
 * @param {string[]} values The interpolated string values
 * @returns {void}
 */
function css(strings, values)
{
    let r = "";
    for (let i=0; i<strings.length - 1; i++)
    {
        r += strings[i];
        r += values[i];
    }
    r += strings[strings.length - 1];
    Style.declare(r);
}

let frameCallbacks = [];
let needSort = false;

/**
 * Invokes a callback on the next update cycle
 * 
 * @param {() => void} callback The callback to be invoked
 * @param {Number} [order] The priority of the callback in related to others (lowest first, default 0)
 * @returns {void}
 */
function nextFrame(callback, order)
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
function postNextFrame(callback)
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
function anyPendingFrames()
{
    return frameCallbacks.length != 0;
}

function CodeBuilder()
{
    let lines = [];
    let indentStr = "";
    let enableSplit = true;
    function append(...code)
    {
        for (let i=0; i<code.length; i++)
        {
            let part = code[i];
            if (part.lines)
            {
                // Appending another code builder
                lines.push(...part.lines.map(x => indentStr + x));
            }
            else if (Array.isArray(part))
            {
                lines.push(...part.filter(x => x != null).map(x => indentStr + x));
            }
            else
            {
                if (enableSplit)
                    lines.push(...part.split("\n").map(x => indentStr + x));
                else
                    lines.push(indentStr + part);
            }
        }
    }
    function indent()
    {
        indentStr += "  ";
    }
    function unindent()
    {
        indentStr = indentStr.substring(2);
    }
    function toString()
    {
        return lines.join("\n") + "\n";
    }
    function braced(cb)
    {
        append("{");
        indent();
        cb(this);
        unindent();
        append("}");
    }

    return {
        append,
        indent,
        unindent,
        braced,
        toString,
        lines,
        enableSplit(enable) { enableSplit = enable; },
        get isEmpty() { return lines.length == 0; },
    }
}

class ClosureBuilder
{
    constructor()
    {
        this.code = CodeBuilder();
        this.code.closure = this;
        this.functions = [];
        this.locals = [];
        this.prologs = [];
        this.epilogs = [];
    }

    get isEmpty()
    {
        return this.code.isEmpty && 
            this.locals.length == 0 &&
            this.functions.every(x => x.code.isEmpty) &&
            this.prologs.every(x => x.isEmpty) &&
            this.epilogs.every(x => x.isEmpty)
    }

    addProlog()
    {
        let cb = CodeBuilder();
        this.prologs.push(cb);
        return cb;
    }

    addEpilog()
    {
        let cb = CodeBuilder();
        this.epilogs.push(cb);
        return cb;
    }

    // Add a local variable to this closure
    addLocal(name, init)
    {
        this.locals.push({
            name, init
        });
    }

    // Add a function to this closure
    addFunction(name, args)
    {
        if (!args)
            args = [];
        let fn = {
            name,
            args,
            code: new ClosureBuilder(),
        };
        this.functions.push(fn);
        return fn.code;
    }

    getFunction(name)
    {
        return this.functions.find(x => x.name == name)?.code;
    }

    toString()
    {
        let final = CodeBuilder();
        this.appendTo(final);
        return final.toString();
    }

    appendTo(out)
    {
        // Declare locals
        if (this.locals.length > 0)
        {
            out.append(`let ${this.locals.map((l) => {
                if (l.init)
                    return `${l.name} = ${l.init}`;
                else
                    return l.name;
            }).join(', ')};`);
        }

        // Prologs
        for (let f of this.prologs)
        {
            out.append(f);
        }

        // Append main code
        out.append(this.code);

        // Append functions
        for (let f of this.functions)
        {
            out.append(`function ${f.name}(${f.args.join(", ")})`);
            out.append(`{`);
            out.indent();
            f.code.appendTo(out);
            out.unindent();
            out.append(`}`);
        }

        // Epilogs
        for (let f of this.epilogs)
        {
            out.append(f);
        }
    }
}

/** Encodes a string to make it safe for use in HTML
 * @param {string} str The string to encode
 * @returns {string}
 */
function htmlEncode(str)
{
    if (str === null || str === undefined)
        return "";
    return (""+str).replace(/["'&<>]/g, function(x) {
        switch (x) 
        {
            case '\"': return '&quot;';
            case '&': return '&amp;';
            case '\'':return '&#39;';
            case '<': return '&lt;';
            case '>': return '&gt;';
        }
    });
}

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

function input(options)
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
        options = { prop: options };

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
        let prop = props.pop();
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
        let v = formatValue(getValue());
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
            };
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

/** @internal */
class TemplateHelpers 
{
    static rawText(text)
    {
        if (text instanceof HtmlString)
            return text.html;
        else
            return htmlEncode(text);
    }

    static renderToString(renderFn)
    {
        let str = "";
        renderFn({
            write: function(x) { str += x; }
        });
        return str;
    }

    static renderComponentToString(comp)
    {
        let str = "";
        comp.render({
            write: function(x) { str += x; }
        });
        return str;
    }

    static rawStyle(text)
    {
        let style;
        if (text instanceof HtmlString)
            style = text.html;
        else
            style = htmlEncode(text);
        style = style.trim();
        if (!style.endsWith(";"))
            style += ";";
        return style;
    }

    static rawNamedStyle(styleName, text)
    {
        if (!text)
            return "";

        let style;
        if (text instanceof HtmlString)
            style = text.html;
        else
            style = htmlEncode(text);
        style = style.trim();
        style += ";";
        return `${styleName}:${style}`;
    }

    // Create either a text node from a string, or
    // a SPAN from an HtmlString
    static createTextNode(text)
    {
        if (text instanceof HtmlString)
        {
            let span = document.createElement("SPAN");
            span.innerHTML = text.html;
            return span;
        }
        else
        {
            return document.createTextNode(text);
        }
    }

    static setElementAttribute(node, attr, value)
    {
        if (value === undefined)
            node.removeAttribute(attr);
        else
            node.setAttribute(attr, value);
    }

    // Set either the inner text of an element to a string
    // or the inner html to a HtmlString
    static setElementText(node, text)
    {
        if (text instanceof HtmlString)
        {
            node.innerHTML = text.html;
        }
        else
        {
            node.textContent = text;
        }
    }

    // Set a node to text or HTML, replacing the 
    // node if it doesn't match the supplied text.
    static setNodeText(node, text)
    {
        if (text instanceof HtmlString)
        {
            if (node.nodeType == 1)
            {
                node.innerHTML = text.html;
                return node;
            }

            let newNode = document.createElement("SPAN");
            newNode.innerHTML = text.html;
            node.replaceWith(newNode);
            return newNode;
        }
        else
        {
            if (node.nodeType == 3)
            {
                node.nodeValue = text;
                return node;
            }
            let newNode = document.createTextNode(text);
            node.replaceWith(newNode);
            return newNode;
        }
    }

    // Set or remove a class on an element
    static setNodeClass(node, cls, set)
    {
        if (set)
            node.classList.add(cls);
        else
            node.classList.remove(cls);
    }

    // Set or remove a style on an element
    static setNodeStyle(node, style, value)
    {
        if (value === undefined || value === null)
            node.style.removeProperty(style);
        else
            node.style[style] = value;
    }

    static boolClassMgr(ctx, node, cls, getValue)
    {
        let tx = null;
        let value;

        return function update()
        {
            let newVal = getValue(ctx.model, ctx);
            if (newVal == value)
                return;
            value = newVal;

            if (getValue.withTransition && node.isConnected)
            {
                tx?.finish();
                tx = getValue.withTransition(ctx);
                if (newVal)
                {
                    tx.enterNodes([node]);
                    tx.onWillEnter(() => node.classList.add(cls));
                }
                else
                {
                    tx.leaveNodes([node]);
                    tx.onDidLeave(() => node.classList.remove(cls));
                }
                tx.start();
            }
            else
            {
                TemplateHelpers.setNodeClass(node, cls, newVal);
            }
        }
    }

    static setNodeDisplay(node, show, prev_display)
    {
        if (show === true)
        {
            // Null means the property didn't previously exist so remove it
            // Undefined means we've not looked at the property before so leave it alone
            if (prev_display === null)
            {
                node.style.removeProperty("display");
            }
            else if (prev_display !== undefined)
            {
                if (node.style.display != prev_display)
                    node.style.display = prev_display;
            }
            return undefined;
        }
        else if (show === false || show === null || show === undefined)
        {
            let prev = node.style.display;
            if (node.style.display != "none")
                node.style.display = "none";
            return prev ?? null;
        }
        else if (typeof(show) == 'string')
        {
            let prev = node.style.display;
            if (node.style.display != show)
                node.style.display = show;
            return prev ?? null;
        }
    }

    static displayMgr(ctx, node, getValue)
    {
        let tx = null;
        let value;
        let prevDisplay;

        return function update()
        {
            // See if value changed
            let newVal = getValue(ctx.model, ctx);
            if (newVal == value)
                return;
            value = newVal;

            if (getValue.withTransition && node.isConnected)
            {
                tx?.finish();

                let currentComputed = window.getComputedStyle(node).getPropertyValue("display");

                // Work out new actual style
                let newComputed;
                if (newVal === true)
                    newComputed = prevDisplay;
                else if (newVal === false || newVal === null || newVal === undefined)
                    newComputed = "none";
                else
                    newComputed = newVal;

                // Toggling to/from display none"
                if ((currentComputed == "none") != (newComputed == "none"))
                {
                    tx = getValue.withTransition(ctx);
                    if (newComputed != 'none')
                    {
                        tx.enterNodes([node]);
                        tx.onWillEnter(() => prevDisplay = TemplateHelpers.setNodeDisplay(node, newVal, prevDisplay));
                    }
                    else
                    {
                        tx.leaveNodes([node]);
                        tx.onDidLeave(() => prevDisplay = TemplateHelpers.setNodeDisplay(node, newVal, prevDisplay));
                    }
                    tx.start();
                    return;
                }
            }

            prevDisplay = TemplateHelpers.setNodeDisplay(node, newVal, prevDisplay);
        }
    }

    static replaceMany(oldNodes, newNodes)
    {
        if (!oldNodes?.[0]?.parentNode)
            return;
        // Insert the place holder
        oldNodes[0].replaceWith(...newNodes);

        // Remove the other fragment nodes
        for (let i=1; i<oldNodes.length; i++)
        {
            oldNodes[i].remove();
        }
    }

    static addEventListener(provideModel, el, eventName, handler)
    {
        function wrapped_handler(ev)
        {
            return handler(provideModel(), ev);
        }

        el.addEventListener(eventName, wrapped_handler);

        return function() { el.removeEventListener(eventName, wrapped_handler); }
    }

    static input() 
    { 
        return input(...arguments); 
    };
      
}

/** @internal */
class Plugins
{
    static plugins = [
    ];

    static register(plugin)
    {
        this.plugins.push(plugin);
    }

    static transform(template)
    {
        for (let p of this.plugins)
        {
            if (p.transform)
                template = p.transform(template);
        }
        return template;
    }

    static transformGroup(childNodes)
    {
        for (let p of this.plugins)
        {
            p.transformGroup?.(childNodes);
        }
    }

}

function parseTypeDecl(str)
{
    // Type first
    let mType = str.match(/\s*([^ \t.#]*)/);
    if (!mType)
        return {};

    str = str.substring(mType[0].length);

    let classes = [];
    let result = {
        type: mType[1],
    };
    for (let a of str.matchAll(/\s*([.#]?)([^ \t=.#]+)(?:\s*=\s*(\'[^']+\'|\S+))?/g))
    {
        if (!a[3])
        {
            if (a[1] == '.')
            {
                classes.push(a[2]);
                continue;
            }
            else if (a[1] == '#')
            {
                result.id = a[2];
                continue;
            }
        }

        // Work out attribute name
        let attrName = a[2];
        if (attrName == "type")
            attrName = "attr_type";

        // Work out attribute value
        let val = a[3] ?? a[2];

        // Trim quotes
        if ((val.startsWith("'") && val.endsWith("'")) || 
            (val.startsWith("\"") && val.endsWith("\"")))
        {
            val = val.substring(1, val.length - 1);
        }

        result[attrName] = val;
    }

    if (classes.length > 0)
        result.class = classes.join(" ");
    
    return result;
}

// Manages information about a node in a template
class TemplateNode
{
    // Constructs a new TemplateNode
    // - name: the variable name for this node (eg: "n1")
    // - template: the user supplied template object this node is derived from
    constructor(template, compilerOptions)
    {
        // Unwrap fluent
        if (template.$node)
            template = template.$node;

        // Parse type decl
        if (typeof(template.type) === 'string' && template.type[0] != '#')
        {
            Object.assign(template, parseTypeDecl(template.type));
        }

        // Automatically wrap array as a fragment with the array
        // as the child nodes.
        if (Array.isArray(template))
        {
            template = { $:template };
        }

        template = Plugins.transform(template);
        if (is_constructor(template))
        {
            template = { type: template };
        }

        // Setup
        this.template = template;

        // Work out its kind
        if (is_constructor(template.type))
        {
            if (template.type.integrate)
                this.kind = "integrated";
            else
                this.kind = "component";
        }
        else if (typeof(template) === 'string')
            this.kind = "text";
        else if (template instanceof HtmlString)
        {
            // HTML
            this.kind = "html";
            this.html = template.html;

            if (coenv.document)
            {
                // Use div to parse HTML
                let div = coenv.document.createElement('div');
                div.innerHTML = template.html;

                // Store nodes
                this.nodes = [...div.childNodes];
                this.nodes.forEach(x => x.remove());
            }
        }
        else if (template instanceof Function)
            this.kind = "dynamic_text";
        else if (template.type === '#comment')
            this.kind = "comment";
        else if (template.type === undefined)
            this.kind = "fragment";
        else 
            this.kind = "element";

        if (this.kind === 'integrated')
        {
            if (template.$ && !template.content)
            {
                template.content = template.$;
                delete template.$;
            }
            this.integrated = this.template.type.integrate(this.template, compilerOptions);
        }

        // If $ is a string or HtmlString convert to text property
        if (this.kind == 'element' && template.$ && !template.text)
        {
            if (typeof(template.$) == 'string' || template.$ instanceof HtmlString)
            {
                template.text = template.$;
                delete template.$;
            }
        }

        // Recurse child nodes
        if (this.kind == 'element' || this.kind == 'fragment')
        {
            if (template.$ && !template.childNodes)
            {
                template.childNodes = template.$;
                delete template.$;
            }

            if (template.childNodes)
            {
                if (!Array.isArray(template.childNodes))
                {
                    template.childNodes = [ template.childNodes ];
                }
                else
                {
                    template.childNodes = template.childNodes.flat();
                }

                template.childNodes = template.childNodes.map(x => x.$node ?? x);
                
                Plugins.transformGroup(template.childNodes);
                this.childNodes = this.template.childNodes.map(x => new TemplateNode(x, compilerOptions));
            }
            else
                this.childNodes = [];
        }
        else if (this.isComponent )
        {
            if (template.$ && !template.content)
            {
                template.content = template.$;
                delete template.$;
            }
        }
        else if (template.childNodes)
        {
            throw new Error("childNodes only supported on element and fragment nodes");
        }
    }

    // Checks if this node is a single or multi-root node
    // (fragments and foreach nodes are multi-root, all others are single root)
    get isSingleRoot()
    {
        if (this.isFragment)
            return this.childNodes.length == 1 && this.childNodes[0].isSingleRoot;

        if (this.isComponent)
            return this.template.type.isSingleRoot;

        if (this.isIntegrated)
            return this.integrated.isSingleRoot;

        if (this.kind == 'html')
            return this.nodes.length == 1;

        return true;
    }

    // Is this a component?
    get isComponent()
    {
        return this.kind === 'component';
    }

    get isFragment()
    {
        return this.kind === 'fragment';
    }

    get isIntegrated()
    {
        return this.kind === 'integrated';
    }

    // Recursively get all the local node variables associated with this node and it's
    // children. This function is used to get all the variables that need to
    // be reset to null when this item is conditionally removed from the DOM
    *enumLocalNodes()
    {
        if (!this.isFragment)
            yield this;

        if (this.childNodes)
        {
            for (let i=0; i<this.childNodes.length; i++)
            {
                yield *this.childNodes[i].enumLocalNodes();
            }
        }
    }

    // Returns a string describing all the child DOM nodes
    // as a sequence of spread variables.
    spreadChildDomNodes()
    {
        return Array.from(enumChildNodes(this)).filter(x => x.length > 0).join(", ");

        function *enumChildNodes(n)
        {
            for (let i=0; i<n.childNodes.length; i++)
            {
                yield n.childNodes[i].spreadDomNodes();
            }
        }
    
    }

    // Returns a string descibing all the DOM nodes of this node
    // with conditionally included nodes correctly included/excluded
    spreadDomNodes()
    {
        let nodes = Array.from(this.enumAllNodes());
        return nodes.join(", ");
    }

    // Generate code to list out all this node's dom nodes
    *enumAllNodes()
    {
        switch (this.kind)
        {
            case 'fragment':
                for (let i=0; i<this.childNodes.length; i++)
                {
                    yield *this.childNodes[i].enumAllNodes();
                }
                break;

            case 'component':
            case 'integrated':
                if (this.isSingleRoot)
                    yield `${this.name}.rootNode`;
                else
                    yield `...${this.name}.rootNodes`;
                break;

            case 'html':
                if (this.nodes.length > 0)
                {
                    if (this.nodes.length > 1)
                        yield `...${this.name}`;
                    else
                        yield `${this.name}`;
                }
                break;

            default:
                yield this.name;
        }
    }

}

/** @internal */
let TransitionNone = 
{
    enterNodes: function() {},
    leaveNodes: function() {},
    onWillEnter: function(cb) { cb(); },
    onDidLeave: function(cb) { cb(); },
    start: function() {},
    finish: function() {},
};

class EmbedSlot
{
    static integrate(template, compilerOptions)
    {
        let contentTemplate = null;
        if (template.content && typeof(template.content) === "object")
        {
            contentTemplate = template.content;
            delete template.content;
        }
        let retv = {
            isSingleRoot: false,
            data: { 
                ownsContent: template.ownsContent ?? true,
                content: template.content,
            },
            nodes: [
                contentTemplate ? new TemplateNode(contentTemplate, compilerOptions) : null,
                template.placeholder ? new TemplateNode(template.placeholder, compilerOptions) : null,
            ]
        };

        delete template.content;
        delete template.placeholder;
        delete template.ownsContent;

        return retv;
    }


    static transform(template)
    {
        // Wrap non-constructor callbacks in an embed slot where the 
        // callback is the content
        if (template instanceof Function && !is_constructor(template))
        {
            return {
                type: EmbedSlot,
                content: template,
            }
        }

        if (template.type == 'embed-slot')
            template.type = EmbedSlot;
        return template;
    }

    #context;
    #content;           // As set by user (potentially callback)
    #contentValue;      // Either #content or result of #content() if function
    #contentObject;     // Either a component like object, or an array of nodes
    #headSentinal;
    #tailSentinal;
    #placeholderConstructor;
    #pendingTransition;

    constructor(options)
    {
        this.#context = options.context;
        this.#placeholderConstructor = options.nodes[1];
        this.#headSentinal = coenv.document?.createTextNode("");
        this.#tailSentinal = coenv.document?.createTextNode("");
        this.#ownsContent = options.data.ownsContent ?? true;

        // Load now
        if (options.nodes[0])
            this.content = options.nodes[0]();
        else
            this.content = options.data.content;
    }

    get #contentNodes()
    {
        return this.#contentObject?.rootNodes ?? this.#contentObject ?? [];
    }

    get rootNodes() 
    { 
        return [ 
            this.#headSentinal, 
            ...this.#contentNodes,
            this.#tailSentinal 
        ]; 
    }

    get isSingleRoot()
    {
        return false;
    }

    // When ownsContent to false old content
    // wont be `destroy()`ed
    #ownsContent = true;
    get ownsContent()
    {
        return this.#ownsContent;
    }
    set ownsContent(value)
    {
        this.#ownsContent = value;
    }

    get content()
    {
        return this.#content;
    }

    set content(value)
    {
        // Store new content
        this.#content = value;

        if (this.#content instanceof Function)
        {
            this.replaceContent(this.#content.call(this.#context.model, this.#context.model, this.#context));
        }
        else
        {
            this.replaceContent(this.#content);
        }
    }

    update()
    {
        if (this.#content instanceof Function)
        {
            this.replaceContent(this.#content.call(this.#context.model, this.#context.model, this.#context));
        }

        // Update place holder
        if (!this.#contentValue)
            this.#contentObject?.update?.();
    }

    bind()
    {
        if (!this.#contentValue)        // only placeholder
            this.#contentObject?.bind?.();
    }

    unbind()
    {
        if (!this.#contentValue)        // only placeholder
            this.#contentObject?.unbind?.();
    }

    get isAttached() {  }

    get #attached()
    {
        return this.#headSentinal?.parentNode != null;
    }

    #mounted
    setMounted(mounted)
    {
        this.#mounted = mounted;
        this.#contentObject?.setMounted?.(mounted);
    }

    replaceContent(value)
    {
        // Same value?
        if (this.#contentValue === value || HtmlString.areEqual(this.#contentValue, value))
        {
            if (value || this.#contentObject)   // Make sure placeholder constructed
                return;
        }

        // Capture old content and nodes
        let oldContentObject = this.#contentObject;
        let nodesLeaving = [...this.#contentNodes];

        // Store new value 
        this.#contentValue = value;

        // Resolve place-holder
        let newContentObject;
        if (!value)
        {
            newContentObject = this.#placeholderConstructor?.(this.#context) ?? null;
        }
        else if (value.rootNodes)
        {
            newContentObject = value;
        }
        else if (value instanceof HtmlString)
        {
            // Convert node
            let span = coenv.document.createElement('span');
            span.innerHTML = value.html;
            newContentObject = [ ...span.childNodes ];
            newContentObject.forEach(x => x.remove());
        }
        else if (typeof(value) === 'string')
        {
            // Convert to node
            newContentObject = [ coenv.document.createTextNode(value) ];
        }
        else if (Array.isArray(value))
        {
            // TODO: assert all are Node objects
            newContentObject = value;
        }
        else if (value.nodeType !== undefined)
        {
            // Wrap single node in an array
            newContentObject = [ value ];
        }
        else if (value.render)
        {
            // Render only
            newContentObject = value;
        }
        else
        {
            throw new Error("Embed slot requires component, array of HTML nodes or a single HTML node");
        }

        // Store new content object
        this.#contentObject = newContentObject;

        if (this.#attached)
        {
            // Work out transition
            this.#pendingTransition?.finish();
            let tx;
            if (this.#mounted)
                tx = this.#content?.withTransition?.(this.#context);
            if (!tx)
                tx = TransitionNone;
            this.#pendingTransition = tx;

            tx.enterNodes(this.#contentNodes);
            tx.leaveNodes(nodesLeaving);
            tx.onWillEnter(() => {
                this.#tailSentinal.before(...this.#contentNodes);
                if (this.#mounted)
                    this.#contentObject?.setMounted?.(true);
            });
            tx.onDidLeave(() => {
                nodesLeaving.forEach(x => x.remove());
                if (this.#mounted)
                    oldContentObject?.setMounted?.(false);
                if (this.#ownsContent)
                    oldContentObject?.destroy?.();
            });
            tx.start();
        }
        else
        {
            if (this.#mounted)
            {
                oldContentObject?.setMounted?.(false);
                this.#contentObject?.setMounted?.(true);
            }
            if (this.#ownsContent)
                oldContentObject?.destroy?.();
        }
    }

    destroy()
    {
        if (this.#ownsContent)
            this.#contentObject?.destroy?.();
    }

}

Plugins.register(EmbedSlot);

function diff_tiny(oldArray, newArray)
{
    let minLength = Math.min(oldArray.length, newArray.length);
    let maxLength = Math.max(oldArray.length, newArray.length);

    // Work out how many matching keys at the start
    let trimStart = 0;
    while (trimStart < minLength && oldArray[trimStart] == newArray[trimStart])
        trimStart++;

    // Already exact match
    if (trimStart == maxLength)
        return [];

    // Simple Append?
    if (trimStart == oldArray.length)
    {
        return [{ 
            op: "insert", 
            index: oldArray.length,
            count: newArray.length - oldArray.length
        }];
    }

    // Work out how many matching keys at the end
    let trimEnd = 0;
    while (trimEnd < (minLength - trimStart) && oldArray[oldArray.length - trimEnd - 1] == newArray[newArray.length - trimEnd - 1])
        trimEnd++;

    // Simple prepend
    if (trimEnd == oldArray.length)
    {
        return [{ 
            op: "insert", 
            index: 0,
            count: newArray.length - oldArray.length
        }];
    }

    // Simple insert?
    if (trimStart + trimEnd == oldArray.length)
    {
        return [{ 
            op: "insert", 
            index: trimStart,
            count: newArray.length - oldArray.length
        }];
    }

    // Simple delete?
    if (trimStart + trimEnd == newArray.length)
    {
        return [{ 
            op: "delete", 
            index: trimStart,
            count: oldArray.length - newArray.length
        }];
    }

    // Work out end of range of each array
    let endOld = oldArray.length - trimEnd;
    let endNew = newArray.length - trimEnd;
    
    // Build a map of new items
    let newMap = build_map(newArray, trimStart, endNew);
    let oldMap = null;

    let ops = [];

    let n = trimStart;
    let o = trimStart;
    while (n < endNew)
    {
        // Skip equal items
        while (n < endNew && oldArray[o] == newArray[n])
        {
            newMap.delete(newArray[n], n);
            n++;
            o++;
        }

        // Remember start position in each array
        let ns = n;
        let os = o;

        // Delete items that aren't in the new array
        while (o < endOld && !newMap.has(oldArray[o]))
            o++;
        if (o > os)
        {
            ops.push({ op: "delete", index: ns, count: o - os });
            continue;
        }

        // Build a map of items in the old array
        if (!oldMap)
            oldMap = build_map(oldArray, n, endOld);

        // Insert items that aren't in the old array
        while (n < endNew && !oldMap.has(newArray[n]))
        {
            newMap.delete(newArray[n], n);
            n++;
        }
        if (n > ns)
        {
            ops.push({ op: "insert", index: ns, count: n - ns });
            continue;
        }

        // Rebuild needed
        break;
    }

    // Finished?
    if (n == endNew)
        return ops;

    // Rebuild phase 1 - remove all items in the range to be rebuilt, either
    // deleting or storing them.
    let si = 0;
    let storeMap = new MultiValueMap();
    while (o < endOld)
    {
        // Delete all items that aren't in the new map
        let os = o;
        while (o < endOld && !newMap.has(oldArray[o]))
            o++;
        if (o > os)
        {
            ops.push({ op: "delete", index: n, count: o - os });
            continue;
        }

        // Store all items are are in the new map
        while (o < endOld && newMap.consume(oldArray[o]) !== undefined)
        {
            storeMap.add(oldArray[o], si++);    // remember store index for this key
            o++;
        }
        if (o > os)
            ops.push({ op: "store", index: n, count: o - os });
    }

    // Rebuild phase 2 - add all items from the new array, either by
    // getting an item with the same key from the store, or by creating
    // a new item
    while (n < endNew)
    {
        // Insert new items that aren't in the store
        let ns = n;
        while (n < endNew && !storeMap.has(newArray[n]))
            n++;
        if (n > ns)
        {
            ops.push({ op: "insert", index: ns, count: n - ns });
            continue;
        }

        // Restore items that are in the store
        let op = { op: "restore", index: n, count: 0 };
        ops.push(op);
        while (n < endNew)
        {
            let si = storeMap.consume(newArray[n]);
            if (si === undefined)
                break;
            if (op.count == 0)
            {
                op.storeIndex = si;
                op.count = 1;
            }
            else if (op.storeIndex + op.count == si)
            {
                op.count++;
            }
            else
            {
                op = { op: "restore", index: n, storeIndex: si, count: 1 };
                ops.push(op);
            }
            n++;
        }
    }

    return ops;

    function build_map(array, start, end)
    {
        let map = new MultiValueMap();
        for (let i=start; i<end; i++)
        {
            map.add(array[i], i);
        }
        return map;
    }
}


class MultiValueMap
{
    constructor()
    {
    }

    #map = new Map();

    // Add a value to a key
    add(key, value)
    {
        let values = this.#map.get(key);
        if (values)
        {
            values.push(value);
        }
        else
        {
            this.#map.set(key, [ value ]);
        }
    }

    delete(key, value)
    {
        let values = this.#map.get(key);
        if (values)
        {
            let index = values.indexOf(value);
            if (index >= 0)
            {
                values.splice(index, 1);
                return;
            }
        }
        throw new Error("key/value pair not found");
    }

    consume(key)
    {
        let values = this.#map.get(key);
        if (!values || values.length == 0)
            return undefined;

        return values.shift();
    }

    // Check if have a key
    has(key)
    {
        return this.#map.has(key);
    }

}

class ForEachBlock
{
    static integrate(template, compilerOptions)
    {
        let data = {
            itemConstructor: compilerOptions.compileTemplate(template.template),
            template: {
                items: template.items,
                condition: template.condition,
                itemKey: template.itemKey,
            },
        };


        let nodes;
        if (template.empty)
        {
            nodes = [ new TemplateNode(template.empty, compilerOptions) ];
        }

        delete template.template;
        delete template.items;
        delete template.condition;
        delete template.itemKey;
        delete template.empty;

        return {
            isSingleRoot: false,
            data: data,
            nodes: nodes
        }
    }

    static transform(template)
    {
        if (template.foreach === undefined)
            return template;

        let newTemplate;

        if (template.foreach instanceof Function || Array.isArray(template.foreach))
        {
            // Declared as an array all options default:
            //    foreach: <array>
            //    foreach: () => anything
            newTemplate = {
                type: ForEachBlock,
                template: template,
                items: template.foreach,
            };
            delete template.foreach;
        }
        else
        {
            // Declared as an object, with options maybe
            //    foreach: { items: }
            newTemplate = Object.assign({}, template.foreach, {
                type: ForEachBlock,
                template: template,
            });
            delete template.foreach;
        }

        return newTemplate;
    }

    constructor(options)
    {
        // Get the item consructor we compiled earlier
        this.itemConstructor = options.data.itemConstructor;

        // Use this context as the outer context for items
        this.outer = options.context;

        // Get loop options from the template
        this.items = options.data.template.items;
        this.condition = options.data.template.condition;
        this.itemKey = options.data.template.itemKey;
        this.emptyConstructor = options.nodes.length ? options.nodes[0] : null;

        // This will be an array of items constructed from the template
        this.itemDoms = [];

        // Sentinal nodes
        this.#headSentinal = coenv.document?.createComment(" enter foreach block ");
        this.#tailSentinal = coenv.document?.createComment(" leave foreach block ");

        // Single vs multi-root op helpers
        if (this.itemConstructor.isSingleRoot)
        {
            this.#insert = this.#single_root_insert;
            this.#delete = this.#single_root_delete;
            this.#insert_dom = this.#single_root_insert_dom;
            this.#remove_dom = this.#single_root_remove_dom;
        }
        else
        {
            this.#insert = this.#multi_root_insert;
            this.#delete = this.#multi_root_delete;
            this.#insert_dom = this.#multi_root_insert_dom;
            this.#remove_dom = this.#multi_root_remove_dom;
        }
        
    }

    get rootNodes()
    {
        let emptyNodes = this.emptyDom ? this.emptyDom.rootNodes : [];

        if (!this.itemConstructor.isSingleRoot)
        {
            let r = [ this.#headSentinal ];
            for (let i=0; i<this.itemDoms.length; i++)
            {
                r.push(...this.itemDoms[i].rootNodes);
            }
            r.push(...emptyNodes);
            r.push(this.#tailSentinal);
            return r;
        }
        else
        {
            return [this.#headSentinal, ...this.itemDoms.map(x => x.rootNode), ...emptyNodes, this.#tailSentinal];
        }
    }

    #headSentinal;
    #tailSentinal;

    #mounted = false;
    setMounted(mounted)
    {
        this.#mounted = mounted;
        setItemsMounted(this.itemDoms, mounted);
    }

    

    update()
    {
        // Resolve the items collection
        let newItems;
        if (this.items instanceof Function)
        {
            newItems = this.items.call(this.outer.model, this.outer.model, this.outer);
        }
        else
        {
            newItems = this.items;
        }
        newItems = newItems ?? [];

        // Get keys for all items
        let tempCtx = { 
            outer: this.outer 
        };

        // Run condition and key generation 
        let newKeys = null;

        // Filter out conditional items
        if (this.condition)
        {
            newItems = newItems.filter((item) => {
                tempCtx.model = item;
                return this.condition.call(item, item, tempCtx);
            });
        }

        // Generate keys
        if (this.itemKey)
        {
            newKeys = newItems.map((item) => {
                tempCtx.model = item;
                return this.itemKey.call(item, item, tempCtx);
            });
        }

        // Items not yet loaded?
        if (!this.itemsLoaded)
        {
            this.itemsLoaded = true;
            this.#insert(newItems, newKeys, 0, 0, newItems.length);
            this.#updateEmpty();
            return;
        }

        // Update
        this.#update_range(0, this.itemDoms.length, newItems, newKeys);
    }
    
    #update_range(range_start, range_length, newItems, newKeys)
    {
        let range_end = range_start + range_length;

        // Get the old items in range
        let oldItemDoms;
        if (range_start == 0 && range_length == this.itemDoms.length)
            oldItemDoms = this.itemDoms;
        else
            oldItemDoms = this.itemDoms.slice(range_start, range_end);

        // Run diff or patch over
        let ops;
        if (newKeys)
        {
            ops = diff_tiny(oldItemDoms.map(x => x.context.key), newKeys);
        }
        else
        {
            if (newItems.length > oldItemDoms.length)
            {
                ops = [{ 
                    op: "insert", 
                    index: oldItemDoms.length,
                    count: newItems.length - oldItemDoms.length,
                }];
            }
            else if (newItems.length < oldItemDoms.length)
            {
                ops = [{
                    op: "delete",
                    index: newItems.length,
                    count: oldItemDoms.length - newItems.length,
                }];
            }
            else
            {
                ops = [];
            }
        }

        // Run diff
        if (ops.length == 0)
        {
            this.#patch_existing(newItems, newKeys, range_start, 0, range_length);
            return;
        }

        let store = [];
        let spare = [];

        // Op dispatch table
        let handlers = {
            insert: op_insert,
            delete: op_delete,
            store: op_store,
            restore: op_restore,
        };


        // Dispatch to handlers
        let pos = 0;
        for (let o of ops)
        {
            if (o.index > pos)
            {
                this.#patch_existing(newItems, newKeys, range_start + pos, pos, o.index - pos);
                pos = o.index;
            }

            handlers[o.op].call(this, o);
        }
        
        // Patch trailing items
        if (pos < newItems.length)
            this.#patch_existing(newItems, newKeys, range_start + pos, pos, newItems.length - pos);

        // Destroy remaining spare items
        destroyItems(spare);

        // Update empty list indicator
        this.#updateEmpty();
        
        function op_insert(op)
        {
            pos += op.count;

            let useSpare = Math.min(spare.length, op.count);
            if (useSpare)
            {
                let items = spare.splice(0, useSpare);
                this.#insert_dom(op.index + range_start, items);
                this.#patch_existing(newItems, newKeys, op.index + range_start, op.index, useSpare);
                if (this.#mounted)
                    setItemsMounted(items, true);
            }
            if (useSpare < op.count)
            {
                this.#insert(newItems, newKeys, op.index + range_start + useSpare, op.index + useSpare, op.count - useSpare);
            }
        }

        function op_delete(op)
        {
            let items = this.#remove_dom(op.index + range_start, op.count);
            if (this.#mounted)
                setItemsMounted(items, false);
            spare.push(...items);
        }

        function op_store(op)
        {
            store.push(...this.#remove_dom(op.index + range_start, op.count));
        }

        function op_restore(op)
        {
            pos += op.count;
            this.#insert_dom(op.index + range_start, store.slice(op.storeIndex, op.storeIndex + op.count));
            this.#patch_existing(newItems, newKeys, op.index + range_start, op.index, op.count);
        }

    }

    bind()
    {
        this.emptyDom?.bind?.();
    }

    unbind()
    {
        this.emptyDom?.unbind?.();
    }

    destroy()
    {
        destroyItems(this.itemDoms);

        this.itemDoms = null;
    }

    #updateEmpty()
    {
        if (this.itemDoms.length == 0)
        {
            if (!this.emptyDom && this.emptyConstructor)
            {
                this.emptyDom = this.emptyConstructor();
                if (this.#attached)
                    this.#tailSentinal.before(...this.emptyDom.rootNodes);
                if (this.#mounted)
                    this.emptyDom.setMounted(true);
            }
            if (this.emptyDom)
            {
                this.emptyDom.update();
            }
        }
        else
        {
            if (this.emptyDom)
            {
                if (this.#attached)
                {
                    for (var n of this.emptyDom.rootNodes)
                        n.remove();
                }
                if (this.#mounted)
                    this.emptyDom.setMounted(false);
                this.emptyDom.destroy();
                this.emptyDom = null;
            }
        }
    }

    #insert;
    #insert_dom;
    #delete;
    #remove_dom;

    get #attached()
    {
        return this.#tailSentinal?.parentNode != null;
    }

    #multi_root_insert(newItems, newKeys, index, src_index, count)
    {
        let itemDoms = [];
        for (let i=0; i<count; i++)
        {
            // Setup item context
            let itemCtx = {
                outer: this.outer,
                model: newItems[src_index + i],
                key: newKeys?.[src_index + i],
                index: index + i,
            };

            // Construct the item
            itemDoms.push(this.itemConstructor(itemCtx));
        }

        this.#multi_root_insert_dom(index, itemDoms);

        if (this.#mounted)
            setItemsMounted(itemDoms, true);
    }

    #multi_root_insert_dom(index, itemDoms)
    {
        // Save dom elements
        this.itemDoms.splice(index, 0, ...itemDoms);

        // Insert the nodes
        if (this.#attached)
        {
            let newNodes = [];
            itemDoms.forEach(x => newNodes.push(...x.rootNodes));

            let insertBefore;
            if (index + itemDoms.length < this.itemDoms.length)
            {
                insertBefore = this.itemDoms[index + itemDoms.length].rootNodes[0];
            }
            else
            {
                insertBefore = this.#tailSentinal;
            }
            insertBefore.before(...newNodes);
        }
    }

    #multi_root_delete(index, count)
    {
        let itemDoms = this.#multi_root_remove_dom(index, count);
        if (this.#mounted)
            setItemsMounted(itemDoms, false);
        destroyItems(itemDoms);
    }

    #multi_root_remove_dom(index, count)
    {
        // Remove the items
        if (this.#attached)
        {
            for (let i=0; i<count; i++)
            {
                let children = this.itemDoms[index + i].rootNodes;
                for (let j = 0; j<children.length; j++)
                {
                    children[j].remove();
                }
            }
        }

        // Splice arrays
        return this.itemDoms.splice(index, count);
    }

    #single_root_insert(newItems, newKeys, index, src_index, count)
    {
        let itemDoms = [];
        for (let i=0; i<count; i++)
        {
            // Setup item context
            let itemCtx = {
                outer: this.outer,
                model: newItems[src_index + i],
                key: newKeys?.[src_index + i],
                index: index + i,
            };

            // Construct the item
            itemDoms.push(this.itemConstructor(itemCtx));
        }

        this.#single_root_insert_dom(index, itemDoms);
        if (this.#mounted)
            setItemsMounted(itemDoms, true);
    }

    #single_root_insert_dom(index, itemDoms)
    {
        // Save dom elements
        this.itemDoms.splice(index, 0, ...itemDoms);

        // Insert the nodes
        if (this.#attached)
        {
            let newNodes = itemDoms.map(x => x.rootNode);

            let insertBefore;
            if (index + itemDoms.length < this.itemDoms.length)
            {
                insertBefore = this.itemDoms[index + itemDoms.length].rootNode;
            }
            else
            {
                insertBefore = this.#tailSentinal;
            }
            insertBefore.before(...newNodes);
        }
    }

    #single_root_delete(index, count)
    {
        let itemDoms = this.#single_root_remove_dom(index, count);
        if (this.#mounted)
            setItemsMounted(itemDoms, false);
        destroyItems(itemDoms);
    }

    #single_root_remove_dom(index, count)
    {
        // Remove
        if (this.#attached)
        {
            for (let i=0; i<count; i++)
            {
                this.itemDoms[index + i].rootNode.remove();
            }
        }

        // Splice arrays
        return this.itemDoms.splice(index, count);
    }

    #patch_existing(newItems, newKeys, index, src_index, count)
    {
        // If item sensitive, always update index and item
        for (let i=0; i<count; i++)
        {
            let item = this.itemDoms[index + i];
            item.context.key = newKeys?.[src_index + i];
            item.context.index = index + i;
            item.context.model = newItems[src_index + i];
            item.rebind();
            item.update();
        }
    }
}

function destroyItems(items)
{
    for (let i=items.length - 1; i>=0; i--)
    {
        items[i].destroy();
    }
}

function setItemsMounted(items, mounted)
{
    for (let i=items.length - 1; i>=0; i--)
    {
        items[i].setMounted(mounted);
    }
}

Plugins.register(ForEachBlock);

function Placeholder(comment)
{
    let fn = function()
    {
        let node = coenv.document?.createComment(comment);

        return {
            get rootNode() { return node; },
            get rootNodes() { return [ node ]; },
            get isSingleRoot() { return true; },
            setMounted(m) { },
            destroy() {},
            update() {},
        }
    };

    fn.isSingleRoot = true;
    return fn;
}

class IfBlock
{
    static integrate(template, compilerOptions)
    {
        let branches = [];
        let key = template.key;
        delete template.key;
        let nodes = [];
        let hasElseBranch = false;
        let isSingleRoot = true;
        for (let i=0; i<template.branches.length; i++)
        {
            // Get branch
            let branch = template.branches[i];

            // Setup branch info for this branch
            let brInfo = {};
            branches.push(brInfo);

            // Setup condition
            if (branch.condition instanceof Function)
            {
                brInfo.condition = branch.condition;
                hasElseBranch = false;
            }
            else if (branch.condition !== undefined)
            {
                brInfo.condition = () => branch.condition;
                hasElseBranch = !!branch.condition;
            }
            else
            {
                brInfo.condition = () => true;
                hasElseBranch = true;
            }

            // Setup template
            if (branch.template !== undefined)
            {
                // Check if branch template has a single root
                let ni_branch = new TemplateNode(branch.template, compilerOptions);
                if (!ni_branch.isSingleRoot)
                    isSingleRoot = false;

                brInfo.nodeIndex = nodes.length;
                nodes.push(ni_branch);
            }
        }

        delete template.branches;

        // Make sure there's always an else block
        if (!hasElseBranch)
        {
            branches.push({
                condition: () => true,
            });
        }

        return {
            isSingleRoot,
            nodes,
            data: {
                key,
                branches,
                isSingleRoot,
            }
        };
    }

    static transform(template)
    {
        if (template.key !== undefined)
        {
            let key = template.key;
            if (!(key instanceof Function))
                throw new Error("`key` is not a function");
            delete template.key;
            let newTemplate = {
                type: IfBlock,
                key,
                branches: [
                    {
                        template: this.transform(template),
                        condition: true,
                    }
                ]
            };
            return newTemplate;
        }

        if (template.if !== undefined)
        {
            let newTemplate = {
                type: IfBlock,
                branches: [
                    {
                        template: template,
                        condition: template.if,
                    }
                ]
            };

            delete template.if;
            return newTemplate;
        }

        return template;
    }

    static transformGroup(templates)
    {
        let ifBlock = null;
        for (let i=0; i<templates.length; i++)
        {
            let t = templates[i];
            if (t.if)
            {
                ifBlock = {
                    type: IfBlock,
                    branches: [
                        {
                            condition: t.if,
                            template: t,
                        }
                    ]
                };
                delete t.if;
                templates.splice(i, 1, ifBlock);
            }
            else if (t.elseif)
            {
                if (!ifBlock)
                    throw new Error("template has 'elseif' without a preceeding condition");

                ifBlock.branches.push({
                    condition: t.elseif,
                    template: t,
                });
                delete t.elseif;

                // Remove branch
                templates.splice(i, 1);
                i--;
            }
            else if (t.else !== undefined)
            {
                if (!ifBlock)
                    throw new Error("template has 'else' without a preceeding condition");

                ifBlock.branches.push({
                    condition: true,
                    template: t,
                });
                delete t.else;

                // End of group
                ifBlock = null;

                // Remove branch
                templates.splice(i, 1);
                i--;
            }
            else
            {
                ifBlock = null;
            }
        }
    }

    constructor(options)
    {
        this.isSingleRoot = options.data.isSingleRoot;
        this.branches = options.data.branches;
        this.key = options.data.key;
        this.branch_constructors = [];
        this.context = options.context;

        // Setup constructors for branches
        for (let br of this.branches)
        {
            if (br.nodeIndex !== undefined)
            {
                this.branch_constructors.push(options.nodes[br.nodeIndex]);
            }
            else
            {
                this.branch_constructors.push(Placeholder(" IfBlock placeholder "));
            }
        }

        // Initialize
        this.activeBranchIndex = -1;
        this.activeKey = undefined;
        this.activeBranch = Placeholder(" IfBlock placeholder ")();

        // Multi-root if blocks need a sentinal to mark position
        // in case one of the multi-root branches has no elements
        if (!this.isSingleRoot)
            this.headSentinal = coenv.document?.createComment(" if ");
    }

    destroy()
    {
        this.activeBranch.destroy();
    }

    update()
    {
        // Make sure correct branch is active
        this.switchActiveBranch();

        // Update the active branch
        this.activeBranch.update();
    }


    unbind()
    {
        this.activeBranch.unbind?.();
    }

    bind()
    {
        this.activeBranch.bind?.();
    }

    get isAttached()
    {
        if (this.isSingleRoot)
            return this.activeBranch.rootNode?.parentNode != null;
        else
            return this.headSentinal.parentNode != null;
    }

    switchActiveBranch()
    {
        // Switch branch
        let newActiveBranchIndex = this.resolveActiveBranch();
        let newActiveKey = this.key ? this.key.call(this.context.model, this.context.model, this.context) : undefined;
        if (newActiveBranchIndex != this.activeBranchIndex ||
            newActiveKey != this.activeKey)
        {
            // Finish old transition
            this.#pendingTransition?.finish();

            let isAttached = this.isAttached;
            let oldActiveBranch = this.activeBranch;
            this.activeBranchIndex = newActiveBranchIndex;
            this.activeKey = newActiveKey;
            this.activeBranch = this.branch_constructors[newActiveBranchIndex]();

            if (isAttached)
            {
                // Work out new transition
                let transition;
                if (this.#mounted)
                {
                    if (this.key)
                        transition = this.key.withTransition?.(this.context);
                    else
                        transition = this.branches[0].condition.withTransition?.(this.context);
                }
                if (!transition)
                    transition = TransitionNone;
                this.#pendingTransition = transition;

                transition.enterNodes(this.activeBranch.rootNodes);
                transition.leaveNodes(oldActiveBranch.rootNodes);
                
                transition.onWillEnter(() => {
                    if (this.isSingleRoot)
                    {
                        let last = oldActiveBranch.rootNodes[oldActiveBranch.rootNodes.length - 1];
                        last.after(this.activeBranch.rootNodes[0]);
                    }
                    else
                        this.headSentinal.after(...this.activeBranch.rootNodes);

                    if (this.#mounted)
                        this.activeBranch.setMounted(true);
                });
                
                transition.onDidLeave(() => {
                    oldActiveBranch.rootNodes.forEach(x => x.remove());
                    if (this.#mounted)
                        oldActiveBranch.setMounted(false);
                    oldActiveBranch.destroy();
                });

                transition.start();
            }
            else
            {
                if (this.#mounted)
                {
                    this.activeBranch.setMounted(true);
                    oldActiveBranch.setMounted(false);
                    oldActiveBranch.destroy();
                }
            }
        }
    }

    #pendingTransition;

    resolveActiveBranch()
    {
        for (let i=0; i<this.branches.length; i++)
        {
            if (this.branches[i].condition.call(this.context.model, this.context.model, this.context))
                return i;
        }
        throw new Error("internal error, IfBlock didn't resolve to a branch");
    }

    #mounted = false;
    setMounted(mounted)
    {
        this.#mounted = mounted;
        this.activeBranch.setMounted(mounted);
    }

    get rootNodes()
    {
        if (this.isSingleRoot)
            return this.activeBranch.rootNodes;
        else
            return [ this.headSentinal, ...this.activeBranch.rootNodes ];
    }

    get rootNode()
    {
        return this.activeBranch.rootNode;
    }
}

Plugins.register(IfBlock);

function compileTemplateCode(rootTemplate, compilerOptions)
{
    // Every node in the template will get an id, starting at 1.
    let nodeId = 1;

    // Every dynamic property gets a variable named pNNN where n increments
    // using this variable
    let prevId = 1;

    // Any callbacks, arrays etc... referenced directly by the template
    // will be stored here and passed back to the compile code via refs
    let refs = [];

    let rootClosure = null;

    // Create root node info        
    let rootTemplateNode = new TemplateNode(rootTemplate, compilerOptions);

    // Storarge for export and bindings
    let exports = new Map();


    let closure = create_node_closure(rootTemplateNode, true);


    // Return the code and context
    return { 
        code: closure.toString(), 
        isSingleRoot: rootTemplateNode.isSingleRoot,
        refs,
    }

    // Emit a node closure (ie: node, child nodes, destroy, update
    // root nodes and exported api).
    function create_node_closure(ni, isRootTemplate)
    {
        // Dispatch table to handle compiling different node types
        let node_kind_handlers = {
            emit_text_node,
            emit_html_node,
            emit_dynamic_text_node,
            emit_comment_node,
            emit_fragment_node,
            emit_element_node,
            emit_integrated_node,
            emit_component_node,
        };

        // Setup closure functions
        let closure = new ClosureBuilder();
        let closure_create = closure.addFunction("create").code;
        let closure_post_create = [];
        let closure_bind = closure.addFunction("bind").code;
        let closure_update = closure.addFunction("update").code;
        let closure_unbind = closure.addFunction("unbind").code;
        let closure_setMounted = closure.addFunction("setMounted", ["mounted"]).code;
        let closure_destroy = closure.addFunction("destroy").code;
        let closure_create_append = closure_create.append;
        let closure_update_append = closure_update.append;
        let rebind;
        if (isRootTemplate)
            rebind = closure.addFunction("rebind").code;
        let bindings = new Map();

        // Create model variable
        if (isRootTemplate)
        {
            rootClosure = closure;
            rootClosure.code.append(`let model = context.model;`);
            rootClosure.code.append(`let document = env.document;`);
        }

        // Call create function
        closure.code.append(`create();`);
        closure.code.append(`bind();`);
        closure.code.append(`update();`);
            
        // Render code
        emit_node(ni);

        closure_create_append(closure_post_create);

        // Bind/unbind
        if (!closure_bind.closure.isEmpty)
        {
            closure_create_append(`bind();`);
            closure_destroy.closure.addProlog().append(`unbind();`);
        }

        let otherExports = [];

        // Single root
        if (ni.isSingleRoot)
            otherExports.push(`  get rootNode() { return ${ni.spreadDomNodes()}; },`);

        // Root context?
        if (isRootTemplate)
        {
            otherExports.push(`  context,`);

            if (ni == rootTemplateNode)
            {
                exports.forEach((value, key) => 
                    otherExports.push(`  get ${key}() { return ${value}; },`));
            }

            if (closure.getFunction('bind').isEmpty)
            {
                rebind.append(`model = context.model`);
            }
            else
            {
                rebind.append(`if (model != context.model)`);
                rebind.braced(() => {
                    rebind.append(`unbind();`);
                    rebind.append(`model = context.model`);
                    rebind.append(`bind();`);
                });
            }
            otherExports.push(`  rebind,`);
        }
        else
        {
            otherExports.push(`  bind,`);
            otherExports.push(`  unbind,`);
        }


        // Render API to the closure
        closure.code.append([
            `return { `,
            `  update,`,
            `  destroy,`,
            `  setMounted,`,
            `  get rootNodes() { return [ ${ni.spreadDomNodes()} ]; },`,
            `  isSingleRoot: ${ni.isSingleRoot},`,
            ...otherExports,
            `};`]);

        return closure;

        function addNodeLocal(ni)
        {
            if (ni.template.export)
                rootClosure.addLocal(ni.name);
            else
                closure.addLocal(ni.name);
        }


        // Sometimes we need a temp variable.  This function
        // adds it when needed
        function need_update_temp()
        {
            if (!closure_update.temp_declared)
            {
                closure_update.temp_declared = true;
                closure_update_append(`let temp;`);
            }
        }

        // Recursively emit a node from a template
        function emit_node(ni)
        {
            // Assign it a name
            ni.name = `n${nodeId++}`;

            // Dispatch to kind handler
            node_kind_handlers[`emit_${ni.kind}_node`](ni);
        }

        // Emit a static 'text' node
        function emit_text_node(ni)
        {
            addNodeLocal(ni);
            closure_create_append(`${ni.name} = document.createTextNode(${JSON.stringify(ni.template)});`);
        }

        // Emit a static 'html' node
        function emit_html_node(ni)
        {
            if (ni.nodes.length == 0)
                return;

            // Emit
            addNodeLocal(ni);
            if (ni.nodes.length == 1)
            {
                closure_create_append(`${ni.name} = refs[${refs.length}].cloneNode(true);`);
                refs.push(ni.nodes[0]);
            }
            else
            {
                closure_create_append(`${ni.name} = refs[${refs.length}].map(x => x.cloneNode(true));`);
                refs.push(ni.nodes);
            }
        }

        // Emit a 'dynamic-text' onde
        function emit_dynamic_text_node(ni)
        {
            // Create
            addNodeLocal(ni);
            let prevName = `p${prevId++}`;
            closure.addLocal(prevName);
            closure_create_append(`${ni.name} = helpers.createTextNode("");`);

            // Update
            need_update_temp();
            closure_update_append(`temp = ${format_callback(refs.length)};`);
            closure_update_append(`if (temp !== ${prevName})`);
            closure_update_append(`  ${ni.name} = helpers.setNodeText(${ni.name}, ${prevName} = ${format_callback(refs.length)});`);

            // Store the callback as a ref
            refs.push(ni.template);
        }

        // Emit a 'comment' node
        function emit_comment_node(ni)
        {
            addNodeLocal(ni);
            if (ni.template.text instanceof Function)
            {
                // Dynamic comment

                // Create
                let prevName = `p${prevId++}`;
                closure.addLocal(prevName);
                closure_create_append(`${ni.name} = document.createComment("");`);

                // Update
                need_update_temp();
                closure_update_append(`temp = ${format_callback(refs.length)};`);
                closure_update_append(`if (temp !== ${prevName})`);
                closure_update_append(`  ${ni.name}.nodeValue = ${prevName} = temp;`);

                // Store callback
                refs.push(ni.template.text);
            }
            else
            {
                // Static
                closure_create_append(`${ni.name} = document.createComment(${JSON.stringify(ni.template.text)});`);
            }
        }

        // Emit an 'integrated' component node
        function emit_integrated_node(ni)
        {
            // Emit sub-nodes
            let nodeConstructors = [];
            let has_bindings = false;
            if (ni.integrated.nodes)
            {
                for (let i=0; i<ni.integrated.nodes.length; i++)
                {
                    // Create the sub-template node
                    let ni_sub = ni.integrated.nodes[i];
                    if (!ni_sub)
                    {
                        nodeConstructors.push(null);
                        continue;
                    }

                    ni_sub.name = `n${nodeId++}`;

                    // Emit it
                    let sub_closure = create_node_closure(ni_sub, false);

                    // Track if the closure has any bindings
                    let fnBind = sub_closure.getFunction("bind");
                    if (!fnBind.isEmpty)
                        has_bindings = true;

                    // Append to our closure
                    let nodeConstructor = `${ni_sub.name}_constructor_${i+1}`;
                    let itemClosureFn = closure.addFunction(nodeConstructor, [ ]);
                    sub_closure.appendTo(itemClosureFn.code);

                    nodeConstructors.push(nodeConstructor);
                }
            }

            closure_update_append(`${ni.name}.update()`);

            if (has_bindings)
            {
                closure_bind.append(`${ni.name}.bind()`);
                closure_unbind.append(`${ni.name}.unbind()`);
            }

            let data_index = -1;
            if (ni.integrated.data)
            {
                data_index = refs.length;
                refs.push(ni.integrated.data);
            }

            // Create integrated component
            addNodeLocal(ni);
            closure_create_append(
                `${ni.name} = new refs[${refs.length}]({`,
                `  context,`,
                `  data: ${ni.integrated.data ? `refs[${data_index}]` : `null`},`,
                `  nodes: [ ${nodeConstructors.join(", ")} ],`,
                `});`
            );
            refs.push(ni.template.type);

            // setMounted support
            closure_setMounted.append(`${ni.name}.setMounted(mounted);`);

            // destroy support
            closure_destroy.append(`${ni.name}?.destroy();`);
            closure_destroy.append(`${ni.name} = null;`);

            // Process common properties
            for (let key of Object.keys(ni.template))
            {
                // Process properties common to components and elements
                if (process_common_property(ni, key))
                    continue;

                throw new Error(`Unknown element template key: ${key}`);
            }
        
        }

        
        // Emit a 'component' node
        function emit_component_node(ni)
        {
            // Create component
            addNodeLocal(ni);
            closure_create_append(`${ni.name} = new refs[${refs.length}]();`);
            refs.push(ni.template.type);

            // If component has slots, create the object before attempting
            // to assign the content values
            let slotNames = new Set(ni.template.type.slots ?? []);
            if (slotNames.size > 0)
            {
                closure_create_append(`${ni.name}.create?.()`);
            }

            let auto_update = ni.template.update === "auto";
            let auto_modified_name = false;

            // setMounted support
            closure_setMounted.append(`${ni.name}.setMounted(mounted);`);
            
            // destroy support
            closure_destroy.append(`${ni.name}?.destroy();`);
            closure_destroy.append(`${ni.name} = null;`);

            // Process all keys
            for (let key of Object.keys(ni.template))
            {
                // Process properties common to components and elements
                if (process_common_property(ni, key))
                    continue;

                // Ignore for now
                if (key == "update")
                {
                    continue;
                }

                // Compile value as a template
                if (slotNames.has(key))
                {
                    if (ni.template[key] === undefined)
                        continue;

                    // Emit the template node
                    let propTemplate = new TemplateNode(ni.template[key], compilerOptions);
                    emit_node(propTemplate);
                    if (propTemplate.isSingleRoot)
                        closure_create_append(`${ni.name}${member(key)}.content = ${propTemplate.name};`);
                    else
                        closure_create_append(`${ni.name}${member(key)}.content = [${propTemplate.spreadDomNodes()}];`);
                    continue;
                }

                // All other properties, assign to the object
                let propType = typeof(ni.template[key]);
                if (propType == 'string' || propType == 'number' || propType == 'boolean')
                {
                    // Simple literal property
                    closure_create_append(`${ni.name}${member(key)} = ${JSON.stringify(ni.template[key])}`);
                }
                else if (propType === 'function')
                {
                    // Dynamic property

                    if (auto_update && !auto_modified_name)
                    {
                        auto_modified_name = `${ni.name}_mod`;
                        closure_update_append(`let ${auto_modified_name} = false;`);
                    }

                    // Create
                    let prevName = `p${prevId++}`;
                    closure.addLocal(prevName);
                    let callback_index = refs.length;

                    // Update
                    need_update_temp();
                    closure_update_append(`temp = ${format_callback(callback_index)};`);
                    closure_update_append(`if (temp !== ${prevName})`);
                    if (auto_update)
                    {
                        closure_update_append(`{`);
                        closure_update_append(`  ${auto_modified_name} = true;`);
                    }

                    closure_update_append(`  ${ni.name}${member(key)} = ${prevName} = temp;`);

                    if (auto_update)
                        closure_update_append(`}`);

                    // Store callback
                    refs.push(ni.template[key]);
                }
                else
                {
                    // Unwrap cloaked value
                    let val = ni.template[key];
                    if (val instanceof CloakedValue)
                        val = val.value;

                    // Object property
                    closure_create_append(`${ni.name}${member(key)} = refs[${refs.length}];`);
                    refs.push(val);
                }
            }

            // Generate deep update
            if (ni.template.update)
            {
                if (typeof(ni.template.update) === 'function')
                {
                    closure_update_append(`if (${format_callback(refs.length)})`);
                    closure_update_append(`  ${ni.name}.update();`);
                    refs.push(ni.template.update);
                }
                else
                {
                    if (auto_update)
                    {
                        if (auto_modified_name)
                        {
                            closure_update_append(`if (${auto_modified_name})`);
                            closure_update_append(`  ${ni.name}.update();`);
                        }
                    }
                    else
                    {
                        closure_update_append(`${ni.name}.update();`);
                    }
                }
            }
        }

        // Emit a 'fragment' noe
        function emit_fragment_node(ni)
        {
            emit_child_nodes(ni);
        }

        // Emit an 'element' node
        function emit_element_node(ni)
        {
            // Work out namespace
            let save_xmlns = closure.current_xmlns;
            let xmlns = ni.template.xmlns;
            if (xmlns === undefined && ni.template.type == 'svg')
            {
                xmlns = "http://www.w3.org/2000/svg";
            }
            if (xmlns == null)
                xmlns = closure.current_xmlns;

            // Create the element
            addNodeLocal(ni);
            if (!xmlns)
                closure_create_append(`${ni.name} = document.createElement(${JSON.stringify(ni.template.type)});`);
            else
            {
                closure.current_xmlns = xmlns;
                closure_create_append(`${ni.name} = document.createElementNS(${JSON.stringify(xmlns)}, ${JSON.stringify(ni.template.type)});`);
            }

            // destroy support
            closure_destroy.append(`${ni.name} = null;`);

            for (let key of Object.keys(ni.template))
            {
                // Process properties common to components and elements
                if (process_common_property(ni, key))
                    continue;

                if (key.startsWith("class_"))
                {
                    let className = camel_to_dash(key.substring(6));
                    let value = ni.template[key];

                    if (value instanceof Function)
                    {
                        if (!ni.bcCount)
                            ni.bcCount = 0;
                        let mgrName = `${ni.name}_bc${ni.bcCount++}`;
                        closure.addLocal(mgrName);
                        closure_create_append(`${mgrName} = helpers.boolClassMgr(context, ${ni.name}, ${JSON.stringify(className)}, refs[${refs.length}]);`);
                        refs.push(value);
                        closure_update_append(`${mgrName}();`);
                    }
                    else
                    {
                        closure_create_append(`helpers.setNodeClass(${ni.name}, ${JSON.stringify(className)}, ${value});`);
                    }
                    continue;
                }

                if (key.startsWith("style_"))
                {
                    let styleName = camel_to_dash(key.substring(6));
                    format_dynamic(ni.template[key], (valueExpr) => `helpers.setNodeStyle(${ni.name}, ${JSON.stringify(styleName)}, ${valueExpr})`);
                    continue;
                }

                if (key == "display")
                {
                    if (ni.template.display instanceof Function)
                    {
                        let mgrName = `${ni.name}_dm`;
                        closure.addLocal(mgrName);
                        closure_create_append(`${mgrName} = helpers.displayMgr(context, ${ni.name}, refs[${refs.length}]);`);
                        refs.push(ni.template.display);
                        closure_update_append(`${mgrName}();`);
                    }
                    else
                    {
                        closure_create_append(`helpers.setNodeDisplay(${ni.name}, ${JSON.stringify(ni.template.display)});`);
                    }
                    continue;
                }

                if (key == "text")
                {
                    if (ni.template.text instanceof Function)
                    {
                        format_dynamic(ni.template.text, (valueExpr) => `helpers.setElementText(${ni.name}, ${valueExpr})`);
                    }
                    else if (ni.template.text instanceof HtmlString)
                    {
                        closure_create_append(`${ni.name}.innerHTML = ${JSON.stringify(ni.template.text.html)};`);
                    }
                    if (typeof(ni.template.text) === 'string')
                    {
                        closure_create_append(`${ni.name}.textContent = ${JSON.stringify(ni.template.text)};`);
                    }
                    continue;
                }


                let attrName = key;
                if (key.startsWith("attr_"))
                    attrName = attrName.substring(5);

                if (!closure.current_xmlns)
                    attrName = camel_to_dash(attrName);

                format_dynamic(ni.template[key], (valueExpr) => `helpers.setElementAttribute(${ni.name}, ${JSON.stringify(attrName)}, ${valueExpr})`);
            }

            // Emit child nodes
            emit_child_nodes(ni);
            
            // Add all the child nodes to this node
            if (ni.childNodes?.length)
            {
                closure_create_append(`${ni.name}.append(${ni.spreadChildDomNodes()});`);
            }
            closure.current_xmlns = save_xmlns;
        }

        // Emit the child nodes of an element or fragment node
        function emit_child_nodes(ni)
        {
            // Child nodes?
            if (!ni.childNodes)
                return;

            // Create the child nodes
            for (let i=0; i<ni.childNodes.length; i++)
            {
                emit_node(ni.childNodes[i]);
            }
        }

        // Process properties common to html elements and components
        function process_common_property(ni, key)
        {
            if (is_known_property(key))
                return true;

            if (key == "export")
            {
                if (typeof(ni.template.export) !== 'string')
                    throw new Error("'export' must be a string");
                if (exports.has(ni.template.export))
                    throw new Error(`duplicate export name '${ni.template.export}'`);
                exports.set(ni.template.export, ni.name);
                return true;
            }

            if (key == "bind")
            {
                if (typeof(ni.template.bind) !== 'string')
                    throw new Error("'bind' must be a string");
                if (bindings.has(ni.template.export))
                    throw new Error(`duplicate bind name '${ni.template.bind}'`);

                // Remember binding
                bindings.set(ni.template.bind, true);

                // Generate it
                closure_bind.append(`model${member(ni.template.bind)} = ${ni.name};`);
                closure_unbind.append(`model${member(ni.template.bind)} = null;`);
                return true;
            }

            if (key.startsWith("on_"))
            {
                let eventName = key.substring(3);
                let handler = ni.template[key];
                if (typeof(handler) === 'string')
                {
                    let handlerName = handler;
                    handler = (c,...args) => c[handlerName](...args);
                }
                if (!(handler instanceof Function))
                    throw new Error(`event handler for '${key}' is not a function`);

                // create a variable name for the listener
                if (!ni.listenerCount)
                    ni.listenerCount = 0;
                ni.listenerCount++;
                let listener_name = `${ni.name}_ev${ni.listenerCount}`;
                closure.addLocal(listener_name);

                // Add listener
                closure_create_append(`${listener_name} = helpers.addEventListener(() => model, ${ni.name}, ${JSON.stringify(eventName)}, refs[${refs.length}]);`);
                refs.push(handler);

                closure_destroy.append(`${listener_name}?.();`);
                closure_destroy.append(`${listener_name} = null;`);

                return true;
            }

            if (key == "input")
            {
                let inputName = `${ni.name}_in`;
                closure.addLocal(inputName);
                closure_create_append(`${inputName} = helpers.input(refs[${refs.length}])`);
                closure_post_create.push(`${inputName}.create(${ni.name}, context);`);
                refs.push(ni.template[key]);
                closure_update_append(`${inputName}.update()`);
                closure_destroy.append(`${inputName}.destroy()`);
                return true;
            }

            if (key == "debug_create")
            {
                if (typeof(ni.template[key]) === 'function')
                {
                    closure_create_append(`if (${format_callback(refs.length)})`);
                    closure_create_append(`  debugger;`);
                    refs.push(ni.template[key]);
                }
                else if (ni.template[key])
                    closure_create_append("debugger;");
                return true;
            }
            if (key == "debug_update")
            {
                if (typeof(ni.template[key]) === 'function')
                {
                    closure_update_append(`if (${format_callback(refs.length)})`);
                    closure_update_append(`  debugger;`);
                    refs.push(ni.template[key]);
                }
                else if (ni.template[key])
                    closure_update_append("debugger;");
                return true;
            }
            if (key == "debug_render")
                return true;


            return false;
        }

        function is_known_property(key)
        {
            return key == "type" || key == "childNodes" || key == "xmlns";
        }

        function format_callback(index)
        {
            return `refs[${index}].call(model, model, context)`
        }

        // Helper to format a dynamic value on a node (ie: a callback)
        function format_dynamic(value, formatter)
        {
            if (value instanceof Function)
            {
                let prevName = `p${prevId++}`;
                closure.addLocal(prevName);
                
                // Render the update code
                formatter();

                need_update_temp();
                closure_update_append(`temp = ${format_callback(refs.length)};`);
                closure_update_append(`if (temp !== ${prevName})`);
                closure_update_append(`  ${formatter(prevName + " = temp")};`);

                // Store the callback in the context callback array
                refs.push(value);
            }
            else
            {
                // Static value, just output it directly
                closure_create_append(formatter(JSON.stringify(value)));
            }
        }
    }
}


let _nextInstanceId = 1;

/** Compiles a template into a domTreeConstructor function
 * @param {object} rootTemplate The template to be compiled
 * @returns {DomTreeConstructor}
 */
function compileTemplate(rootTemplate)
{
    let compilerOptions = {
        compileTemplate: compileTemplate
    };

    // Compile code
    let code = compileTemplateCode(rootTemplate, compilerOptions);
    //console.log(code.code);

    // Put it in a function
    let templateFunction = new Function("env", "refs", "helpers", "context", code.code);

    // Wrap it in a constructor function
    let compiledTemplate = function(context)
    {
        if (!context)
            context = {};
        context.$instanceId = _nextInstanceId++;
        return templateFunction(coenv, code.refs, TemplateHelpers, context ?? {});
    };

    // Store meta data about the component on the function since we need this before 
    // construction
    compiledTemplate.isSingleRoot = code.isSingleRoot;

    return compiledTemplate;
}

/** @import { DomTree, DomTreeConstructor } from "../types.d.ts" */

/** 
 * Components are the primary building block for constructing CodeOnly
 * applications. They encapsulate program logic, a DOM (aka HTML) template 
 * and an optional a set of CSS styles.
 *
 * Components can be used either in the templates of other components
 * or mounted onto the document DOM to appear in a web page.
 *
 * @extends EventTarget
 */
class Component extends EventTarget
{
    /** Constructs a new component instance */
    constructor()
    {
        super();

        // Bind these so they can be passed directly to update callbacks.
        this.update = this.update.bind(this);
        this.invalidate = this.invalidate.bind(this);
    }

    static _domTreeConstructor;

    /** Gets the `domTreeConstructor` for this component class.
     * 
     * A `domTreeConstructor` is the constructor function used to 
     * create `domTree` instances for this component class.
     * 
     * The first time this property is accessed, it calls the 
     * static `onProvideDomTreeConstructor` method to actually provide the
     * instance.
     * @type {DomTreeConstructor}
    */
    static get domTreeConstructor()
    {
        if (!this._domTreeConstructor)
            this._domTreeConstructor = this.onProvideDomTreeConstructor();
        return this._domTreeConstructor
    }

    /** Provides the `domTreeConstructor` to be used by this component class.
     * 
     * This method is only called once per component class and should provide
     * a constructor function that can create `domTree` instances.
     * @returns {import("./TemplateCompiler").DomTreeConstructor}
     */
    static onProvideDomTreeConstructor()
    {
        return compileTemplate(this.onProvideTemplate());
    }

    /** Provides the template to be used by this component class.
     * 
     * This method is only called once per component class and should provide
     * the template to be compiled for this component class
     */
    static onProvideTemplate()
    {
        return this.template;
    }

    /** Indicates if instances of this component class will be guaranteed
     * to only ever have a single root node
     * 
     * @type {boolean}
     */
    static get isSingleRoot()
    {
        return this.domTreeConstructor.isSingleRoot;
    }

    /** Ensures the DOM elements of this component are created.
     * 
     * Calling this method does nothing if the component is already created.
     * 
     * @returns {void}
     */
    create()
    {
        if (!this.#domTree)
            this.#domTree = new this.constructor.domTreeConstructor({ model: this });
    }

    /** Returns true if this component's DOM elements have been created 
     * 
     * @type {boolean}
     */
    get created()
    {
        return this.#domTree != null;
    }

    /** 
     * Gets the `domTree` for this component, creating it if necessary 
     * 
     * @type {DomTree}
    */
    get domTree()
    {
        if (!this.#domTree)
            this.create();
        return this.#domTree;
    }
    #domTree;
    
    /** Returns true if this component instance has, and will only ever 
     * have a single root node
     * 
     * @type {boolean}
     */
    get isSingleRoot() 
    { 
        return this.domTree.isSingleRoot; 
    }

    /** Returns the single root node of this component (if it is a single 
     * root node component)
     * 
     * @type {Node}
     */
    get rootNode() 
    { 
        if (!this.isSingleRoot)
            throw new Error("rootNode property can't be used on multi-root template");

        return this.domTree.rootNode;
    }

    /** Returns the root nodes of this element 
     * 
     * @type {Node[]}
    */
    get rootNodes() 
    { 
        return this.domTree.rootNodes; 
    }

    /** @internal */
    static nextFrameOrder = -100;

    #invalid = false;

    /** Indicates if this component is currently marked as invalid
     * @type {boolean}
     */
    get invalid()
    {
        return this.#invalid;
    }


    /** Marks this component as requiring a DOM update.
     * 
     * Does nothing if the component hasn't yet been created.
     * 
     * This method is implicitly bound to the component instance
     * and can be used as an event listener to invalidate the
     * component when an event is triggered.
     * 
     * @returns {void}
     */
    invalidate()
    {
        // No need to invalidate if not created yet
        if (!this.#domTree)
            return;

        // Already invalid?
        if (this.invalid)
            return;

        // Mark
        this.#invalid = true;

        // Request callback
        Component.invalidateWorker(this);
    }

    /** Updates this component if it's marked as invalid
     * 
     * @returns {void}
     */
    validate()
    {
        if (this.invalid)
            this.update();
    }

    /** @private */
    static _invalidComponents = [];

    /** @private */
    static invalidateWorker(component)
    {
        // Add component to list requiring validation
        this._invalidComponents.push(component);

        // If it's the first, set up a nextFrame callback
        if (this._invalidComponents.length == 1)
        {
            nextFrame(() => {
                // Process invalid components.
                // NB: new components invalidated while validating original
                //     set of components will be added to end of array 
                //     and also updated this frame.
                for (let i=0; i<this._invalidComponents.length; i++)
                {
                    this._invalidComponents[i].validate();
                }
                this._invalidComponents = [];
            }, Component.nextFrameOrder);
        }
    }


    /** Immediately updates this component's DOM elements - even if
     * the component is not marked as invalid.
     * 
     * Does nothing if the component's DOM elements haven't been created.
     * 
     * If the component is marked as invalid, returns it to the valid state.
     * 
     * This method is implicitly bound to the component instance
     * and can be used as an event listener to update the
     * component when an event is triggered.
     *
     * @returns {void}
     */
    update()
    {
        if (!this.#domTree)
            return;
        
        this.#invalid = false;
        this.domTree.update();
    }

    
    /** Gets the error object (if any) that was thrown during the last async data {@link Component#load} operation.
     * 
     * @type {Error}
    */
   get loadError()
   {
       return this.#loadError;
    }
    
    /** 
     * Sets the error object associated with the current async data {@link Component#load} operation.
     * @param {Error | null} value The new error object
     */
    set loadError(value)
    {
        this.#loadError = value;
        this.invalidate();
    }
    #loadError = null;
        
    #loading = 0;

    /** Indicates if the component is currently in an async data {@link Component#load} operation
     * 
     * @type {boolean}
     */
    get loading()
    {
        return this.#loading != 0;
    }

    /**
     * @callback LoadCallback
     * @returns {any}
     */

    /** Performs an async data load operation.
     * 
     * The callback function is typically an async function that performs
     * a data request.  While in the callback, the {@link Component#loading} property
     * will return `true`.  If the callback throws an error, it will be captured
     * to the {@link Component#loadError} property.
     * 
     * Before calling and after returning from the callback, the component is
     * invalidated so visual elements (eg: spinners) can be updated.
     * 
     * If the silent parameter is `true` the `loading` property isn't set and
     * the component is only invalidated after returning from the callback.
     * 
     * @param {LoadCallback} callback The callback to perform the load operation
     * @param {Boolean} [silent] Whether to perform a silent update
     * @returns {any} The result of the callback
     */
    async load(callback, silent)
    {
        if (silent)
        {
            let retv = await callback();
            this.invalidate();
            return retv;
        }

        this.#loading++;
        if (this.#loading == 1)
        {
            this.#loadError = null;
            this.invalidate();  
            coenv.enterLoading();
            this.dispatchEvent(new Event("loading"));
        }
        try
        {
            return await callback();
        }
        catch (err)
        {
            this.#loadError = err;
        }
        finally
        {
            this.#loading--;
            if (this.#loading == 0)
            {
                this.invalidate();
                this.dispatchEvent(new Event("loaded"));
                coenv.leaveLoading();
            }
        }
    }


    /** Destroys this components `domTree` returning it to 
     * the constructed but not created state.
     * 
     * A destroyed component can be recreated by remounting it
     * or by calling its {@link Component#create} method.
     * 
     * @returns {void}
     */
    destroy()
    {
        if (this.#domTree)
        {
            this.#domTree.destroy();
            this.#domTree = null;
        }
    }

    /** Notifies a component that is has been mounted
     * 
     * Override this method to receive the notification.  External
     * resources (eg: adding event listeners to external objects) should be 
     * acquired when the component is mounted.
     * 
     * @returns {void}
     */
    onMount()
    {
    }

    /** Notifies a component that is has been mounted
     * 
     * Override this method to receive the notification.  External
     * resources (eg: removing event listeners from external objects) should be 
     * released when the component is unmounted.
     * 
     * @returns {void}
     */
    onUnmount()
    {
    }

    #listeners;


    /** Registers an event listener to be added to an object when
     * automatically when the component is mounted, and removed when
     * unmounted
     * 
     * @param {EventTarget} target The object dispatching the events
     * @param {string} event The event to listen for
     * @param {Function} [handler] The event listener to add/remove.  If not provided, the component's {@link Component#invalidate} method is used.
     * @returns {void}
     */
    listen(target, event, handler)
    {
        if (!target || !event)
            return;
        if (!handler)
            handler = this.invalidate;
        if (!this.#listeners)
            this.#listeners = [];
        this.#listeners.push({
            target, event, handler
        });
        if (this.#mounted)
            target.addEventListener(event, handler);
    }

    /** Removes an event listener previously registered with {@link Component#listen}
     * 
     * @param {EventTarget} target The object dispatching the events
     * @param {string} event The event to listen for
     * @param {Function} [handler] The event listener to add/remove.  If not 
     * provided, the component's {@link Component#invalidate} method is used.
     * @returns {void}
     */
    unlisten(target, event, handler)
    {
        if (!target || !event || !this.#listeners)
            return;
        let index = this.#listeners.findIndex(x =>
            x.target == target &&
            x.event == event &&
            x.handler == handler
            );
        if (index >= 0)
        {
            this.#listeners.splice(index, 1);
            if (this.#mounted)
                target.removeEventListener(event, handler);
        }
    }

    /** Indicates if the component is current mounted.
     * 
     * @type {boolean}
     */
    get mounted()
    {
        return this.#mounted;
    }

    #mounted = false;

    
    /**
     * Notifies the object is has been mounted or unmounted
     * @param {boolean} mounted True when the object has been mounted, false when unmounted
     */
    setMounted(mounted)
    {
        // Depth first
        this.#domTree?.setMounted(mounted);

        // Remember state
        this.#mounted = mounted;

        // Add event listeners
        let needsInvalidate = false;
        if (mounted && this.#listeners)
        {
            this.#listeners.forEach(x => x.target.addEventListener(x.event, x.handler));
            needsInvalidate = this.#listeners.length > 0 && this.#domTree;
        }

        // Dispatch to self
        if (mounted)
            this.onMount();
        else
            this.onUnmount();

        // Force invalidate?
        if (needsInvalidate)
            this.invalidate();

        // Remove event listeners
        if (!mounted && this.#listeners)
            this.#listeners.forEach(x => x.target.removeEventListener(x.event, x.handler));
    }

    /** Mounts this component against an element in the document.
     * 
     * @param {Element | string} el The element or an element selector that specifies where to mount the component
     * @returns {void}
     */
    mount(el)
    {
        coenv.mount(this, el);
    }

    /** Unmounts this component
     * 
     * @returns {void}
     */
    unmount()
    {
        coenv.unmount(this);
    }

    /** The template to be used by this component class */
    static template = {};
}

const defaultClassNames = {
    "entering": "*-entering;*-active",
    "enter-start": "*-enter-start;*-out",
    "enter-end": "*-enter-end;*-in",
    "leaving": "*-leaving;*-active",
    "leave-start": "*-leave-start;*-in",
    "leave-end": "*-leave-end;*-out",
};


/** @internal */
function TransitionCss(options, ctx) 
{
    let onWillEnter;
    let onDidLeave;
    let enterNodes = [];
    let leaveNodes = [];
    let nodesTransitioning = [];
    let finished = false;
    let entering = false;
    let leaving = false;

    function resolve(x)
    {
        if (x instanceof Function)
            return x(ctx.model, ctx);
        else
            return x;
    }

    // Resolve dynamic values
    resolve(options.name);
    let mode = resolve(options.mode);
    let classNames = resolve(options.clasNames);
    let duration = resolve(options.duration);
    let subtree = resolve(options.subtree);

    // Resolve mode        
    switch (mode)
    {
        case "enter-leave":
        case "leave-enter":
            break;
        default:
            mode = "";
            break;
    }

    // Resolve duration
    if (duration != undefined && !Array.isArray(duration))
        duration = [ duration, duration ];


    // For an array of states, get the full set of class names
    // associated with that state.
    function classNamesForState(states)
    {
        let result = [];
        for (let s of states)
        {
            // Look in options.classNames the in default names
            let cls_names = classNames?.[s] ?? defaultClassNames[s];

            // Split on semicolon
            cls_names = (cls_names ?? "").split(";");

            // Replace * with animation name
            cls_names = cls_names.map(x => x.replace(/\*/g, options.name ?? "tx"));

            // Add to list
            result.push(...cls_names);
        }
        return result;
    }

    function addClasses(nodes, states)
    {
        let classes = classNamesForState(states);
        if (classes.length)
            nodes.forEach(x => x.classList?.add(...classes));
    }

    function removeClasses(nodes, states)
    {
        let classes = classNamesForState(states);
        if (classes.length)
            nodes.forEach(x => x.classList?.remove(...classes));
    }

    function track_transitions(nodes, class_add, class_remove)
    {
        // Switch classes after one frame
        requestAnimationFrame(() => 
        requestAnimationFrame(() => {
            addClasses(nodes, [ class_add ]);
            removeClasses(nodes, [ class_remove ]);
        }));

        // Track that these nodes might be transition
        nodesTransitioning.push(...nodes);
    }

    function start_enter()
    {
        entering = true;

        // Apply classes
        addClasses(enterNodes, [ "entering", "enter-start" ]);

        // Do operation
        onWillEnter?.();
        onWillEnter = null;

        // Track transitions
        track_transitions(enterNodes, "enter-end", "enter-start");
    }

    function finish_enter()
    {
        entering = false;
        removeClasses(enterNodes, [ "enter-start", "entering", "enter-end" ]);
    }

    function start_leave()
    {
        leaving = true;

        // Apply classes
        addClasses(leaveNodes, [ "leaving", "leave-start" ]);

        // Track transitions
        track_transitions(leaveNodes, "leave-end", "leave-start");
    }

    function finish_leave()
    {
        leaving = false;
        removeClasses(leaveNodes, [ "leave-start", "leaving", "leave-end" ]);

        // Do operation
        onDidLeave?.();
        onDidLeave = null;
    }

    function while_busy(enter)
    {
        // Use duration instead of animation watching?
        if (duration !== undefined)
        {
            let d = 0;
            if (entering)
                d = d[0];
            if (leaving)
                d = Math.max(d, d[1]);

            return new Promise((resolve) => setTimeout(resolve, d));
        }

        return new Promise((resolve, reject) => {
            requestAnimationFrame(() => 
            requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                
                // Get all active animations
                let animations = [];
                for (let n of nodesTransitioning)
                {
                    if (n.nodeType == 1)
                        animations.push(...n.getAnimations({subtree: subtree ?? true}));
                }
                nodesTransitioning = [];

                // Wait till they're all done
                Promise.allSettled(animations.map(x => x.finished)).then(resolve);
            });}));
        });
    }

    async function start()
    {
        options.on_start?.(ctx.model, ctx);

        if (mode == "" || mode == "enter-leave")
            start_enter();
        if (mode == "" || mode == "leave-enter")
            start_leave();

        await while_busy();

        if (finished)
            return;

        if (mode != "")
        {
            if (mode == "enter-leave")
            {
                start_leave();
                finish_enter();
            }
            else if (mode == "leave-enter")
            {
                // Must start inserts before finishing
                // removes so we don't lose DOM position.
                start_enter();
                finish_leave();
            }

            await while_busy();

            if (mode == "enter-leave")
            {
                finish_leave();
            }
            else if (mode == "leave-enter")
            {
                finish_enter();
            }
        }
        else
        {
            finish_enter();
            finish_leave();
        }

        finished = true;
        options.on_finish?.(ctx.model, ctx);
    }

    function finish()
    {
        if (finished)
            return;

        finished = true;

        onWillEnter?.();
        finish_enter();
        finish_leave();

        options.on_cancel?.(ctx.model, ctx);
    }

    return {

        enterNodes: function(nodes)
        {
            enterNodes.push(...nodes);
        },

        leaveNodes: function(nodes)
        {
            leaveNodes.push(...nodes);
        },

        onWillEnter: function(cb)
        {
            onWillEnter = cb;
        },

        onDidLeave: function(cb)
        {
            onDidLeave = cb;
        },

        start,
        finish,
    }
}

/**
 * Transition Options
 * @typedef TransitionOptions
 * @property {(model:object, context:object) => any} options.value The value callback that triggers the animation when it changes
 * @property {string} [options.mode] Transition order - concurrent, enter-leave or leave-enter
 * @property {name} [options.name] Transition name - used as prefix to CSS class names, default = "tx"
 * @property {object} [options.classNames] A map of class name mappings
 * @property {number} [options.duration] The duration of the animation in milliseconds
 * @property {boolean} [options.subtree] Whether to monitor the element's sub-trees for animations
 */

/** Declares addition settings transition directives
 * @param {{TransitionOptions | string | Function}[]} options
 */
function transition(...options)
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
    };

    // Attach transition constructor
    fnValue.withTransition = function(context)
    {
        // Construct the transition
        if (options.type)
            return new options.type(options, context);
        else
            return TransitionCss(options, context);
    };

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

class TemplateBuilder
{
    constructor(type)
    {
        this.$node = { type };
    }

    append(...items)
    {
        items = items.flat(1000).map(x => x.$node ?? x);
        if (this.$node.$)
            this.$node.$.push(...items);
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
            return Reflect.get(object, "$proxy");        }
    }
};

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
};

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
    };
    fnAppend.$tb = tb;
    fnAppend.$node = tb.$node;
    fnAppendProxy = new Proxy(fnAppend, AppendProxy);
    fnAppend.$proxy = fnAppendProxy;
    return fnAppendProxy;
}

constructTemplateBuilder.html = html;
constructTemplateBuilder.encode = htmlEncode;

// Export the proxied template builder
let $ = new Proxy(constructTemplateBuilder,  RootProxy);

/**
 * Implements a simple notification and broadcast service
 */
function Notify()
{
    let objectListenerMap = new WeakMap();
    let valueListenerMap = new Map();

    function resolveMap(sourceObject)
    {
        return sourceObject instanceof Object ? 
            objectListenerMap : valueListenerMap
    }


    /**
     * Adds a listener for a source object
     */
    function addListener(sourceObject, handler)
    {
        if (!sourceObject)
            return;
        let map = resolveMap(sourceObject);
        let listeners = map.get(sourceObject);
        if (!listeners)
            listeners = map.set(sourceObject, [handler]);
        else
            listeners.push(handler);
    }

    // Remove a listener for a source object
    function removeListener(sourceObject, handler)
    {
        if (!sourceObject)
            return;
        let map = resolveMap(sourceObject);
        let listeners = map.get(sourceObject);
        if (listeners)
        {
            let index = listeners.indexOf(handler);
            if (index >= 0)
            {
                listeners.splice(index, 1);
            }
        }
    }

    // Fire a listener for a source object
    function fire(sourceObject)
    {
        if (!sourceObject)
            return;
        let map = resolveMap(sourceObject);
        let listeners = map.get(sourceObject);
        if (listeners)
        {
            for (let i=listeners.length-1; i>=0; i--)
            {
                listeners[i].apply(null, arguments);
            }
        }
    }

    fire.addEventListener = addListener;
    fire.removeEventListener = removeListener;
    return fire;
}

// Default instance of update manager
let notify = new Notify();

/** @internal */
class BrowserEnvironment extends Environment
{
    constructor()
    {
        super();
        this.browser = true;    
        this.document = document;
        this.window = window;
        this.hydrateMounts = document.head.querySelector("meta[name='co-ssr']") ? [] : null;
        this.pendingStyles = "";
    }

    declareStyle(css)
    {
        if (css.length > 0)
        {
            this.pendingStyles += "\n" + css;
            if (!this.hydrateMounts)
                this.window.requestAnimationFrame(() => this.mountStyles());
        }
    }

    mountStyles()
    {
        if (this.pendingStyles.length == 0)
            return;

        if (!this.styleNode)
            this.styleNode = document.createElement("style");

        this.styleNode.innerHTML += this.pendingStyles + "\n";
        this.pendingStyles = "";

        if (!this.styleNode.parentNode)
            document.head.appendChild(this.styleNode);
    }

    doHydrate()
    {
        nextFrame(async () => {

            while (true)
            {
                // Wait for pending loads
                await this.untilLoaded();

                // Wait for pending frames
                if (anyPendingFrames())
                {
                    await new Promise((resolve) => postNextFrame(resolve));
                }
                else
                    break;  
            }

            // On the next frame
            postNextFrame(() => {

                // Remove all ssr rendered content
                document.querySelectorAll(".cossr").forEach(x => x.remove());

                // Mount components
                let mounts = this.hydrateMounts;
                this.hydrateMounts = null;
                mounts.forEach(x => {
                    removeSsrNodes(x.el),
                    this.mount(x.component, x.el);
                });

                // Mount pending styles
                removeSsrNodes(document.head);
                this.mountStyles();

            });
        }, Number.MAX_SAFE_INTEGER);
    }

    mount(component, el)
    {
        if (typeof(el) === 'string')
        {
            el = document.querySelector(el);
        }

        if (this.hydrateMounts)
        {
            this.hydrateMounts.push({ el, component });
            if (this.hydrateMounts.length == 1)
                this.doHydrate();
        }
        else
        {
            el.append(...component.rootNodes);
            component.setMounted(true);
        }
    }
    unmount(component)
    {
        if (component.created)
            component.rootNodes.forEach(x => x. remove());
        component.setMounted(false);
    }

    async fetchTextAsset(path)
    {
        let res = await fetch(path);
        if (!res.ok)
            throw new Error(`Failed to fetch '${path}': ${res.status} ${res.statusText}`);
        return res.text();
    }

}


if (typeof(document) !== "undefined")
{
    let env = new BrowserEnvironment();
    setEnvProvider(() => env);
}

function removeSsrNodes(el)
{
    let c = el.firstChild;
    let inSsr = false;
    while (c)
    {
        let next = c.nextSibling;

        if (c.nodeType == 8 && c.data == "co-ssr-start")
            inSsr = true;

        if (inSsr)
            c.remove();

        if (c.nodeType == 8 && c.data == "co-ssr-end")
            inSsr = false;

        c = next;
    }
}

export { $, BrowserEnvironment, CloakedValue, Component, Environment, HtmlString, Notify, Style, TransitionCss, anyPendingFrames, cloak, compileTemplate, css, html, htmlEncode, input, nextFrame, notify, postNextFrame, setEnvProvider, transition };
