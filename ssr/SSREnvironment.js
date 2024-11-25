import { EnvironmentBase } from "../core/Environment.js";
import { compileTemplate } from "../core/TemplateCompiler.js";
import { Window } from "../minidom/index.js";

export class SSREnvironment extends EnvironmentBase
{
    constructor(options)
    {
        super();
        this.compileTemplate = compileTemplate;
        this.ssr = true;
        this.#window = new Window();
        this.mounts = {};
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
}

