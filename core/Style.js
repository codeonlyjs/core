export class Style
{
    static declare(css)
    {
        coenv.declareStyle(css);
    }
}


export function css(strings, values)
{
    let r = "";
    for (let i=0; i<strings.length - 1; i++)
    {
        r += strings[i];
        r += arguments[i + 1];
    }
    r += strings[strings.length - 1];
    Style.declare(r);
}