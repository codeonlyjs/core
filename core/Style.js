import { getEnv } from "./Environment.js";

let allStyles = [];
let pendingStyles = [];
let styleNode = null;

export class Style
{
    static declare(css)
    {
        allStyles.push(css);
        pendingStyles.push(css);
        if (getEnv().browser)
            getEnv().window.requestAnimationFrame(mountStyles);
    }

    static get all()
    {
        return allStyles.join("\n");
    }
}

function mountStyles()
{
    // Quit if nothing to do
    if (pendingStyles.length == 0)
        return;
    
    // First time, create style element
    if (styleNode == null)
        styleNode = document.createElement("style");

    // Append and new pending styles
    styleNode.innerHTML += pendingStyles.join("\n");
    pendingStyles = [];

    // Mount the node
    if (!styleNode.parentNode)
        document.head.appendChild(styleNode);
}

export function css(strings, values)
{
    let r = "";
    for (let i=0; i<strings.length - 1; i++)
    {
        r += strings[i];
        r += arguments[i + 1];
    }
    r += strings[strings.length - 1];
    Style.declare(r);
}