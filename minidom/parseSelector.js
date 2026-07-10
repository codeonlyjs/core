let rxSel = /(\s*,\s*)|(\s+)|(?:(#?)(\.?)([-_a-zA-Z0-9]+))/y

export function parseSelector(sel)
{
    let chain = null;
    let selectors = [];
    let m;
    let s;
    let pos;
    while (m = rxSel.exec(sel))
    {
        pos = rxSel.lastIndex;

        if (m[1])
        {
            chain = null;
            s = null;
            continue;
        }

        // Whitespace?
        if (m[2])
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
            if (!chain)
            {
                chain = [];
                selectors.push(chain);
            }
            chain.push(s);
        }
        if (m[3])
            s.id = m[5];
        else if (m[4])
        {
            if (!s.class)
                s.class = [ m[5] ];
            else
                s.class.push(m[5]);
        }
        else
            s.tag = m[5].toLowerCase();
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
    let activeChains = [...selsIn];

    walk(elementIn);

    return result;

    function walk(element)
    {
        for (let n of element.childNodes)
        {
            // Ignore non-elements
            if (n.nodeType != 1)
                continue;

            // Process all active chains, creating new active
            // chains with the tails of any partial matches
            let newChains = null;
            for (let chain of activeChains)
            {
                if (doesMatch(n, chain[0]))
                {
                    if (chain.length == 1)
                    {
                        result.push(n);
                        if (firstOnly)
                            return true;
                    }
                    else
                    {
                        if (!newChains)
                            newChains = [];
                        newChains.push(chain.slice(1));
                    }
                }
            }

            // Setup new active chain list for child nodes
            let save = activeChains;
            if (newChains)
                activeChains = [...activeChains, ...newChains]

            // Recurse
            if (walk(n))
                return true;

            // Restore active chains
            activeChains = save;
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
    return querySelectorInternal(element, sel, true)[0];
}
