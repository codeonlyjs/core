import { getEnv } from "../core/Environment.js";
import { urlPattern } from "./urlPattern.js";
import { WebHistoryRouterDriver } from "./WebHistoryRouterDriver.js";

export class Router
{   
    constructor(handlers)
    {
        if (handlers)
            this.register(handlers);
    }

    start(driver)
    {
        // Quit if already started
        if (this.#driver)
            return;

        if (!driver)
            driver = new WebHistoryRouterDriver();
            
        this.#driver = driver;
        if (driver)
        {
            this.navigate = driver.navigate.bind(driver);
            this.replace = driver.replace.bind(driver);
            this.back = driver.back.bind(driver);
        }
        return this.#driver.start(this);
    }

    #driver;

    #mapUrl(url, fn)
    {
        if (!this.urlMapper)
        {
            if (url instanceof URL)
                return new URL(url);
            else
                return url;
        }
        else
        {
            if (url instanceof URL)
            {
                return this.urlMapper[fn](url);
            }
            else
            {
                return this.urlMapper[fn](new URL(url, "http://x/")).href.substring(8);
            }
        }
    }

    urlMapper;
    internalize(url) { return this.#mapUrl(url, "internalize"); }
    externalize(url) { return this.#mapUrl(url, "externalize"); }

    #_state = { c: null, p: null, l: [] }
    
    get #state()
    {
        return this.#driver?.state ?? this.#_state;
    }

    get #current()
    {
        return this.#state.c;
    }
    set #current(value)
    {
        this.#state.c = value;
    }

    get #pending()
    {
        return this.#state.p;
    }
    set #pending(value)
    {
        this.#state.p = value;
    }
    get #listeners()
    {
        return this.#state.l;
    }

    // The current route
    get current()
    {
        return this.#current;
    }

    // The route currently being switched to
    get pending()
    {
        return this.#pending;
    }


    addEventListener(event, handler)
    {
        this.#listeners.push({ event, handler });
    }
    removeEventListener(event, handler)
    {
        let index = this.#listeners.findIndex(x => x.event == event && x.handler == handler);
        if (index >= 0)
            this.#listeners.splice(index, 1);
    }
    async dispatchEvent(event, canCancel, from, to)
    {
        for (let l of this.#listeners)
        {
            if (l.event == event)
            {
                let r = l.handler(from, to);
                if (canCancel && (await Promise.resolve(r)) == false)
                    return false;
            }
        }
        return true;
    }

    // Load a URL with state
    async load(url, state, route)
    {
        return getEnv().load(async () => {

            route = route ?? {};
            
            let from = this.#current;

            // In page navigation?
            if (this.#current?.url.pathname == url.pathname && this.#current.url.search == url.search)
            {
                let dup = this.#current.handler.hashChange?.(this.#current, route);
                if (dup !== undefined)
                    route = dup;
                else
                    route = Object.assign({}, this.#current, route);
            }

            route = Object.assign(route, { 
                current: false,
                url: new URL(url), 
                state,
            });

            this.#pending = route;

            // Match url
            if (!route.match)
            {
                route = await this.matchUrl(url, state, route);
                if (!route)
                    return null;
            }

            // Try to load
            try
            {
                if ((await this.tryLoad(route)) !== true)
                {
                    this.#pending = null;
                }
            }
            catch (err)
            {
                this.dispatchCancelEvents(from, route);
                throw err;
            }

            // Cancelled?
            if (this.#pending != route)
            {
                this.dispatchCancelEvents(from, route);
                return null;
            }

            this.#pending = null;
            return route;

        });
    }

    dispatchCancelEvents(from, route)
    {
        this.#current?.handler.cancelLeave?.(from, route);
        route.handler.cancelEnter?.(from, route);
        this.dispatchEvent("cancel", false, from, route);
    }

    // Fires the sequence of events associated with loading a route
    // 
    // event => mayLeave        |
    // old route => mayLeave    |  Async and cancellable
    // new route => mayEnter    |
    // event => mayEnter        |
    // 
    // event => didLeave        |
    // old route => didLeave    |  Sync and non-cancellable
    // new route => didEnter    |
    // event => didEnter        |
    //
    async tryLoad(route)
    {
        let oldRoute = this.#current;

        // Try to leave old route
        let r;
        if (oldRoute)
        {
            // mayLeave event
            if (!await this.dispatchEvent("mayLeave", true, oldRoute, route))
                return;

            // Cancelled?
            if (route != this.#pending)
                return;

            // mayLeave old route
            r = oldRoute.handler.mayLeave?.(oldRoute, route);
            if ((await Promise.resolve(r)) === false)
                return;

            // Cancelled?
            if (route != this.#pending)
                return;
        }

        // mayEnter new route
        r = route.handler.mayEnter?.(oldRoute, route);
        if ((await Promise.resolve(r)) === false)
            return;

        // Cancelled?
        if (route != this.#pending)
            return;

        // mayEnter event
        if (!await this.dispatchEvent("mayEnter", true, oldRoute, route))
            return;

        // Cancelled?
        if (route != this.#pending)
            return;

        // Switch current route
        if (oldRoute)
            oldRoute.current = false;
        route.current = true;
        this.#current = route;

        // Notify (sync, cant cancel)
        if (oldRoute)
        {
            this.dispatchEvent("didLeave", false, oldRoute, route);
            oldRoute?.handler.didLeave?.(oldRoute, route);
        }
        route.handler.didEnter?.(oldRoute, route);
        this.dispatchEvent("didEnter", false, oldRoute, route);
        return true;
    }

    async matchUrl(url, state, route)
    {
        // Sort handlers
        if (this.#needSort)
        {
            this.#handlers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            this.#needSort = false;
        }

        // Create the route instance
        for (let h of this.#handlers)
        {
            // If the handler has a pattern, check it matches
            if (h.pattern)
            {
                route.match = route.url.pathname.match(h.pattern);
                if (!route.match)
                    continue;
            }

            // Call match handler
            if (h.match)
            {
                let result = await Promise.resolve(h.match(route));
                if (result === true || result == route)
                {
                    route.handler = h;
                    return route;
                }
                
                // External page load
                if (result === null)
                    return null;
            }
            else
            {
                route.handler = h;
                return route;
            }

        }

        // Dummy handler
        route.handler = {};
        return route;
    }


    #handlers = [];
    #needSort = false;
    register(handlers)
    {
        if (!Array.isArray(handlers))
            handlers = [ handlers ];

        for (let handler of handlers)
        {
            // Convert string patterns to RegExp
            if (typeof(handler.pattern) === 'string')
            {
                handler.pattern = new RegExp(urlPattern(handler.pattern));
            }

            this.#handlers.push(handler);
        }

        this.#needSort = true;
    }

    revoke(predicate)
    {
        this.#handlers = this.#handlers.filter(x => !predicate(x));
    }
}


export let router = new Router();