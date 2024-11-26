import { EnvironmentBase, setEnvProvider } from "./Environment.js";
import { nextFrame, postNextFrame, anyPendingFrames } from "./nextFrame.js";
import { compileTemplate } from "./TemplateCompiler.js";

export class BrowserEnvironment extends EnvironmentBase
{
    constructor()
    {
        super();
        this.compileTemplate = compileTemplate;
        this.browser = true;    
        this.document = document;
        this.window = window;
        this.hydrateMounts = (document.querySelectorAll(".cossr").length > 0) ? [] : null;
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

                // Mount pending styles
                this.mountStyles();

                // Mount components
                let mounts = this.hydrateMounts;
                this.hydrateMounts = null;
                mounts.forEach(x => this.mount(x.component, x.el));

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
}


if (typeof(document) !== "undefined")
{
    let env = new BrowserEnvironment();
    setEnvProvider(() => env);
}

