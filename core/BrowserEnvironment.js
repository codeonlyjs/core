import { EnvironmentBase, setEnvProvider } from "./Environment.js";
import { nextFrame, postNextFrame, anyPendingFrames } from "./nextFrame.js";

export class BrowserEnvironment extends EnvironmentBase
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
                    this.mount(x.component, x.el)
                });

                // Mount pending styles
                removeSsrNodes(document.head);
                this.mountStyles();

            })
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