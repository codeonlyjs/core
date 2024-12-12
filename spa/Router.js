import { urlPattern } from "./urlPattern.js";
import { WebHistoryRouterDriver } from "./WebHistoryRouterDriver.js";


/**
 * Route objects store information about the current navigation, including the 
 * URL, the matched handler and anything else the handler wants to associate with 
 * the route.

 * @typedef {object} Route
 * @property {URL} url 
 * 
 * The route's internalized URL.
 * 
 * @property {Object} state 
 * 
 * State associated with the route.
 * 
 * The router stores important information in the state object so the clients
 * should never edit settings in the state object.  An application can however
 * store additional information in the state object, by setting properties on
 * it and then calling the {@linkcode Router#replace} method.
 * 
 * 
 * @property {boolean} current 
 * 
 * `true` when this is the current route.
 * 
 * There will only ever be one current route.
 * 
 * @property {RouteHandler} handler 
 * 
 * The {@linkcode RouteHandler} associated with this route.
 * 
 * @property {Object} [viewState] 
 * 
 * The route's view state.
 * 
 * This information will be available on the Route object once
 * the `mayEnter` event has been fired by the Router.
 * 
 * By default the web history router driver will save and restore the current document
 * scroll position but applications can save and restore additional custom information
 * as necessary. For more information see [View State Restoration](routerDetails#view-state-restoration).
 * 
 * @property {Object} [page] 
 * 
 * The page component for this route.  
 * 
 * CodeOnly nevers sets or uses this property, but it is included here because
 * by convention, most applications will set a `page` property.
 * 
 * @property {string} [title] The route's page title
 * 
 * CodeOnly nevers sets or uses this property, but it is included here because
 * by convention, most applications will set a `title` property.
 * 
 */

/**
 * A route handler is an object that handles the navigation to and from a particular URL.
 * 
 * Route handlers are registered with the router during app startup and are called by the 
 * router when a URL is loaded and needs to be matched to a particular handler.
 * 
 * When a route handler matches a URL it will usually store additional information on the 
 * {@linkcode Route} object that describes the component or page to be displayed for that 
 * URL along with any other information the handler or the application might find useful.
 * 
 * See [Route Handlers](routerDetails#route-handlers) for more information.
 * @typedef {object} RouteHandler
 * @property {string | RegExp} [pattern] A string pattern (see {@linkcode urlPattern}) or regular expression to match URL pathnames to this route handler. If not specified, all URL's will match.
 * @property {(route: Route) => Promise<boolean>} [match] A callback to confirm the URL match. If not specified all URL's matching the pattern will be considered matches.
 * @property {(from: Route, to: Route) => Promise<boolean>} [mayEnter] Notifies that a route for this handler may be entered.
 * @property {(from: Route, to: Route) => Promise<boolean>} [mayLeave] Notifies that a route for this handler may be left.
 * @property {(from: Route, to: Route) => boolean} [didEnter] Notifies that a route for this handler has been entered.
 * @property {(from: Route, to: Route) => boolean} [didLeave] Notifies that a route for this handler has been left.
 * @property {(from: Route, to: Route) => boolean} [cancelEnter] Notifies that a route that may have been entered was cancelled.
 * @property {(from: Route, to: Route) => boolean} [cancelLeave] Notifies that a route that may have been left was cancelled.
 * @property {Number} [order] Order of this route handler in relation to all others (default = 0, lowest first).
 * @property {(route: Route) => object} [captureViewState] A callback to capture the view state for this route handler's routes.
 * @property {(route: Route, state: object) => void} [restoreViewState] A callback to restore the view state for this route handler's routes.
 */



/** 
 * A Router handles URL load requests, by creating route objects matching them to
 * route handlers and firing associated events.
 */
export class Router
{   
    /** 
     * Constructs a new Router instance 
     * 
     * @param {RouteHandler[]} handlers 
     * 
     * An array of router handlers to initially register, however usually
     * handlers are registered using the {@link Router#register} method.
     */
    constructor(handlers)
    {
        if (handlers)
            this.register(handlers);
    }

    /** 
     * Starts the router, using the specified driver
     * 
     * @param {object | null} driver The router driver to use, or `null` to use the default Web History router driver.
     * @returns {Promise<any>} The result returned from the driver's start method (usually the initially navigated {@linkcode Route} object).
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
             * Navigates to a new URL.
             * @type {(url: URL | string) => Promise<Route>}
             */
            this.navigate = driver.navigate.bind(driver);

            /**
             * Replaces the current URL, without performing a navigation.
             * @type {(url: URL | string) => void} url The new URL to display
             */
            this.replace = driver.replace.bind(driver);

            /**
             * Navigates back one step in the history, or if there is 
             * no previous history navigates to the root URL.
             * @type {() => void}
             */
            this.back = driver.back.bind(driver);
        }
        return this.#driver.start(this);
    }

    /**
     * An optional URL mapper to be used for URL internalization and
     * externalization.
     * 
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

    /** 
     * Internalizes a URL.
     * 
     * @param {URL | string} url The URL to internalize
     * @returns { URL | string}
     */
    internalize(url) { return this.#mapUrl(url, "internalize"); }

    /** 
     * Externalizes a URL.
     * 
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

    /** 
     * The current route object.
     * @type {Route}
     */
    get current()
    {
        return this.#current;
    }

    /** 
     * The route currently being navigated to, but not yet committed.
     * @type {Route}
     */
    get pending()
    {
        return this.#pending;
    }

    /** 
     * Adds an event listener.
     * 
     * Available events are:
     *   - `mayEnter`, `mayLeave` async, cancellable
     *   - `didEnter`, `didLeave` sync, non-cancellable
     *   - `cancel` - sync, notification only
     *
     * The async cancellable events should return `Promise<boolean>` where a 
     * resolved value of `false` cancels the navigation.
     * 
     * All event handlers receive two arguments a `from` and `to` route object.  For the
     * initial page load, the `from` parameter will be `null`.
     * 
     * @param {string} event The event to listen to
     * @param {RouterEventAsync | RouterEventSync} handler The event handler function
     */
    addEventListener(event, handler)
    {
        this.#listeners.push({ event, handler });
    }

    /** 
     * Removes a previously registered event handler.
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

    /** 
     * Registers one or more route handlers.
     * 
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

    /** 
     * Revoke previously registered handlers that match a predicate callback.
     * 
     * @param {(handler: RouteHandler) => boolean} predicate Callback passed each route handler, return `true` to remove
     */
    revoke(predicate)
    {
        this.#handlers = this.#handlers.filter(x => !predicate(x));
    }

    /** 
     * A callback to capture the view state for a route.
     * 
     * @type {(route: Route) => object}
     */
    captureViewState;

    /** 
     * A callback to restore the view state for a route.
     * 
     * @type {(route: Route, state: object) => void}
     */
    restoreViewState;
}


/**
 * Default {@link Router} instance.
 * 
 * Nearly all applications only ever need a single router
 * instance and can use this pre-created instance.
 */
export let router = new Router();