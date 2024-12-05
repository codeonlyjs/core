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
        this.#window = new Window();
        this.#window.blockAnimationFrames = true;
        this.mounts = {};
        this.styles = "";
    }

    get fs()
    {
        return fs;
    }

    #window;
    get window()
    {
        return this.#window;
    }

    get document()
    {
        return this.window.document;
    }

    declareStyle(css)
    {
        if (css.length)
            this.styles += css + '\n';
    }

    mount(component, el)
    {
        if (typeof(el) !== 'string')
            throw new Error("Components must be mounted against a selector string in SSR environments");
        component.create();
        this.mounts[el] = component;
    }

    unmount()
    {
        throw new Error("Unmounting components not supported in SSR environment");
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

