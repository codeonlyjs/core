/** Contains a HTML string
 */
export class HtmlString
{
    /** Constructs a new HtmlString object
     * @param {string} html The HTML string
     */
    constructor(html)
    {
        this.html = html;
    }

    /** The HTML string 
     * @type {string}
     */
    html;
    
    static areEqual(a, b)
    {
        return (
            a instanceof HtmlString &&
            b instanceof HtmlString &&
            a.html == b.html
        );
    }
}

/** Marks a string as being HTML instead of plain text
 * 
 * Normally strings passed to templates are treated as plain text.  Wrapping
 * a value in html() indicates the string should be treated as HTML instead.
 * 
 * @param {string | (...args: any[]) => string} html The HTML value to be wrapped, or a function that returns a string
 * @returns {HtmlString}
 */
export function html(html)
{
    if (html instanceof Function)
    {
        return (...args) => {
            return new HtmlString(html(...args));
        }
    }
    else
    {
        return new HtmlString(html);
    }
}
