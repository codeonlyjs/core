import { Node } from "./Node.js"
import { CharacterData } from "./CharacterData.js";

export class Element extends Node
{
    constructor(document, nodeName)
    {
        super(document);
        this.#nodeName = nodeName;
    }

    #nodeName;
    #childNodes = [];
    #attributes = new Map();

    get nodeType() { return 1; }
    get nodeName() { return this.#nodeName; }
    get childNodes() { return this.#childNodes; }
    get rawAttributes() { return this.#attributes; }
    get hasChildNodes() { return this.#childNodes.length > 0; }
    get id() { return this.#attributes.get("id") ?? "" }

    render(w)
    {
        w.write("<");
        w.write(this.nodeName);

        if (this.attributes)
        {
            for (let [key,value] of this.attributes)
            {
                w.write(" ");
                w.write(key);
                w.write("=\"");
                w.write(value.raw);
                w.write("\"");
            }
        }
        
        if (this.#childNodes)
        {
            w.write(">");
            this.#childNodes.forEach(x => x.render(w));
            w.write("</");
            w.write(this.nodeName);
            w.write(">");
        }
        else
        {
            w.write("/>");
        }
    }

    setAttribute(name, value, raw)
    {
        this.#attributes.set(name, new CharacterData(null, value, raw));
    }
    getAttribute(name)
    {
        let att = this.#attributes.get(name);
        if (!att)
            return null;
        return att.data;
    }

    append(...nodes)
    {
        this.insertNodesBefore(nodes, null);
    }

    insertBefore(node, before)
    {
        this.insertNodesBefore([ node ], before);
    }

    insertNodesBefore(nodes, before)
    {
        // Remove nodes from other parents
        nodes.forEach(x => {
            x.remove();
            x._setParentNode(this);
        });

        // Work out where to insert
        let index = this.#childNodes.indexOf(before);
        if (index < 0)
            index = this.#childNodes.length;

        // Insert into this node
        this.#childNodes.splice(index, 0, ...nodes);
    }

    removeChild(node)
    {
        let index = this.#childNodes.indexOf(node);
        if (index < 0)
            throw new Error("node a child");

        this.#childNodes.splice(index, 1);
        node._setParentNode(null);
    }

    appendChild(node)
    {
        this.insertNodesBefore([node], null);
    }


}