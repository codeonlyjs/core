import { CodeBuilder } from "../core/CodeBuilder.js"
import { Document } from "../minidom/Document.js"
import { parseHtml } from "./parseHtml.js"

let rxLiteral = /^(?:pre|textarea|script|style)$/
let rxBlock = /^(?:address|article|aside|blockquote|body|canvas|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|head|header|hr|html|li|link|main|meta|nav|noscript|ol|p|pre|script|section|style|table|tfoot|title|ul|video)$/

export function prettyHtml(root)
{
    if (typeof(root) === "string")
        root = parseHtml(new Document(), root);
    if (!Array.isArray(root))
        root = [ root ];
    

    let cb = CodeBuilder();
    cb.enableSplit(false);
    let lineBuf = "";

    let w = { write: append };

    // Write the root node
    root.forEach(x => writeNode(x));
    newline();
    return cb.toString();

    function writeNode(n)
    {
        switch (n.nodeType)
        {
            case 1:
                writeElement(n);
                break;

            case 3:
                // text
                append(n.raw);
                break;

            case 8:
                // comment
                append(`<!--${n.raw}-->`);
                break;

            case 9:
                // document
                writeNode(n.documentElement);
                break;
        }
    }

    function writeElement(n)
    {
        let isBlock = n.nodeName.match(rxBlock);

        // Literal blocks (script, style etc...)
        if (n.nodeName.match(rxLiteral))
        {
            if (isBlock)
                newline();

            let innerBlock = n.nodeName == 'script' || n.nodeName == 'style';

            append(`<${n.nodeName}`);
            n.renderAttributes(w);
            append(`>`);

            if (n.hasChildNodes)
            {
                if (innerBlock)
                {
                    let content = n.childNodes.map(x => x.raw).join("");
                    content = removeCommonLeadingWhitespace(content);
                    if (!content.match(/^\s*$/))
                    {
                        newline();
                        cb.enableSplit(true);

                        append(content);

                        newline();
                        cb.enableSplit(false);
                    }
                }
                else
                {
                    for (let c of n.childNodes)
                    {   
                        c.render(w);
                    }
                }
            }
            append(`</${n.nodeName}>`);
            if (isBlock)
                newline();
            return;
        }
        
        // Inline block, render as is....
        if (!isBlock)
        {
            n.render(w);
            return;
        }

        let allInline = n.childNodes.every(x => !isBlockNode(x));
        if (allInline)
        {
            n.render(w);
            return;
        }

        // Split whitespace
        splitWhitespace(n);

        // Trim leading/trailing inner whitespace
        let start = n.childNodes.findIndex(x => !isWhitespaceNode(x));
        let end = n.childNodes.findLastIndex(x => !isWhitespaceNode(x));

        // Block
        newline();
        append(`<${n.nodeName}`);
        n.renderAttributes(w);

        // Child nodes?
        if (!n.hasChildNodes || start == -1)
        {
            append(`></${n.nodeName}>`);       // No block elements are self closing, so this is fine
            newline();
            return;
        }

        append(`>`);

        newline();
        cb.indent();

        // Get nodes
        let nodes = n.childNodes.slice(start, end + 1);

        // Remove all whitespace nodes either immediately before, or immediately after
        // a block node
        for (let i=0; i<nodes.length; i++)
        {
            if (isBlockNode(nodes[i]))
            {
                while (i > 0 && isWhitespaceNode(nodes[i-1]))
                {
                    nodes.splice(i-1, 1);
                    i--;
                }
                while (i+1 < nodes.length && isWhitespaceNode(nodes[i+1]))
                {
                    nodes.splice(i+1, 1);
                }
            }
        }

        for (let i = 0; i<nodes.length; i++)
        {   
            let prevIsBlock = isBlockNode(nodes[i-1]);
            let thisIsBlock = isBlockNode(nodes[i]);
            let nextIsBlock = isBlockNode(nodes[i+1]);
            
            if (prevIsBlock || thisIsBlock)
                newline();

            writeNode(nodes[i]);

            if (thisIsBlock || nextIsBlock)
                newline();
        }


        newline();
        cb.unindent();
        append(`</${n.nodeName}>`);
        newline();
    }

    function isBlockNode(n)
    {
        if (!n)
            return true;        // Start end of child list can be considered block
        if (n.nodeType != 1)
            return false;
        return !!n.nodeName.match(rxBlock);
    }



    // Helper to append text to current line buffer
    function append(line)
    {
        lineBuf += line;
    }

    // Flush the current line buffer, ensuring we're at the start of a new line
    function newline()
    {
        if (lineBuf.length)
        {
            cb.append(lineBuf)
            lineBuf = "";
        }
    }
}

function splitWhitespace(parent)
{
    for (let i=0; i<parent.childNodes.length; i++)
    {
        let n = parent.childNodes[i];
        if (n.nodeType == 3)
        {
            let parts = splitStringOnWhitespace(n.raw);
            if (parts.length > 1)
            {
                let newNodes = parts.map(x => parent.document.createTextNode(x, true));
                n.replaceWith(...newNodes);
                i += newNodes.length - 1;
            }
        }
    }
}

function isWhitespace(ch)
{
    return ch == ' ' || ch == '\t' || ch == '\n' || ch == '\r';
}

function splitStringOnWhitespace(str)
{
    if (!str || !str.length)
        return [str];

    let parts = [];
    let inWhitespace = isWhitespace(str[0]);
    let start = 0;
    for (let i=0; i<str.length; i++)
    {
        if (isWhitespace(str[i]) == inWhitespace)
            continue;

        if (i > start)
            parts.push(str.substring(start, i));
        start = i;
        inWhitespace = !inWhitespace;
    }
    if (start < str.length)
        parts.push(str.substring(start));
    return parts;
}

function isWhitespaceNode(n)
{
    return n.nodeType == 3 && n.raw.match(/^\s*$/);
}

function removeCommonLeadingWhitespace(str) {

    // Split the string into lines
    let lines = str.split('\n');

    while (lines.length > 0 && lines[0].match(/^\s*$/))
        lines.shift();
    while (lines.length > 0 && lines[lines.length-1].match(/^\s*$/))
        lines.pop();

    let common = null;
    for (let l of lines)
    {
        // Get leading space for this line
        let linespace = l.match(/^([ \t]*)/);
        if (!linespace)
            return lines.join('\n');

        // Ignore completely whitespace lines
        if (linespace[1].length == l.length)
            continue;

        if (common == null)
        {
            common = linespace[1];
        }
        else
        {
            for (let i=0; i < common.length; i++)
            {
                if (linespace[1][i] != common[i])
                {
                    common = common.substring(0, i);
                    break;
                }
            }
        }
    }

    if (!common || common.length == 0)
        return lines.join('\n');

    lines = lines.map(x => x.substring(common.length));


    // Join the lines back into a single string
    return lines.join('\n');
}
