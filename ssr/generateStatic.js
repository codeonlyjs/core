import fs from "node:fs";
import path from "path";
import { SSRWorker } from "./SSRWorker.js";
import { Document } from "../minidom/Document.js";
import { prettyHtml } from "../minidom/prettyHtml.js";
//import { register } from 'node:module';

/**
 * Options for generating static sites
 * @typedef {object} GenerateStaticOptions
 * @property {string[]} [entryFile] The entry .js file (as an array, first found used)
 * @property {string[]} [entryMain] The name of the entry point function in the entryFile (as an array, first found used)
 * @property {any[]} [entryParams] An array of parameters to pass to entryMain
 * @property {string[]} [entryHtmlFile] The HTML file to use as template for generated files (as an array, first found used)
 * @property {string} [entryHtml] The HTML string to use as template (replaces entryHtmlFile)
 * @property {string[]} [entryUrls] The URL's to render (will also recursively render all linked URLs)
 * @property {string} [ext] The extension to append to all generated files (including the period)
 * @property {boolean} [pretty] Prettify the generated HTML
 * @property {string} [outDir] The output directory to write generated files (null to return file contents)
 * @property {string} [baseUrl] The base URL used to qualify in-page URLs to an external full URL
 * @property {boolean} [verbose] Verbose output
 * @property {string} [cssUrl] Name of the CSS styles file
 */

/** Generates a static generated site (SSG)
 * 
 * @param {GenerateStaticOptions} options - site generation options
 */
export async function generateStatic(options)
{
    options = Object.assign({
        entryFile: [ "main-ssg.js", "main-ssr.js", "Main.js", ],
        entryMain: [ "main-ssg", "main-ssr", "main" ],
        entryParams: [],
        entryHtmlFile: [ "dist/index.html", "index-ssg.html", "index.ssr.html", "index.html" ],
        entryUrls: [ "/" ],
        ext: ".html",
        pretty: true,
        outDir: "./dist",
        baseUrl: "http://localhost/",
        verbose: false,
        cssUrl: "/assets/co-styles-[unique].css",
    }, options);

    let baseUnique = Date.now();
    if (options.cssUrl)
    {
        options.cssUrl = options.cssUrl.replace(/\[unique\]/g, () => {
            let buf = Buffer.alloc(8);
            buf.writeBigInt64BE(BigInt(baseUnique++));
            return buf.toString('base64').replace(/[\=\/]/g, "");
        });
    }

    let start = Date.now();

    let result = {
        files: [],
        elapsed: 0,
    }

    // If no URL specified, just use /
    if (options.entryUrls.length == 0)
        options.entryUrls.push("/");

    // Resolve files
    options.entryFile = resolveFile(options.entryFile);

    let entryHtml;
    if (options.entryHtml)
    {
        entryHtml = options.entryHtml;
    }
    else
    {
        options.entryHtmlFile = resolveFile(options.entryHtmlFile);
        entryHtml = fs.readFileSync(options.entryHtmlFile, "utf8");
    }

    // Create SSRWorker
    let worker = new SSRWorker();
    await worker.init({
        entryFile: options.entryFile,
        entryMain: options.entryMain,
        entryParams: options.entryParams,
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
        let filename = r.internalUrl;
        if (filename.endsWith("/"))
            filename += "index";
        filename += options.ext;

        writeFile(filename, r.content);

        // Find links
        for (let a of doc.querySelectorAll("a"))
        {
            let href = a.getAttribute("href");
            if (!href)
                continue;
            let u = new URL(href, url);
            if (!u.href.startsWith(options.baseUrl))
                continue;

            if (!urlsProcessed.has(u.pathname))
                urlsPending.push(u.pathname);
        }
    }

    // Write it
    writeFile(options.cssUrl, await worker.getStyles());

    await worker.stop();


    result.elapsed = Date.now() - start;

    return result;

    function writeFile(url, content)
    {
        if (!options.quiet)
            console.log(`render: ${url}`);

        if (url.startsWith("/"))
            url = "." + url;

        // Actually write the file?
        if (options.outDir)
        {
            // Qualify it
            let outFile = path.join(options.outDir, url);

            // Make sure directory exists
            let outDir = path.dirname(outFile);
            if (!fs.existsSync(outDir))
                fs.mkdirSync(outDir, { recursive: true });

            // Write it
            fs.writeFileSync(outFile, content, "utf8");
        }

        // Return the file and content in the results
        result.files.push({
            url,
            content,
        });
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