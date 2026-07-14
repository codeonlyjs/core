import fs from "node:fs/promises";
import path from "node:path";
import { Environment } from "../core/Environment.js";
import { untilLoaded } from "../core/Utils.js";
import { Window } from "../minidom/api.js";

/** @internal */
export class SSREnvironment extends Environment
{
    constructor(options)
    {
        super();
        this.options = options;
        this.ssr = true;
        this.#window = new Window(options.entryHtml);
        this.#window.blockAnimationFrames = true;
        this.mountList = [];
        this.styles = "";
    }
    
    /** @type {any} */
    get fs()
    {
        return fs;
    }

    #window;
    /** @type {any} */
    get window()
    {
        return this.#window;
    }

    /** @type {any} */
    get document()
    {
        return this.window.document;
    }

    #styleNode = null;
    declareStyle(css)
    {
        if (css.length)
            this.styles += css + '\n';

        if (!this.options.cssUrl)
        {
            if (!this.#styleNode)
            {
                this.#styleNode = document.createElement("style");
                this.document.head.append(
                    this.document.createComent("co-ssr-start"),
                    this.#styleNode,
                    this.document.createComent("co-ssr-end")
                );
            }

            this.#styleNode.innerHTML += css + "\n";
        }
    }

    mount(component, el)
    {
        if (typeof(el) !== 'string')
            throw new Error("Components must be mounted against a selector string in SSR environments");

        let elem = this.document.querySelector(el);
        if (!elem)
            throw new Error(`Mount point ${el} not found`);

        // Mount
        elem.append(
            this.document.createComment("co-ssr-start"),
            ...component.rootNodes,
            this.document.createComment("co-ssr-end")
        );
        component.setMounted(true);

        // Track it
        this.mountList.push(component);
    }

    unmount(component)
    {
        let index = this.mountList.indexOf(component);
        if (index < 0)
            return;

        if (component.created)
            component.rootNodes.forEach(x => x. remove());
        component.setMounted(false);

        this.mountList.splice(index, 1);
    }

    unmountAll()
    {
        for (let c of [...this.mountList])
            this.unmount(c);
    }

    async whileBusy()
    {
        while (true)
        {
            // Wait for loading event
            if (this.loading)
                await untilLoaded(this);

            // Dispatch any pending animation frames
            if (this.#window.dispatchAnimationFrames())
                continue;
            
            break;
        }
    }

    async fetchTextAsset(pathname)
    {   
        pathname = path.join(this.options?.assetBase ?? process.cwd(), "." + pathname);
        return fs.readFile(pathname, "utf8");
    }
}

