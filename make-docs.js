import fs from 'node:fs';

let defs = JSON.parse(fs.readFileSync("index.d.json", "utf8"));

let str = "";
let writer = { write: x => str += x };
let heading = "######";

writer.write("---\n");
writer.write("title: API Reference\n")
writer.write("---\n\n");


for (let d of defs.members)
{
    render(writer, 1, d);
}

fs.writeFileSync("index.d.md", str, "utf8");

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
    if (depth !== undefined)
    {
        let title = el.name;
        if (el.static)
            title += " (static)";
        let id = "";
        if (el.namepath)
        {
            id = ` \{#${namePathToId(el.namepath)}\}`
        }
        w.write(`${heading.substring(0, depth)} ${title}${id}\n\n`);
    }

    if (el.getAccessor)
        render(w, undefined, el.getAccessor);
    if (el.setAccessor)
        render(w, undefined, el.setAccessor);
    
    
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

    let desc = getDescription(el);
    if (desc)
    {
        w.write(desc);
        w.write("\n\n");
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


