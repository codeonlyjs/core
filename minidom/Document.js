import { HTMLElement } from "./HTMLElement.js";
import { Text } from "./Text.js";
import { Comment } from "./Comment.js";
import { querySelector } from "./parseSelector.js";
import { parseHtml } from "./parseHtml.js";

export class Document extends HTMLElement
{
    constructor()
    {
        super();
        let doc = parseHtml(this, "<html><head></head><body></body></html>")
        this.append(...doc);
    }

    get nodeType() { return 9; }
    get nodeName() { return "#document"; }
    get body() { return querySelector(this, "body"); }
    get head() { return querySelector(this, "head"); }

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


