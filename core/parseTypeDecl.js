export function parseTypeDecl(str)
{
    // Type first
    let mType = str.match(/\s*([^ \t.#]*)/);
    if (!mType)
        return {};

    str = str.substring(mType[0].length);

    let classes = [];
    let result = {
        type: mType[1],
    }
    for (let a of str.matchAll(/\s*([.#]?)([^ \t=.#]+)(?:\s*=\s*(\'[^']+\'|\S+))?/g))
    {
        if (!a[3])
        {
            if (a[1] == '.')
            {
                classes.push(a[2]);
                continue;
            }
            else if (a[1] == '#')
            {
                result.id = a[2];
                continue;
            }
        }

        // Work out attribute name
        let attrName = a[2];
        if (attrName == "type")
            attrName = "attr_type";

        // Work out attribute value
        let val = a[3] ?? a[2];

        // Trim quotes
        if ((val.startsWith("'") && val.endsWith("'")) || 
            (val.startsWith("\"") && val.endsWith("\"")))
        {
            val = val.substring(1, val.length - 1);
        }

        result[attrName] = val;
    }

    if (classes.length > 0)
        result.class = classes.join(" ");
    
    return result;
}

