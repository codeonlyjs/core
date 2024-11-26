export function CodeBuilder()
{
    let lines = [];
    let indentStr = "";
    let enableSplit = true;
    function append(...code)
    {
        for (let i=0; i<code.length; i++)
        {
            let part = code[i];
            if (part.lines)
            {
                // Appending another code builder
                lines.push(...part.lines.map(x => indentStr + x));
            }
            else if (Array.isArray(part))
            {
                lines.push(...part.filter(x => x != null).map(x => indentStr + x));
            }
            else
            {
                if (enableSplit)
                    lines.push(...part.split("\n").map(x => indentStr + x));
                else
                    lines.push(indentStr + part);
            }
        }
    }
    function indent()
    {
        indentStr += "  ";
    }
    function unindent()
    {
        indentStr = indentStr.substring(2);
    }
    function toString()
    {
        return lines.join("\n") + "\n";
    }
    function braced(cb)
    {
        append("{");
        indent();
        cb(this);
        unindent();
        append("}");
    }

    return {
        append,
        indent,
        unindent,
        braced,
        toString,
        lines,
        enableSplit(enable) { enableSplit = enable },
        get isEmpty() { return lines.length == 0; },
    }
}
