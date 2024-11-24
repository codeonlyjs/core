let rxSel = /(\s+)|(?:(#?)(\.?)([-_a-zA-Z0-9]+))/y

export function parseSelector(sel)
{
    let selectors = [];
    let m;
    let s;
    let pos;
    while (m = rxSel.exec(sel))
    {
        pos = rxSel.lastIndex;

        // Whitespace?
        if (m[1])
        {
            if (s)
            {
                s = null;
            }
            continue;
        }

        if (!s)
        {
            s = { };
            selectors.push(s);
        }
        if (m[2])
            s.id = m[4];
        else if (m[3])
        {
            if (!s.class)
                s.class = [ m[4] ];
            else
                s.class.push(m[4]);
        }
        else
            s.tag = m[4].toLowerCase();
    }
    if (pos != sel.length)
        throw new Error(`Invalid or unsupported selector: '${sel}'`);
    return selectors;
}

// Check if an element matches a selector spec
function doesMatch(element, selector)
{
    if (selector.tag && element.nodeName.toLowerCase() != selector.tag)
        return false;
    if (selector.id && element.id != selector.id)
        return false;
    if (selector.class)
    {
        for (let c of selector.class)
        {
            if (!element.classList.has(c))
                return false;
        }
    }
    return true;
}


function querySelectorInternal(elementIn, selsIn, firstOnly)
{
    if (typeof(selsIn) === 'string')
        selsIn = parseSelector(selsIn);
        
    let result = [];
    qsa(elementIn, selsIn);
    return firstOnly ? result[0] : result;

    function qsa(element, sels)
    {
        for (let n of element.childNodes)
        {
            // Ignore non-elements
            if (n.nodeType != 1)
                continue;

            // If matches, match children on nested selectors
            if (doesMatch(n, sels[0]))
            {
                if (sels.length == 1)
                {
                    result.push(n);
                    if (firstOnly)
                        return true;
                }
                else
                    qsa(n, sels.slice(1));
            }
            
            // Recurse
            if (qsa(n, sels))
                return true;
        }   
        return false;
    }
}

export function querySelectorAll(element, sel)
{
    return querySelectorInternal(element, sel, false);
}

export function querySelector(element, sel)
{
    return querySelectorInternal(element, sel, true);
}
