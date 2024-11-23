import { EnvironmentBase, setEnvironment } from "./Environment.js";
import { compileTemplate } from "./TemplateCompiler.js";

export class BrowserEnvironment extends EnvironmentBase
{
    constructor()
    {
        super();
        this.browser = true;
        this.document = document;
        this.compileTemplate = compileTemplate;
        this.window = window;
        this.requestAnimationFrame = window.requestAnimationFrame.bind(window);
        this.Node = Node;
    }
}


if (typeof(document) !== "undefined")
{
    let env = new BrowserEnvironment();
    setEnvironment(env);
}

