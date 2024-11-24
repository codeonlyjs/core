import { Node } from "./Node.js";

export class CharacterData extends Node
{
    constructor(document, data, isRaw)
    {
        super(document)
        
        // Cloning?
        if (data instanceof CharacterData)
        {
            if (data.isRaw)
                this.#raw = data.raw;
            else
                this.#data = data.data;
        }
        else
        {
            if (isRaw)
                this.#raw = data;
            else
                this.#data = data;
        }
    }

    #raw;
    #data;

    get isRaw() 
    { 
        return !!this.#raw 
    }

    get raw()
    {
        if (this.#raw)
            return this.#raw;
        else
            return CharacterData.encode(this.#data);
    }
    get data() 
    { 
        if (this.#raw)
            return CharacterData.decode(this.#raw);
        else
            return this.#data; 
    }
    get length() { return this.data.length; }
    get nodeValue() { return this.data; }
    set nodeValue(value) 
    { 
        this.#raw = undefined;
        this.#data = value; 
    }

    static encode(str)
    {
        if (str === null || str === undefined)
            return "";
        return (""+str).replace(/["'&<>]/g, function(x) {
            switch (x) 
            {
                case '\"': return '&quot;';
                case '&': return '&amp;';
                case '\'':return '&#39;';
                case '<': return '&lt;';
                case '>': return'&gt;';
            }
        });
    }

    static names = {
        "quot": "\"",
        "amp": "&",
        "lt": "<",
        "gt": ">",
    }

    static decode(str)
    {
        if (str === null || str === undefined)
            return "";
        return (""+str).replace(/&(?:#[xX]([a-fA-F0-9]+)|#([0-9]+)|([-a-zA-Z]+));/g, function(x, hex, dec, name) {
            if (hex)
                return String.fromCharCode(parseInt(hex, 16));
            if (dec)
                return String.fromCharCode(parseInt(dec));
            return CharacterData.names[name] ?? x;
        });
    }

}