export class HtmlString
{
    constructor(html)
    {
        this.html = html;
    }
    
    static areEqual(a, b)
    {
        return (
            a instanceof HtmlString &&
            b instanceof HtmlString &&
            a.html == b.html
        );
    }
}

export function html(html)
{
    return new HtmlString(html);
}
