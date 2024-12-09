import fs from 'node:fs';

let defs = JSON.parse(fs.readFileSync("index.d.json", "utf8"));

let str = "";
let writer = { write: x => str += x };
let heading = "######";

writer.write("---\n");
writer.write("title: API Reference\n")
writer.write("---\n\n");


for (let d of defs)
{
    render(writer, 1, d);
}

fs.writeFileSync("index.d.md", str, "utf8");

console.log("OK");

function getDescription(el)
{
    if (!el.jsdoc)
        return null;

    let descblock = el.jsdoc.find(x => x.kind == "description");
    if (!descblock)
        descblock = el.jsdoc.find(x => x.kind == null);

    if (!descblock)
        return null;

    return descblock.text;
}

function render(w, depth, el)
{
    if (depth !== undefined)
    {
        let title = el.name;
        if (el.static)
            title += " (static)";
        w.write(`${heading.substring(0, depth)} ${title}\n\n`);
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
            w.write(`* **\`${p.specifier}\`** ${p.text.replace(/^\s*-\s*/, "")}\n`);
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


