import path from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';

import { EnvironmentBase, setEnvironment } from "../core/Environment.js";
import { Style } from "../core/Style.js";
import { whenLoaded } from '../core/Utils.js';
import { compileTemplate } from "../core/TemplateCompiler.js";
import { router } from "../spa/Router.js";
import { SSRRouterDriver } from "./SSRRouterDriver.js";

import { Window } from "../minidom/index.js";

export class SSREnvironment extends EnvironmentBase
{
    constructor(options)
    {
        super();
        this.compileTemplate = compileTemplate;
        this.ssr = true;

        setEnvironment(this);
    }

    async init(entryFile, entryFn)
    {
        // Setup router driver
        this.routerDriver = new SSRRouterDriver(this);
        router.start(this.routerDriver);

        // Construct async store
        this.asyncStore = new AsyncLocalStorage();

        // Store entry point
        this.entryFile = entryFile;
        this.entryFn = entryFn;

        // Load entry module
        let store = {};
        await this.asyncStore.run(store, async () => {

            // Load entry point
            this.entryModule = await import(`file://${path.resolve(entryFile)}`);

            // Capture registered styles
            this.css = Style.all;

        });
    }


    get store()
    {
        let store = this.asyncStore.getStore();
        if (!store)
            throw new Error("No async store")
        return store;
    }

    async render(url)
    {
        let store = {
            mounts: {},
            window: new Window(),
        };
        await this.asyncStore.run(store, async () => {

            // Call entry point
            await Promise.resolve(this.entryModule[this.entryFn]());

            // Tell the router driver to load URL
            await this.routerDriver.load(url);

            // Wait till loaded
            whenLoaded(this, () => {

                // Render
                

            });

        });
    }

    get window()
    {
        return this.store.window;
    }

    get document()
    {
        return this.store.window.document;
    }

    mount(component, el)
    {
        if (typeof(el) !== 'string')
            throw new Error("Components must be mounted against a selector string in SSR environments");
        component.create();
        this.store.mounts[el] = component;
    }

    unmount()
    {
        throw new Error("Unmounting components not supported in SSR environment");
    }
}

