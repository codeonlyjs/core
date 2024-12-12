import { untilLoaded } from "./Utils.js";

/** 
 * The base class for all environment types 
 * 
 * The environment object is available via the globally declared `coenv`
 * variable.
 * 
 * * In the browser, there is a single environment object that 
 *   represents the browser.
 * * When rendering, there are multiple environment objects, one per render
 *   request.
 * 
 * Never modify, nor cache the environment object as it can (and will) change
 * from request to request in a server environment.
 * 
 * @extends {EventTarget}
 */
export class Environment extends EventTarget
{
    /** Constructs a new Environment */
    constructor()
    {
        super();

        /**
         * True when running in browser environment.
         */
        this.browser = false;

        /**
         * True when running in a rendering environment.
         */
        this.ssr = false;
    }

    #loading = 0;

    /** 
     * Notifies the environment that an async load operation is starting.
     * 
     * Environment level loading notifications are used when rendering to 
     * determine when the initial page load has completed and rendering
     * can commence.
     * 
     * @returns {void}
     */
    enterLoading()
    {
        this.#loading++;
        if (this.#loading == 1)
            this.dispatchEvent(new Event("loading"));
    }

    /** 
     * Notifies the environment that an async load operation has finished.
     * 
     * @returns {void}
     */
    leaveLoading()
    {
        this.#loading--;
        if (this.#loading == 0)
            this.dispatchEvent(new Event("loaded"));
    }

    /** 
     * Returns `true` if there are in progress async load operations.
     * 
     * @type {boolean}
     */
    get loading()
    {
        return this.#loading != 0;
    }

    /** 
     * Runs an async data load operation.
     * 
     * @param {() => Promise<any>} callback A callback that performs the data load
     * @returns {Promise<any>}
     */
    async load(callback)
    {
        this.enterLoading();
        try
        {
            return await callback();
        }
        finally
        {
            this.leaveLoading();
        }
    }

    /** 
     * Returns a promise that resolves when any pending load operations have finished.
     * @returns {Promise<void>}
     */
    untilLoaded()
    {
        return untilLoaded(this);
    }
}

let getEnv;

Object.defineProperty(globalThis, "coenv", {
    get()
    {
        return getEnv();
    }
});

/** 
 * Sets an environment provider.
 * 
 * @param {() => Environment} value A callback to provide the current environment object
 * @returns {void}
 */
export function setEnvProvider(value)
{
    getEnv = value;
}

