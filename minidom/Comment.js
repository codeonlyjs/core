import { CharacterData } from "./CharacterData.js";

export class Comment extends CharacterData
{
    constructor(document, data, raw, noRender)
    {
        super(document, data, raw);
        this.#noRender = noRender;
    }

    get nodeType() { return 8; }
    get nodeName() { return "#comment"; }

    #noRender;

    cloneNode(deep) 
    {
        return new Comment(this.document, this, false, noRender); 
    }

    render(w)
    {
        if (!this.#noRender)
        {
            w.write("<!--");
            w.write(this.raw);
            w.write("-->");
        }
    }
}