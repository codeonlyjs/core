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
    
    /** 
     * Compares two values and returns true if they
     * are both HtmlString instances and both have the
     * same inner `html` value.
     * @param {any} a The first value to compare
     * @param {any} b The second value to compare
     * @returns {boolean}
     */
    static areEqual(a, b)
    {
        return (
            a instanceof HtmlString &&
            b instanceof HtmlString &&
            a.html == b.html
        );
    }
}

/** 
 * Marks a string as being raw HTML instead of plain text
 * 
 * Normally strings passed to templates are treated as plain text.  Wrapping
 * a value by calling this function indicates the string should be treated as 
 * raw HTML instead.
 * 
 * See [Text and HTML](templateText) for more information.
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
