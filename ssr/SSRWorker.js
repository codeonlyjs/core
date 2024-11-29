import path from 'node:path';

import { AsyncLocalStorage } from 'node:async_hooks';
import { router } from "../spa/Router.js";
import { setEnvProvider } from '../core/Environment.js';
import { SSREnvironment } from './SSREnvironment.js';
import { SSRRouterDriver } from "./SSRRouterDriver.js";
import { HtmlInjector } from "./HtmlInjector.js";

export class SSRWorker
{
    constructor()
    {
    }

    async init(options)
    {
        // Load entry module
        let env = new SSREnvironment(this.options);
        setEnvProvider(() => this.env);

        // Store options
        this.options = options;

        // Work out asset base
        this.options.assetBase = path.dirname(this.options.entryFile);

        // Setup router driver
        this.routerDriver = new SSRRouterDriver(this);
        router.start(this.routerDriver);

        // Construct async store
        this.asyncStore = new AsyncLocalStorage();

        await this.asyncStore.run(env, async () => {

            // Load entry point
            this.entryModule = await import(`file://${path.resolve(options.entryFile)}`);

            if (Array.isArray(this.options.entryMain))
            {
                // Look for first matching entry main
                for (let m of this.options.entryMain)
                {
                    if (this.entryModule[m])
                    {
                        this.entryMain = m;
                        break;
                    }
                }
            }
            else
            {
                this.entryMain = this.options.entryMain;
            }

            if (!this.entryMain)
                throw new Error(`entryMain not found - ${JSON.stringify(this.options.entryMain)}`);

            // Capture registered styles
            this.css = env.styles;

        });

        // Create injector
        this.htmlInjector = new HtmlInjector(this.options.entryHtml);
    }

    async stop()
    {
        // nop
    }


    get env()
    {
        let env = this.asyncStore.getStore();
        if (!env)
            throw new Error("No async env store")
        return env;
    }

    async getStyles()
    {
        return this.css;
    }

    async render(url, options)
    {
        let mergedOptions = Object.assign({}, this.options, options);
        let env = new SSREnvironment(mergedOptions);
        return await this.asyncStore.run(env, async () => {

            // Call entry point
            await Promise.resolve(this.entryModule[this.entryMain]());

            // Tell the router driver to load URL
            await this.routerDriver.load(new URL(url));

            // Wait for environment
            await env.whileBusy();

            // Render all mounts
            let injections = { 
            };
            for (let k of Object.keys(env.mounts))
            {
                if (!injections[k])
                    injections[k] = [];
                let nodes = env.mounts[k].rootNodes;
                injections[k].push(...nodes.map(x => x.html));
                env.mounts[k].destroy();
            }

            if (!injections.head)
                injections.head = [];
            if (this.options.cssUrl)
                injections.head.push(`<link href="${this.options.cssUrl}" type="text/css" rel="stylesheet" />`);
            else
                injections.head.push(`<style>${this.css}</style>`);

            for (let k of Object.keys(injections))
            {
                injections[k].unshift(`<!--co-ssr-start-->`);
                injections[k].push(`<!--co-ssr-end-->`);
            }
            injections.head.push(`<meta name="co-ssr" value="true" />`);

            let result = Object.assign(
                {}, 
                router.current?.ssr ?? {}, 
                { content: this.htmlInjector.inject(injections) }
            );

            return result;
        });
    }
}

