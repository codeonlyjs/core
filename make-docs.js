import fs from 'node:fs';
import { parseNamePath } from "@toptensoftware/jsdoc";

let groups = [
    {
        name: "Utilities",
        title: "Utilities",
        names: [ 
            "nextFrame", 
            "postNextFrame", 
            "anyPendingFrames", 
            "htmlEncode",
            "urlPattern",
            /notify/i,
            "css",
            /^fetch/,
        ]
    },
    {
        name: "Components",
        title: "Components API",
        names: [ 
            "Component" 
        ],
    },
    {
        name: "Environment",
        title: "Environment API",
        names: [ 
            "coenv", 
            "Environment", 
            "setEnvProvider" 
        ],
    },
    {
        name: "Templates",
        title: "Templates API",
        names: [ 
            "compileTemplate", 
            "html", 
            "input", 
            "transition",
            "InputOptions", 
            "$",
        ],
    },
    {
        name: "Router",
        title: "Router API",
        names: [ 
            /^Route/,
            /ViewStateCallback$/,
            "PageCache",
            "UrlMapper",
            "router",
        ]
    },
    {
        name: "Rendering",
        title: "Rendering API",
        names: [ 
            /^SSR/,
            /generateStatic/i,
        ]
    },
    {
        name: "LowLevel",
        title: "Low-level APIs",
        names: [ 
            "CLObject", 
            "DomTree", 
            "DomTreeConstructor", 
            "DomTreeContext",
            "HtmlString", 
            "Style",
            /^Transition/,
            "InputHandler",
        ]
    },
]

// Given a name, work out which group it belongs to
function groupForName(name)
{
    for (let g of groups)
    {
        for (let n of g.names)
        {
            if (n instanceof RegExp)
            {
                if (name.match(n))
                    return g;
            }
            else
            {
                if (name == n)
                    return g;
            }
        }
    }

    console.error(`warning: no group for ${name}`);
    return groups[0];
}


// create group writers
for (let g of groups)
{
    g.filename = `api${g.name}`;
    g.output = "";
    g.writer = { write: x => g.output += x };
    g.writer.write(`---\n`);
    g.writer.write(`title: ${g.title}\n`);
    g.writer.write(`description: CodeOnly ${g.title} Reference\n`);
    g.writer.write(`---\n\n`);
    g.writer.write(`# ${g.title}\n\n`);
}

// Load index.d.json
let defs = JSON.parse(fs.readFileSync("index.d.json", "utf8"));

// Sort definitions alphabetically
defs.members[0].members.sort((a,b) => a.name.localeCompare(b.name));

// Render all members to appropriate group
for (let n of defs.members[0].members)
{
    let g = groupForName(n.name);
    render(g.writer, 2, n);
}

// Write the group files
for (let g of groups)
{
    fs.writeFileSync(`../website/content/guide/${g.filename}.md`, g.output, "utf8");
}

// Done!
console.log("OK");


// Strip our module name from a namepath
function stripModuleFromNamepath(np)
{
    if (np.startsWith("module:@codeonlyjs/core."))
        np = np.substring("module:@codeonlyjs/core.".length);
    return np;
}

// Given a name path, work out it's id
function namePathToId(namepath)
{
    let np = stripModuleFromNamepath(namepath);
    return np;
}

// Expand inline links
function expandInline(links, text)
{
    if (!links || !links.length)
        return text;

    return text.replace(/\{@link (\d+)\}/g, (text, id) => {
        let link = links[parseInt(id)];
        if (!link)
            return text;

        // Work out title
        let title = link.title;
        if (!title)
            title = link.url;

        // Work out url
        let url = link.url;
        if (!url)
        {
            // Parse the name path
            let np = parseNamePath(link.namepath);

            // If it's to our module
            let file = "";
            if (np && np[0].prefix == "module:" && np[0].name == "@codeonlyjs/core")
            {
                // Get the group and filename that it lives in
                let group = groupForName(np[1].name);
                if (group)
                    file = group.filename;
            }

            // Convert namepath to id
            let id = namePathToId(link.namepath);

            // Create URL
            url = `${file}#${id}`;

            // Work out title
            if (!title)
            {
                if (np)
                    title = np[np.length-1].name;
                else
                    title = link.namepath;
            }
        }

        // Plain or code?
        if (link.kind == "linkcode")
            return `[\`${title}\`](${url})`;
        else
            return `[${title}](${url})`;
    });
}

function getDescription(el)
{
    if (!el.jsdoc)
        return null;

    let descblock = el.jsdoc.find(x => x.kind == "description");
    if (!descblock)
        descblock = el.jsdoc.find(x => x.kind == null);

    if (!descblock)
        return null;

    return expandInline(el.links, descblock.text);
}

function render(w, depth, el)
{
    if (el.kind != "get" && el.kind != "set")
    {
        let title = el.name;

        switch (el.kind)
        {
            case "class": title += " Class"; break;
            case "class": title += " Interface"; break;
            case "constructor": title += "()"; break;
            case "function": title += "()"; break;
            case "method": title += "()"; break;
        }

        if (el.static)
            title += " (static)";

        let id = "";
        if (el.namepath)
        {
            id = ` \{#${namePathToId(el.namepath)}\}`
        }
        w.write(`${"######".substring(0, depth)} ${title}${id}\n\n`);
    }
    
    let desc = getDescription(el);
    if (desc)
    {
        w.write(desc);
        w.write("\n\n");
    }

    if (el.definition)
    {
        // Strip "export" from the definition
        let def = el.definition;
        def = def.replace(/^\s*export\s/, "");

        // Write it as a code block
        w.write("```ts\n");
        w.write(def);
        w.write("\n```\n\n");
    }

    if (el.jsdoc)
    {
        for (let p of el.jsdoc.filter(x => x.block == "param"))
        {
            w.write(`* **\`${p.specifier}\`** ${expandInline(el.links, p.text.replace(/^\s*-\s*/, ""))}\n`);
        }
    }

    if (el.members)
    {
        el.members.sort((a,b) => a.name.localeCompare(b.name));
        for (let m of el.members)
        {
            render(w, depth+1, m);
        }
    }

}


