import { Html } from "./Html.js";

export class TemplateLiteralBuilder
{
    #str = "`";

    text(text)
    {
        this.raw(Html.encode(text));
    }

    raw(text)
    {
        this.#str += text.replace(/[\\`]/g, "\\$&");
    }

    expr(expr)
    {
        this.#str += "${" + expr + "}";
    }

    resolve()
    {
        let r = this.#str + "`";
        this.#str = "`"
        return r;
    }
}