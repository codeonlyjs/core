import fs from 'node:fs';

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
            "Notify",
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


let defs = JSON.parse(fs.readFileSync("index.d.json", "utf8"));

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

let heading = "######";

defs.members[0].members.sort((a,b) => a.name.localeCompare(b.name));
for (let n of defs.members[0].members)
{
    let g = groupForName(n.name);
    render(g.writer, 2, n);
}

for (let g of groups)
{
    fs.writeFileSync(`../website/content/guide/${g.filename}.md`, g.output, "utf8");
}

console.log("OK");

function stripModuleFromNamepath(np)
{
    if (np.startsWith("module:@codeonlyjs/core."))
        np = np.substring("module:@codeonlyjs/core.".length);
    return np;
}

function namePathToId(namepath)
{
    let np = stripModuleFromNamepath(namepath);
    return np;
}

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
            let id = namePathToId(link.namepath);
            url = `#${id}`;
            if (!title)
                title = stripModuleFromNamepath(link.namepath);
        }

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
        w.write(`${heading.substring(0, depth)} ${title}${id}\n\n`);
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


