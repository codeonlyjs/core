import fs from "node:fs";
import path from "path";
import { SSRWorker } from "./SSRWorker.js";
import { Document } from "../minidom/Document.js";
import { prettyHtml } from "../minidom/prettyHtml.js";
//import { register } from 'node:module';


/** Generates a static generated site (SSG)
 * 
 * @param {object} options - site generation options
 * @param {string[]} [options.entryFile] The entry .js file (as an array, first found used)
 * @param {string[]} [options.entryMain] The name of the entry point function in the entryFile (as an array, first found used)
 * @param {string[]} [options.entryHtml] The HTML file to use as template for generated files (as an array, first found used)
 * @param {string[]} [options.entryUrls] The URL's to render (will also recursively render all linked URLs)
 * @param {string} [options.ext] The extension to append to all generated files (including the period)
 * @param {boolean} [options.pretty] Prettify the generated HTML
 * @param {string} [options.outDir] The output directory to write generated files
 * @param {string} [options.baseUrl] The base URL used to qualify in-page URLs to an external full URL
 * @param {boolean} [options.verbose] Verbose output
 * @param {string} [options.cssUrl] Name of the CSS styles file
 */
export async function generateStatic(options)
{
    options = Object.assign({
        entryFile: [ "main-ssg.js", "main-ssr.js", "Main.js", ],
        entryMain: [ "main-ssg", "main-ssr", "main" ],
        entryHtml: [ "dist/index.html", "index-ssg.html", "index.ssr.html", "index.html" ],
        entryUrls: [ "/" ],
        ext: ".html",
        pretty: true,
        outDir: "./dist",
        baseUrl: "http://localhost/",
        verbose: false,
        cssUrl: "/assets/styles-[unique].css",
    }, options);

    let baseUnique = Date.now();
    if (options.cssUrl)
    {
        options.cssUrl = options.cssUrl.replace(/\[unique\]/g, () => {
            let buf = Buffer.alloc(8);
            buf.writeBigInt64BE(BigInt(baseUnique++));
            return buf.toString('base64').replace(/\=/, "");
        });
    }
   

    // Install module loader hook.  We need to make
    // sure we use our copy of codeonlyjs 
    //register('./module_loader_hooks.js', import.meta.url);

    let start = Date.now();

    let result = {
        files: [],
        elapsed: 0,
    }

    // Resolve files
    options.entryFile = resolveFile(options.entryFile);
    options.entryHtml = resolveFile(options.entryHtml);

    // If no URL specified, just use /
    if (options.entryUrls.length == 0)
        options.entryUrls.push("/");

    // Load files
    let entryHtml = fs.readFileSync(options.entryHtml, "utf8");

    // Create SSRWorker
    let worker = new SSRWorker();
    await worker.init({
        entryFile: options.entryFile,
        entryMain: options.entryMain,
        entryHtml,
        cssUrl: options.cssUrl,
    });

    // Process all URLs...
    let urlsPending = [...options.entryUrls];
    let urlsProcessed = new Set();
    while (urlsPending.length > 0)
    {
        // Get next url
        let u = urlsPending.shift();

        // Already processed?
        if (urlsProcessed.has(u))
            continue;
        urlsProcessed.add(u);

        // Work out url
        let url = new URL(u, options.baseUrl);

        // Render
        let r;
        
        try
        {
            r = await worker.render(url.href);
        }
        catch (err)
        {
            console.error(`Page ${u} failed with exception: ${err.message}\n${err.stack}`);
            continue;
        }

        // Check for status error
        if (r.status)
        {
            if (r.status < 200 || r.status >= 300)
            {
                console.error(`Page '${u}' failed: status ${r.status}`);
                continue;
            }
        }

        // Parse
        let doc = new Document(r.content);

        // Pretty?
        if (options.pretty)
            r.content = prettyHtml(doc);

        // Work out output file name
        let filename = url.pathname;
        if (filename.endsWith("/"))
            filename += "index";
        filename += options.ext;

        await writeFile(filename, r.content);

        // Find links
        for (let a of doc.querySelectorAll("a"))
        {
            let u = new URL(a.getAttribute("href"), url);
            if (!u.href.startsWith(options.baseUrl))
                continue;

            if (!urlsProcessed.has(u.pathname))
                urlsPending.push(u.pathname);
        }
    }

    // Write it
    await writeFile(options.cssUrl, await worker.getStyles());

    await worker.stop();


    result.elapsed = Date.now() - start;

    return result;

    function writeFile(url, content)
    {
        if (url.startsWith("/"))
            url = "." + url;

        // Qualify it
        let outFile = path.join(options.outDir, url);

        // Make sure directory exists
        let outDir = path.dirname(outFile);
        if (!fs.existsSync(outDir))
            fs.mkdirSync(outDir, { recursive: true });

        // Write it
        fs.writeFileSync(outFile, content, "utf8");

        if (!options.quiet)
            console.log(`render: ${outFile}`);

        result.files.push(outFile);

        return outFile;
    }
}


// Given an array of file names, find the first that exists
function resolveFile(files)
{
    if (typeof(files) === 'string')
        return files;

    for (let f of files)
    {
        if (fs.existsSync(f))
            return path.resolve(f);
    }

    throw new Error(`can't find ${files.join(", ")}`);
}