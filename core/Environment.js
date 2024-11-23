
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
}

export let env;


export function setEnvironment(newEnv)
{
    env = newEnv;
}

