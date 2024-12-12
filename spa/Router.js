import { urlPattern } from "./urlPattern.js";
import { WebHistoryRouterDriver } from "./WebHistoryRouterDriver.js";


/**
 * Represents a Route instance
 * @typedef {object} Route
 * @property {URL} url The route's URL
 * @property {Object} state State associated with the route
 * @property {boolean} current True when this is the current route
 * @property {RouteHandler} handler The handler associated with this route
 * @property {Object} [viewState] The route's view state
 * @property {Object} [page] The page component for this route
 * @property {string} [title] The route's page title
 */

/**
 * RouteHandlers handle mapping URLs to Route instances
 * @typedef {object} RouteHandler
 * @property {string | RegExp} [pattern] A string pattern or regular expression to match URL pathnames to this route handler
 * @property {(route: Route) => Promise<boolean>} [match] A callback to confirm the URL match
 * @property {(from: Route, to: Route) => Promise<boolean>} [mayEnter] Notifies that a route for this handler may be entered
 * @property {(from: Route, to: Route) => Promise<boolean>} [mayLeave] Notifies that a route for this handler may be left
 * @property {(from: Route, to: Route) => boolean} [didEnter] Notifies that a route for this handler has been entered
 * @property {(from: Route, to: Route) => boolean} [didLeave] Notifies that a route for this handler has been left
 * @property {(from: Route, to: Route) => boolean} [cancelEnter] Notifies that a route that could have been entered was cancelled
 * @property {(from: Route, to: Route) => boolean} [cancelLeave] Notifies that a route that could have been left was cancelled
 * @property {Number} [order] Order of this route handler when compared to all others (default = 0, lowest first)
 * @property {(route: Route) => object} [captureViewState] A callback to capture the view state for this route handler's routes
 * @property {(route: Route, state: object) => void} [restoreViewState] A callback to restore the view state for this route handler's routes
 */



/** 
 * The Router class - handles URL load requests, creating
 * route objects using route handlers and firing associated
 * events
 */
export class Router
{   
    /** Constructs a new Router instance 
     * @param {RouteHandler[]} handlers An array of router handlers to initially register
     */
    constructor(handlers)
    {
        if (handlers)
            this.register(handlers);
    }

    /** Starts the router, using the specified driver
     * @param {object} driver The router driver to use
     * @returns {any} The result returned from the driver's start method
     */
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
            /** 
             * Navigates to a new URL
             * @param {URL | string} url The external URL to navigate to
             * @returns {Promise<Route>}
             */
            this.navigate = driver.navigate.bind(driver);

            /**
             * Replaces the current URL, without performing a navigation
             * @param {URL | string} url The new URL to display
             * @returns {void}
             */
            this.replace = driver.replace.bind(driver);

            /**
             * Navigates back one step in the history, or if there is 
             * no previous history navigates to the root URL
             * @returns {void}
             */
            this.back = driver.back.bind(driver);
        }
        return this.#driver.start(this);
    }

    /**
     * An option URL mapper to be used for URL internalization and
     * externalization.
     * @type {UrlMapper}
     */
    urlMapper;

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

    /** Internalizes a URL
     * @param {URL | string} url The URL to internalize
     * @returns { URL | string}
     */
    internalize(url) { return this.#mapUrl(url, "internalize"); }

    /** Externalizes a URL
     * @param {URL | string} url The URL to internalize
     * @returns { URL | string}
     */
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

    /** The current route object
     * @type {Route}
     */
    get current()
    {
        return this.#current;
    }

    /** The route currently being navigated to
     * @type {Route}
     */
    get pending()
    {
        return this.#pending;
    }

    /** Adds an event listener
     * 
     * Available events are:
     *   - "mayEnter", "mayLeave" (async, cancellable events)
     *   - "didEnter" and "didLeave" (sync, non-cancellable events)
     *   - "cancel" (sync, notification only)
     *
     * @param {string} event The event to listen to
     * @param {RouterEventAsync | RouterEventSync} handler The event handler function
     */
    addEventListener(event, handler)
    {
        this.#listeners.push({ event, handler });
    }

    /** Removes a previously added event handler
     *
     * @param {string} event The event to remove the listener for
     * @param {RouterEventAsync | RouterEventSync} handler The event handler function to remove
     */
    removeEventListener(event, handler)
    {
        let index = this.#listeners.findIndex(x => x.event == event && x.handler == handler);
        if (index >= 0)
            this.#listeners.splice(index, 1);
    }

    /** @private */
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

    /** @private */
    async load(url, state, route)
    {
        return coenv.load(async () => {

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

    /** @private */
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
    /** @private */
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

    /** @private */
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

    /** Registers one or more route handlers with the router
     * @param {RouteHandler | RouteHandler[]} handlers The handler or handlers to register
     */
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

    /** Revoke previously used handlers by matching to a predicate
     * @param {(handler: RouteHandler) => boolean} predicate Callback passed each route handler, return true to remove
     */
    revoke(predicate)
    {
        this.#handlers = this.#handlers.filter(x => !predicate(x));
    }

    /** a callback to capture the view state for this route handler's routes 
     * @type {(route: Route) => object}
     */
    captureViewState;

    /** a callback to restore the view state for this route handler's routes
     * @type {(route: Route, state: object) => void}
     */
    restoreViewState;
}


/**
 * Default {@link Router | Router} Instance
 */
export let router = new Router();