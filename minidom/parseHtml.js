import { tokenizer } from "./tokenizer.js";

export let selfClosing = /area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr/i;

// Mini parser converts HTML to an array of nodes
// (lots of limitations, good enough for mocking)
export function parseHtml(document, str)
{
    let tokens = tokenizer(str);
    let token;

    function nextToken(mode)
    {
        token = tokens(mode);
        return token;
    }

    nextToken();

    let finalNodes = parseNodes();

    if (token.token != '\0')
        throw new Error("syntax error: expected eof");

    return finalNodes;

    function parseNodes()
    {
        let nodes = [];
        while (token.token != '\0'  && token.token != '</')
        {
            // Text?
            if (token.text)
            {
                let node = document.createTextNode(token.text, true);
                node.sourcePos = { start: token.start, end: token.end };
                nodes.push(node);
                nextToken();
                continue;
            }

            // Comment?
            if (token.comment)
            {
                let node = document.createComment(token.comment, true)
                node.sourcePos = { start: token.start, end: token.end };
                nodes.push(node);
                nextToken();
                continue;
            }

            // Tag
            if (token.token == '<')
            {
                let outerStart = token.start;

                // Skip it
                nextToken();

                // Must be a tag identifier
                if (!token.identifier)
                {
                    throw new Error("syntax error: expected identifier after '<'");
                }

                let node = document.createElement(token.identifier);
                node.sourcePos = { start: outerStart };
                nodes.push(node);
                nextToken("attribute");

                // Parse attributes
                while (token.token != '\0' && token.token != '>' && token.token != '/>')
                {
                    // Get attribute name, quit if tag closed
                    let attribName = token;
                    if (attribName.string === undefined)
                        break;

                    // Store just the name
                    attribName = attribName.string;
                    let attribValue = attribName;

                    // Assigned value?
                    if (nextToken("attribute").token == '=')
                    {
                        let val = nextToken("attribute");
                        if (val.string === undefined)
                            throw new Error("syntax error, expected value after '='");
                        attribValue = val.string;
                        nextToken("attribute");
                    }

                    // Set attribute value
                    node.setAttribute(attribName, attribValue, true);
                }

                // Self closing tag?
                if (token.token == '/>')
                {
                    node.sourcePos.end = token.end;
                    nextToken();
                    continue;
                }

                if (token.token != '>')
                {
                    throw new Error("syntax error: expected '>' || '/>'");
                }
                
                if (node.nodeName.match(selfClosing))
                {
                    nextToken();
                    node.sourcePos.end = token.end;
                    continue;
                }

                node.sourcePos.innerStart = token.end;

                if (node.nodeName == "script" || node.nodeName == "style")
                {
                    nextToken("/" + node.nodeName);
                    let textNode = document.createTextNode(token.text, true);
                    textNode.sourcePos = { start: token.start, end: token.end };
                    node.appendChild(textNode);
                    nextToken();
                }
                else
                {
                    nextToken();

                    // Parse child nodes
                    node.append(...parseNodes());
                }

                if (token.token == '</')
                {
                    node.sourcePos.innerEnd = token.start;
                    nextToken();
                    if (token.identifier != node.nodeName)
                        throw new Error("mismatched tags");
                    nextToken();
                    if (token.token != '>')
                        throw new Error("expected '>' for closing tag");
                    node.sourcePos.end = token.end;
                    nextToken();
                }
            }
        }

        return nodes;
    }
}
