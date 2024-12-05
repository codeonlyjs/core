/** @internal */
export class SSRRouterDriver 
{
    constructor()
    {
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
        let env = coenv;
        let state = env.routerState;
        if (!state)
        {
            state = {
                c: null,
                p: null,
                l: []
            }
            env.routerState = state;
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