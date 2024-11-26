import { EnvironmentBase } from "../core/Environment.js";
import { compileTemplate } from "../core/TemplateCompiler.js";
import { untilLoaded } from "../core/Utils.js";
import { Window } from "../minidom/index.js";

export class SSREnvironment extends EnvironmentBase
{
    constructor(options)
    {
        super();
        this.compileTemplate = compileTemplate;
        this.ssr = true;
        this.#window = new Window();
        this.#window.blockAnimationFrames = true;
        this.mounts = {};
        this.styles = "";
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
}

