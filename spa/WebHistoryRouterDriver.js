import { getEnv } from "../core/Environment.js";
import { ViewStateRestoration } from "./ViewStateRestoration.js";

export class WebHistoryRouterDriver
{
    async start(router)
    {
        this.#router = router;

        // Connect view state restoration
        new ViewStateRestoration(router);

        // Listen for clicks on links
        getEnv().document.body.addEventListener("click", (ev) => {
            if (ev.defaultPrevented)
                return;
            let a = ev.target.closest("a");
            if (a)
            {
                if (a.hasAttribute("download"))
                    return;

                let href = a.getAttribute("href");
                let url = new URL(href, getEnv().window.location);
                if (url.origin == getEnv().window.location.origin)
                {
                    try
                    {
                        url = this.#router.internalize(url);
                    }
                    catch
                    {
                        return;
                    }

                    this.navigate(url).then(r => {
                        if (r == null)
                            window.location.href = href;
                    });

                    ev.preventDefault();
                    return true;
                }
            }
        });

        // Listen for pop state
        getEnv().window.addEventListener("popstate", async (event) => {

            if (this.#ignoreNextPop)
            {
                this.#ignoreNextPop = false;
                return;
            }

            // Load
            let loadId = this.#loadId + 1;
            let url = this.#router.internalize(new URL(getEnv().window.location));
            let state = event.state ?? { sequence: this.current.state.sequence + 1 };
            if (!await this.load(url, state, { navMode: "pop" }))
            {
                // Load was cancelled, adjust web history position
                // but only if there hasn't been another load/navigation
                // since
                if (loadId == this.#loadId)
                {
                    this.#ignoreNextPop = true;
                    getEnv().window.history.go(this.current.state.sequence - state.sequence);
                }
            }
        });


        // Do initial navigation
        let url = this.#router.internalize(new URL(getEnv().window.location));
        let state = getEnv().window.history.state ?? { sequence: 0 };
        let route = await this.load(url, state, { navMode: "start" });
        getEnv().window.history.replaceState(state, null);
        return route;
    }


    #loadId = 0;
    #router;
    #ignoreNextPop = false;
    get current() { return this.#router.current }

    async load(url, state, route)
    {
        this.#loadId++;
        return await this.#router.load(url, state, route);
    }

    back()
    {
        if (this.current.state.sequence == 0)
        {
            let url = new URL("/", this.#router.internalize(new URL(getEnv().window.location)));
            let state = { sequence: 0 };

            getEnv().window.history.replaceState(
                state, 
                "", 
                this.#router.externalize(url),
                );

            this.load(url, state, { navMode: "replace" });
        }
        else
        {
            getEnv().window.history.back();
        }
    }

    replace(url)
    {
        if (typeof(url) === 'string')
            url = new URL(url, this.#router.internalize(new URL(getEnv().window.location)));

        if (url !== undefined)
        {
            this.current.pathname = url.pathname;
            this.current.url = url;
            url = this.#router.externalize(url).href
        }

        getEnv().window.history.replaceState(
            this.current.state, 
            "", 
            url
            );
    }

    async navigate(url)
    {
        // Convert to URL
        if (typeof(url) === 'string')
        {
            url = new URL(url, this.#router.internalize(new URL(getEnv().window.location)));
        }

        // Load the route
        let route = await this.load(url, 
            { sequence: this.current.state.sequence + 1 }, 
            { navMode: "push" }
            );
        if (!route)
            return route;

        // Update history
        getEnv().window.history.pushState(
            route.state, 
            "", 
            this.#router.externalize(url)
        );
        return route;
    }
}
