import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { SSRWorker } from './SSRWorker.js';


/**
 * Runs an SSRWorker in a Node worker thread for
 * application isolation
 */
export class SSRWorkerThread
{
    /**
     * Constructs a new SSRWorkerThread
     */
    constructor()
    {
        // Create worker
        this.#worker = new Worker(new URL(import.meta.url));

        // Hook up event handlers
        this.#worker.on('message', (msg) => {
            let p = this.#pending.get(msg.id);
            this.#pending.delete[msg.id];
            if (msg.err)
                p.reject(msg.err);
            else
                p.resolve(msg.returnValue);
        });
    }

    #worker;

    /**
     * Initializes the SSR worker
     * @param {object} options Options
     * @param {string} options.entryFile The main entry .js file
     * @param {string} options.entryMain The name of the main function in the entry file
     * @param {string} options.entryHtml An HTML string into which mounted components will be written
     * @param {string} [options.cssUrl] A URL to use in-place of directly inserting CSS declarations
     * @returns {Promise<void>}
     */
    init(options)
    {
        return this.invoke("init", options);
    }

    /**
     * Renders a page
     * @param {string} url URL of the page to render
     * @returns {SSRResult} The results of the render
     */
    render(url)
    {
        return this.invoke("render", url);
    }

    /**
     * Gets the declared CSS styles
     * @returns {Promise<string>}
     */
    getStyles()
    {
        return this.invoke("getStyles");
    }

    /**
     * Stops the worker.
     */
    stop()
    {
        return this.invoke("stop");
    }

    #nextId = 1;
    #pending = new Map();

    /** @internal */
    async invoke(method, ...args)
    {
        let id = this.#nextId++;

        // Post message to worker
        this.#worker.postMessage({
            id, method, args,
        });

        // Wait for response
        return await new Promise((resolve, reject) => {
            this.#pending.set(id, { resolve, reject });
        });
    }

}

if (!isMainThread)
{
    // Install module loader hook.  We need to make
    // sure we use our copy of codeonlyjs 
    //register('./module_loader_hooks.js', import.meta.url);

    let worker = new SSRWorker();
    parentPort.on('message', messageHandler);

    async function messageHandler(m)
    {
        if (m.method)
        {
            try
            {
                let returnValue = await worker[m.method](...m.args);
                parentPort.postMessage({ id: m.id, returnValue });
            }
            catch (err)
            {
                parentPort.postMessage({ id: m.id, err });
            }

            if (m.method == "stop")
            {
                parentPort.off('message', messageHandler);
                return;
            }
        }
    }
}