import { Environment, setEnvProvider } from "./Environment.js";
import { nextFrame, postNextFrame, anyPendingFrames } from "./nextFrame.js";

/** @internal */
export class BrowserEnvironment extends Environment
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
                this.mountStyles();
        }
    }

    mountStyles()
    {
        if (this.pendingStyles.length == 0)
            return;

        if (!this.styleNode)
        {
            this.styleNode = document.createElement("style");
            document.head.appendChild(this.styleNode);
        }

        this.styleNode.innerHTML += this.pendingStyles + "\n";
        this.pendingStyles = "";
    }

    onLoaded()
    {
        // Remove all ssr rendered content
        document.querySelectorAll(".cossr").forEach(x => x.remove());

        // Mount components
        let mounts = this.hydrateMounts;
        this.hydrateMounts = null;
        mounts.forEach(x => {
            removeSsrNodes(x.el),
            this.mount(x.component, x.el)
        });

        // Mount pending styles
        removeSsrNodes(document.head);
        this.mountStyles();

        // Now fire environment loaded events
        super.onLoaded();
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