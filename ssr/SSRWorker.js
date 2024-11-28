import path from 'node:path';

import { AsyncLocalStorage } from 'node:async_hooks';
import { Style } from "../core/Style.js";
import { untilLoaded } from '../core/Utils.js';
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
        setEnvProvider(() => this.env);

        // Store options
        this.options = options;

        // Setup router driver
        this.routerDriver = new SSRRouterDriver(this);
        router.start(this.routerDriver);

        // Construct async store
        this.asyncStore = new AsyncLocalStorage();

        // Load entry module
        let env = new SSREnvironment();
        env.options = options;
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


    get env()
    {
        let env = this.asyncStore.getStore();
        if (!env)
            throw new Error("No async env store")
        return env;
    }

    async render(url, opts)
    {
        let env = new SSREnvironment();
        env.options = Object.assign(this.options, opts);
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

