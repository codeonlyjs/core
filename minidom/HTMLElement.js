import { Element } from "./Element.js"
import { ClassList } from "./ClassList.js";
import { StyleList } from "./StyleList.js";
import { parseHtml } from "./parseHtml.js";

export class HTMLElement extends Element
{
    constructor(document, nodeName)
    {
        super(document, nodeName);
    }

    cloneNode(deep) 
    {
        // Create node
        let newNode = new HTMLElement(this.document, this.nodeName);

        // Clone attributes
        for (let [k,v] of this.rawAttributes)
            newNode.setAttribute(k,v);

        // Clone child nodes
        if (deep)
        {
            this.childNodes.forEach(x => {
                newNode.appendChild(x.cloneNode(true));
            });
        }

        // Return cloned node
        return newNode;
    }

    get innerHTML()
    {
        let inner = super._getInner();
        if (inner)
            return inner;
        return this.childNodes.map(x => x.html).join("");
    }

    set innerHTML(value)
    {
        super._setInner(value);
    }

    get textContent()
    {
        let buf = "";
        for (let ch of this.childNodes)
        {
            switch (ch.nodeType)
            {
                case 1:
                    buf += ch.textContent;
                    break;
                
                case 3:
                    buf += ch.nodeValue;
                    break;
            }
        }
        return buf.replace(/\s+/g, ' ');
    }

    set textContent(value)
    {
        // Remove all child nodes
        this.childNodes.forEach(x => x.remove());

        // Set inner text
        this.append(this.document.createTextNode(value));
    }

    #classList;
    get classList()
    {
        if (!this.#classList)
            this.#classList = new ClassList(this);
        return this.#classList;
    }

    #style;
    get style()
    {
        if (!this.#style)
            this.#style = new StyleList(this);
        return this.#style;
    }

}