import { CharacterData } from "./CharacterData.js";

export class Comment extends CharacterData
{
    constructor(document, data, raw)
    {
        super(document, data, raw);
    }

    get nodeType() { return 8; }
    get nodeName() { return "#comment"; }

    cloneNode(deep) 
    {
        return new Comment(this.document, this); 
    }

    render(w)
    {
        w.write("<!--");
        w.write(this.raw);
        w.write("-->");
    }
}