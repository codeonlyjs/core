import { CharacterData } from "./CharacterData.js";

export class Text extends CharacterData
{
    constructor(document, data, raw)
    {
        super(document, data, raw);
    }

    get nodeType() { return 3; }
    get nodeName() { return "#text"; }
    
    cloneNode(deep) 
    {
        return new Text(this.document, this); 
    }
    
    render(w)
    {
        w.write(this.raw);
    }
}