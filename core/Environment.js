import { untilLoaded } from "./Utils.js";

export class EnvironmentBase extends EventTarget
{
    constructor()
    {
        super();
        this.browser = false;
    }

    #loading = 0;

    enterLoading()
    {
        this.#loading++;
        if (this.#loading == 1)
            this.dispatchEvent(new Event("loading"));
    }
    leaveLoading()
    {
        this.#loading--;
        if (this.#loading == 0)
            this.dispatchEvent(new Event("loaded"));
    }

    get loading()
    {
        return this.#loading != 0;
    }

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


export function setEnvProvider(value)
{
    getEnv = value;
}

