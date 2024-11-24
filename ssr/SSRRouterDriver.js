export class SSRRouterDriver 
{
    constructor(env)
    {
        this.env = env;
    }

    async start(router)
    {
        this.#router = router;
    }

    async load(url)
    {
        return await this.#router.load(url, null);
    }

    // Called by router to get current state object
    // This is tied to the current request through
    // the environment async store
    get state()
    {
        let state = this.env.store.routerState;
        if (!state)
        {
            state = {
                c: null,
                p: null,
                l: []
            }
            this.env.store.routerState = state;
        }
        return state;
    }

    #router;

    navigate()
    {
        throw new Error("SSR navigate() not supported");
    }

    replace()
    {
        throw new Error("SSR replace() not supported");
    }

    back()
    {
        throw new Error("SSR back() not supported");
    }

}