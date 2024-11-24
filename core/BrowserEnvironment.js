import { EnvironmentBase, setEnvironment } from "./Environment.js";
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
    }

    mount(component, el)
    {
        if (typeof(el) === 'string')
        {
            el = document.querySelector(el);
        }
        el.append(...component.rootNodes);
        component.setMounted(true);
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
    setEnvironment(env);
}

