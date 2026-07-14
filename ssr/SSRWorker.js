import path from 'node:path';

import { router } from "../spa/Router.js";
import { setEnvProvider } from '../core/Environment.js';
import { SSREnvironment } from './SSREnvironment.js';
import { SSRRouterDriver } from "./SSRRouterDriver.js";

/**
 * The results of an SSRWorker/SSRWorkerThread render operation.
 * 
 * In addition to the `content` property, this object includes
 * any properties from the `ssr` property of the route object to
 * which the URL was matched.  This can be used to return additional
 * information such as HTTP status codes from the rendering process.
 *
 * @typedef {object} SSRResult
 * @property {string} content The rendered HTML
 */

/**
 * Implements page rendering for SSG and/or SSR
 */
export class SSRWorker
{
    /**
     * Constructs a new instance
     */
    constructor()
    {
    }

    /**
     * Initializes the SSR worker
     * @param {object} options Options
     * @param {string} options.entryFile The main entry .js file
     * @param {string} options.entryMain The name of the main function in the entry file
     * @param {any[]} options.entryParams An array of parameters to pass to entryMain
     * @param {string} options.entryHtml An HTML string into which mounted components will be written
     * @param {string} [options.cssUrl] A URL to use in-place of directly inserting CSS declarations
     * @returns {Promise<void>}
     */
    async init(options)
    {
        // Load entry module
        this.#env = new SSREnvironment(options);
        setEnvProvider(() => this.env);

        // Store options
        /** @internal */
        this.options = options;

        // Work out asset base
        this.options.assetBase = path.dirname(this.options.entryFile);

        // Setup router driver
        this.#routerDriver = new SSRRouterDriver(this);
        router.start(this.#routerDriver);

        // Load entry point module
        this.#entryModule = await import(`file://${path.resolve(options.entryFile)}`);

        // Find entry point
        if (Array.isArray(this.options.entryMain))
        {
            // Look for first matching entry main
            for (let m of this.options.entryMain)
            {
                if (this.#entryModule[m])
                {
                    this.#entryMain = m;
                    break;
                }
            }
        }
        else
        {
            this.#entryMain = this.options.entryMain;
        }
        if (!this.#entryMain)
            throw new Error(`entryMain not found - ${JSON.stringify(this.options.entryMain)}`);

        // Call entry point
        await Promise.resolve(this.#entryModule[this.#entryMain](...this.options.entryParams));

        // Insert cossr flag
        {
            let e = this.#env.document.createElement("meta");
            e.setAttribute("name", "co-ssr");
            e.setAttribute("value", "true");
            this.#env.document.head.appendChild(e);
        }
    }

    #env;
    #routerDriver;
    #entryModule;
    #entryMain;
    
    /**
     * Stops the worker.
     */
    async stop()
    {
        this.#env.unmountAll();
    }


    /** @internal */
    get env()
    {
        return this.#env;
    }

    /**
     * Gets the declared CSS styles
     * @returns {Promise<string>}
     */
    async getStyles()
    {
        return this.#env.styles;
    }

    /**
     * Renders a page
     * @param {string} url URL of the page to render
     * @param {any} options Additional options to be made available via `coenv`
     * @returns {SSRResult} The results of the render
     */
    async render(url, options)
    {
        // Tell the router driver to load URL
        await this.#routerDriver.load(new URL(url));

        // Wait for environment
        await this.#env.whileBusy();

        let result = Object.assign(
            {}, 
            router.current?.ssr ?? {}, 
            { 
                internalUrl: router.internalize(router.current.url.pathname),
                content: this.#env.document.innerHTML, 
            }
        );

        return result;
    }

    externalizeUrl(url)
    {
        return router.externalize(url);
    }
}

