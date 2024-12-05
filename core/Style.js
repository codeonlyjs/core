/** Utility functions for working with CSS styles
 */
export class Style
{
    /** Declares a CSS style string to be added to the `<head>` block
     * @param {string} css The CSS string to be added
     * @returns {void}
     */
    static declare(css)
    {
        coenv.declareStyle(css);
    }
}

/** Declares a CSS style string to be added to the `<head>` block
 * 
 * This function is intended to be used as a template literal tag
 * @param {string[]} strings The CSS to be added
 * @param {string[]} values The interpolated string values
 * @returns {void}
 */
export function css(strings, values)
{
    let r = "";
    for (let i=0; i<strings.length - 1; i++)
    {
        r += strings[i];
        r += values[i];
    }
    r += strings[strings.length - 1];
    Style.declare(r);
}