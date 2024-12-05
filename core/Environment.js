import { untilLoaded } from "./Utils.js";

/** The base class for all environment types 
 * @extends {EventTarget}
 */
export class Environment extends EventTarget
{
    /** Constructs a new Environment */
    constructor()
    {
        super();
        this.browser = false;
    }

    #loading = 0;

    /** Notifies the environment that an async load operation is starting
     * @returns {void}
     */
    enterLoading()
    {
        this.#loading++;
        if (this.#loading == 1)
            this.dispatchEvent(new Event("loading"));
    }

    /** Notifies the environment that an async load operation has finished
     * @returns {void}
     */
    leaveLoading()
    {
        this.#loading--;
        if (this.#loading == 0)
            this.dispatchEvent(new Event("loaded"));
    }

    /** Indicates if there are async data load operations in progress
     * @type {boolean}
     */
    get loading()
    {
        return this.#loading != 0;
    }

    /** Runs an async data load operation
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

    /** Returns a promise that resolves when any pending load operation has finished
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


/** Sets an environment provider
 * @param {() => Environment} value A callback to provide the current environment object
 * @returns {void}
 */
export function setEnvProvider(value)
{
    getEnv = value;
}

