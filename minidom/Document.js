import { HTMLElement } from "./HTMLElement.js";
import { Text } from "./Text.js";
import { Comment } from "./Comment.js";
import { parseHtml } from "./parseHtml.js";

export class Document extends HTMLElement
{
    constructor(html)
    {
        super();
        let doc = parseHtml(this, html ?? "<html><head></head><body></body></html>")
        this.append(...doc);
    }

    get nodeType() { return 9; }
    get nodeName() { return "#document"; }
    get body() { return this.querySelector("body"); }
    get head() { return this.querySelector("head"); }

    createElement(tagName)
    {
        return new HTMLElement(this, tagName);
    }
    createTextNode(data, raw)
    {
        return new Text(this, data, raw);
    }
    createComment(data, raw)
    {
        return new Comment(this, data, raw);
    }
}


