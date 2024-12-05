import { Document } from "../minidom/index.js";

/** @internal */
export class HtmlInjector
{
    constructor(html)
    {
        this.html = html;
        this.dom = new Document(html);
        this.insertMap = new Map();
    }

    // Given a object map of { selector: [ html ] }
    // create the final html by inserting each html
    // piece at the specified selector
    inject(injections)
    {
        // Find index of each insert
        let insList = [];
        for (let k of Object.keys(injections))
        {
            let index = this.insertMap.get(k);
            if (index === undefined)
            {
                let el = this.dom.querySelector(k);
                if (!el)
                    throw new Error(`HTML inject failure, can't find selector "${k}"`);
                index = el.sourcePos.innerEnd;
                this.insertMap.set(k, index);
            }
            insList.push({ index, html: injections[k] });
        }

        // Sort
        insList.sort((a,b) => a.index - b.index);

        // Build final html
        let html = "";
        let pos = 0;
        for (let i of insList)
        {
            html += this.html.substring(pos, i.index);
            html += i.html.join("");
            pos = i.index;
        }
        html += this.html.substring(pos);

        return html;
    }
}