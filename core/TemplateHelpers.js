import { HtmlString } from "./HtmlString.js";
import { htmlEncode } from "./htmlEncode.js";
import { input } from "./input.js";

/** @internal */
export class TemplateHelpers 
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
            style += ";"
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
        style += ";"
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

            if (coenv.browser && getValue.withTransition && node.isConnected)
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

    static addEventListener(provideContext, el, eventName, handler)
    {
        function wrapped_handler(ev)
        {
            let ctx = provideContext();
            return handler(ctx.model, ev, ctx);
        }

        el.addEventListener(eventName, wrapped_handler);

        return function() { el.removeEventListener(eventName, wrapped_handler); }
    }

    static input() 
    { 
        return input(...arguments); 
    };
      
}

