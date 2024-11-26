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
        setEnvProvider(() => this.env);
    }

    async init(options)
    {
        // Store options
        this.options = options;

        // Setup router driver
        this.routerDriver = new SSRRouterDriver(this);
        router.start(this.routerDriver);

        // Construct async store
        this.asyncStore = new AsyncLocalStorage();

        // Load entry module
        let env = new SSREnvironment();
        await this.asyncStore.run(env, async () => {

            // Load entry point
            this.entryModule = await import(`file://${path.resolve(options.entryFile)}`);

            // Capture registered styles
            this.css = Style.all;

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

    async render(url)
    {
        let env = new SSREnvironment();
        return await this.asyncStore.run(env, async () => {

            // Call entry point
            await Promise.resolve(this.entryModule[this.options.entryMain]());

            // Tell the router driver to load URL
            await this.routerDriver.load(new URL(url));

            // Wait for environment
            await env.whileBusy();

            // Render all mounts
            let injections = { 
                head: [ `<style class="cossr">${this.css}</style>` ],
            };
            for (let k of Object.keys(env.mounts))
            {
                if (!injections[k])
                    injections[k] = [];
                let nodes = env.mounts[k].rootNodes;
                nodes.forEach(x => x.classList.add("cossr"));
                injections[k].push(...nodes.map(x => x.html));
                env.mounts[k].destroy();
            }

            return this.htmlInjector.inject(injections);
        });
    }
}

