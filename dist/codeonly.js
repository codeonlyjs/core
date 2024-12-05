/** Converts a URL pattern string to a regular expression string
 * 
 * @param {string} pattern The URL pattern to be converted to a regular expression
 * @returns {string}
 */
function urlPattern(pattern)
{
    let rx = "^";
    let len = pattern.length;

    let allowTrailingSlash;
    for (let i=0; i<len; i++)
    {
        allowTrailingSlash = true;
        let ch = pattern[i];
        if (ch == '?')
        {
            rx += "[^\\/]";
        }
        else if (ch == '*')
        {
            if (i + 1 == len)
                rx += "(?<tail>.*)";
            else
                rx += "[^\\/]+";
        }
        else if (ch == ':')
        {
            // :id
            i++;
            let start = i;
            while (i < len && is_identifier_char(pattern[i]))
                i++;
            let id = pattern.substring(start, i);
            if (id.length == 0)
                throw new Error("syntax error in url pattern: expected id after ':'");
            
            // RX pattern suffix?
            let idrx = "[^\\/]+";
            if (pattern[i] == '(')
            {
                i++;
                start = i;
                let depth = 0;
                while (i < len)
                {
                    if (pattern[i] == '(')
                        depth++;
                    else if (pattern[i] == ')')
                    {
                        if (depth == 0)
                            break;
                        else
                            depth--;
                    }
                    i++;
                }
                if (i >= len)
                    throw new Error("syntax error in url pattern: expected ')'");

                idrx = pattern.substring(start, i);
                i++;
            }

            // Repeat suffix?
            if (i < len && (pattern[i] == '*') || pattern[i] == '+')
            {
                let repeat = pattern[i];
                i++;
                /*
                if (start < 2 || pattern[start - 2] != '/')
                    throw new Error(`'${repeat}' must follow '/'`);
                if (i < len && pattern[i] != '/')
                    throw new Error(`'${repeat}' must be at end of pattern or before '/'`);
                */

                if (pattern[i] == '/')
                {
                    rx += `(?<${id}>(?:${idrx}\\/)${repeat})`;
                    i++;
                }
                else if (repeat == '*')
                {
                    rx += `(?<${id}>(?:${idrx}\\/)*(?:${idrx})?\\/?)`;
                }
                else
                {
                    rx += `(?<${id}>(?:${idrx}\\/)*(?:${idrx})\\/?)`;
                }
                allowTrailingSlash = false;
            }
            else
            {
                rx += `(?<${id}>${idrx})`;
            }

            i--;
        }
        else if (ch == '/')
        {
            // Trailing slash is optional
            rx += '\\' + ch;
            if (i == pattern.length - 1)
            {
                rx += '?';
            }
        }
        else if (".$^{}[]()|*+?\\/".indexOf(ch) >= 0)
        {
            rx += '\\' + ch;
            allowTrailingSlash = ch != '/';
        }
        else
        {
            rx += ch;
        }
    }

    if (allowTrailingSlash)
        rx += "\\/?";

    rx += "$";

    return rx;

    function is_identifier_char(ch)
    {
        return (ch >= 'a' && ch <= 'z') || (ch >='A' && ch <= 'Z') 
            || (ch >= '0' && ch <= '9') || ch == '_' || ch == '$';
    }
}

/** Implements a simple MRU cache that can be used to cache Page components for route handlers */
class PageCache
{
    /** Constructs a new page cache
     * @param {object} options Options controlling the cache
     * @param {number} options.max The maximum number of cache entries to keep
     */
    constructor(options)
    {
        this.#options = Object.assign({
            max: 10
        }, options);
    }  

    #cache = [];
    #options;

    /** Get a cached object from the cache, or create a new one
     * @param {any} key The key for the page
     * @param {(key: any) => any} factory A callback to create the page item if not in the cache
     * @return {any}
     */
    get(key, factory)
    {
        // Unpack URL Objects
        if (key instanceof URL)
            key = key.pathname + key.query;

        // Check cache
        for (let i=0; i<this.#cache.length; i++)
        {
            let e = this.#cache[i];
            if (e.key == key)
            {
                if (i > 0)
                {
                    this.#cache.splice(i, 1);
                    this.#cache.unshift(e);
                }
                return e.page;
            }
        }

        // Create new
        let e = {
            key,
            page: factory(key),
        };
        this.#cache.unshift(e);

        // Trim size
        if (this.#cache.length > this.#options.max)
            this.#cache.splice(this.#cache);

        return e.page;
    }


}

/** @internal */
class DocumentScrollPosition
{
    static get()
    {
        {
            return { 
                top: coenv.window.pageYOffset || coenv.document.documentElement.scrollTop,
                left: coenv.window.pageXOffset || coenv.document.documentElement.scrollLeft,
            }
        }
    }
    static set(value)
    {
        {
            if (!value)
                coenv.window.scrollTo(0, 0);
            else
                coenv.window.scrollTo(value.left, value.top);
        }
    }
}

/** Convert a camelCaseName to a dashed-name
 * @internal
 * @param {string} name The name to convert
 * @returns {string}
 */

/** Invokes a callback when a target object (environment or component) has finished loading
 * @internal
 * @param {object} target The target to check
 * @param {Function} callback The callback to invoke when load finished (or immediately if not currently loading
 * @returns {void}
 */
function whenLoaded(target, callback)
{
    if (target.loading)
        target.addEventListener("loaded", callback, { once :true });
    else
        callback();
}

let frameCallbacks = [];
let needSort = false;

/**
 * Invokes a callback on the next update cycle
 * 
 * @param {() => void} callback The callback to be invoked
 * @param {Number} [order] The priority of the callback in related to others (lowest first, default 0)
 * @returns {void}
 */
function nextFrame(callback, order)
{
    if (!callback)
        return;

    // Resolve order and track if sort needed
    order = order ?? 0;
    if (order != 0)
        needSort = true;

    // Add callback
    frameCallbacks.push({
        callback, 
        order
    });

    // If it's the first one, request animation callback
    if (frameCallbacks.length == 1)
    {
        coenv.window.requestAnimationFrame(function() {

            // Capture pending callbacks
            let pending = frameCallbacks;
            if (needSort)
            {
                // Reverse order because we iterate in reverse below
                pending.sort((a,b) => b.order - a.order);   
                needSort = false;
            }
            
            // Reset 
            frameCallbacks = [];

            // Dispatch
            for (let i=pending.length - 1; i>=0; i--)
                pending[i].callback();

        });
    }
}

/** @internal */
class ViewStateRestoration
{
    constructor(router)
    {
        this.#router = router;

        // Disable browser scroll restoration
        if (coenv.window.history.scrollRestoration) {
           coenv.window.history.scrollRestoration = "manual";
        }

        // Reload saved view states from session storage
        let savedViewStates = coenv.window.sessionStorage.getItem("codeonly-view-states");
        if (savedViewStates)
        {
            this.#viewStates = JSON.parse(savedViewStates);
        }

        router.addEventListener("mayLeave", (from, to) => {
            this.captureViewState();
            return true;
        });

        router.addEventListener("mayEnter", (from, to) => {
            if (to.navMode != 'push')
                to.viewState = this.#viewStates[to.state.sequence];
        });

        router.addEventListener("didEnter", (from, to) => {

            if (to.navMode == "push")
            {
                // Clear any saved view states that can never be revisited
                for (let k of Object.keys(this.#viewStates))
                {
                    if (parseInt(k) > to.state.sequence)
                    {
                        delete this.#viewStates[k];
                    }
                }
                this.saveViewStates();
            }
            // Load view state
            whenLoaded(coenv, () => {
                nextFrame(() => {

                    // Restore view state
                    if (to.handler.restoreViewState)
                        to.handler.restoreViewState(to.viewState, to);
                    else if (this.#router.restoreViewState)
                        this.#router.restoreViewState?.(to.viewState, to);
                    else
                        DocumentScrollPosition.set(to.viewState);

                    // Jump to hash
                    {
                        let elHash = document.getElementById(to.url.hash.substring(1));
                        elHash?.scrollIntoView();
                    }
                });
            });
        });

        coenv.window.addEventListener("beforeunload", (event) => {
            this.captureViewState();
        });

    }

    #router;
    #viewStates = {};

    captureViewState()
    {
        let route = this.#router.current;
        if (route)
        {
            if (route.handler.captureViewState)
                this.#viewStates[route.state.sequence] = route.handler.captureViewState(route);
            else if (this.#router.captureViewState)
                this.#viewStates[route.state.sequence] = this.#router.captureViewState?.(route);
            else
                this.#viewStates[route.state.sequence] = DocumentScrollPosition.get();
        }
        this.saveViewStates();
    }
    saveViewStates()
    {
        coenv.window.sessionStorage.setItem("codeonly-view-states", JSON.stringify(this.#viewStates));
    }
}

/** @internal */
class WebHistoryRouterDriver
{
    async start(router)
    {
        this.#router = router;

        // Connect view state restoration
        new ViewStateRestoration(router);

        // Listen for clicks on links
        coenv.document.body.addEventListener("click", (ev) => {
            if (ev.defaultPrevented)
                return;
            let a = ev.target.closest("a");
            if (a)
            {
                if (a.hasAttribute("download"))
                    return;

                let href = a.getAttribute("href");
                let url = new URL(href, coenv.window.location);
                if (url.origin == coenv.window.location.origin)
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
        coenv.window.addEventListener("popstate", async (event) => {

            if (this.#ignoreNextPop)
            {
                this.#ignoreNextPop = false;
                return;
            }

            // Load
            let loadId = this.#loadId + 1;
            let url = this.#router.internalize(new URL(coenv.window.location));
            let state = event.state ?? { sequence: this.current.state.sequence + 1 };
            if (!await this.load(url, state, { navMode: "pop" }))
            {
                // Load was cancelled, adjust web history position
                // but only if there hasn't been another load/navigation
                // since
                if (loadId == this.#loadId)
                {
                    this.#ignoreNextPop = true;
                    coenv.window.history.go(this.current.state.sequence - state.sequence);
                }
            }
        });


        // Do initial navigation
        let url = this.#router.internalize(new URL(coenv.window.location));
        let state = coenv.window.history.state ?? { sequence: 0 };
        let route = await this.load(url, state, { navMode: "start" });
        coenv.window.history.replaceState(state, null);
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
            let url = new URL("/", this.#router.internalize(new URL(coenv.window.location)));
            let state = { sequence: 0 };

            coenv.window.history.replaceState(
                state, 
                "", 
                this.#router.externalize(url),
                );

            this.load(url, state, { navMode: "replace" });
        }
        else
        {
            coenv.window.history.back();
        }
    }

    replace(url)
    {
        if (typeof(url) === 'string')
            url = new URL(url, this.#router.internalize(new URL(coenv.window.location)));

        if (url !== undefined)
        {
            this.current.pathname = url.pathname;
            this.current.url = url;
            url = this.#router.externalize(url).href;
        }

        coenv.window.history.replaceState(
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
            url = new URL(url, this.#router.internalize(new URL(coenv.window.location)));
        }

        // Load the route
        let route = await this.load(url, 
            { sequence: this.current.state.sequence + 1 }, 
            { navMode: "push" }
            );
        if (!route)
            return route;

        // Update history
        coenv.window.history.pushState(
            route.state, 
            "", 
            this.#router.externalize(url)
        );
        return route;
    }
}

/**
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
 * @typedef {object} RouteHandler
 * @property {string | RegExp} [pattern] A string pattern or regular expression to match URL pathnames to this route handler
 * @property {MatchCallback} [match] A callback to confirm the URL match
 * @property {RouterEventAsync} [mayEnter] Notifies that a route for this handler may be entered
 * @property {RouterEventAsync} [mayLeave] Notifies that a route for this handler may be left
 * @property {RouterEventSync} [didEnter] Notifies that a route for this handler has been entered
 * @property {RouterEventSync} [didLeave] Notifies that a route for this handler has been left
 * @property {RouterEventSync} [cancelEnter] Notifies that a route that could have been entered was cancelled
 * @property {RouterEventSync} [cancelLeave] Notifies that a route that could have been left was cancelled
 * @property {Number} [order] Order of this route handler when compared to all others (default = 0, lowest first)
 * @property {CaptureViewStateCallback} [captureViewState] A callback to capture the view state for this route handler's routes
 * @property {RestoreViewStateCallback} [restoreViewState] A callback to restore the view state for this route handler's routes
 */

/**
 * @callback MatchCallback
 * @param {Route} route The route to match to
 * @returns {Promise<boolean>}
 */

/**
 * @callback RouterEventAsync
 * @param {Route} from The route being left
 * @param {Route} to The route being entered
 * @returns {Promise<boolean>}
 */

/**
 * @callback RouterEventSync
 * @param {Route} from The route being left
 * @param {Route} to The route being entered
 * @returns {void}
 */

/**
 * @callback RevokeRouteHandlerPredicate
 * @param {RouteHandler} handler The handler being queried
 * @returns {boolean} Return true from the handler
 */

/**
 * @callback CaptureViewStateCallback
 * @param {Route} route The route whose view state is being captured
 * @returns {Object} The captured view state
 */

/**
 * @callback RestoreViewStateCallback
 * @param {Route} route The route whose view state is being restored
 * @param {Object} viewState The previously captured view state to be restored
 */


/** The Router class - handles URL load requests, creating
 route objects using route handlers and firing associated
 events
*/
class Router
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
     * @param {RouteHandler | RouteHandler[]} handler The handler or handlers to register
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
     * @param {RevokeRouteHandlerPredicate} predicate Callback passed each route handler, return true to remove
     */
    revoke(predicate)
    {
        this.#handlers = this.#handlers.filter(x => !predicate(x));
    }

    /** a callback to capture the view state for this route handler's routes 
     * @type {CaptureViewStateCallback}
     */
    captureViewState;

    /** a callback to restore the view state for this route handler's routes
     * @type {RestoreViewStateCallback}
     */
    restoreViewState;
}


/** The default {@link Router} instance */
let router = new Router();

/** Provides URL internalization and externalization */
class UrlMapper
{
    /** Constructs a new Url Mapper
     * @param {object} options Options for how to map URLs
     * @param {string} options.base The base URL of the external URL
     * @param {boolean} options.hash True to use hashed URLs
     */
    constructor(options)
    {
        this.options = options;
        if (this.options.base && 
            (!this.options.base.startsWith("/") ||
             !this.options.base.endsWith("/")))
        {
            throw new Error(`UrlMapper base '${this.options.base}' must start and end with '/'`);
        }
    }

    /** Internalizes a URL
     *
     * @param {URL} url The URL to internalize
     * @returns {URL}
     */
    internalize(url)
    {
        if (this.options.base)
        {
            if (!url.pathname.startsWith(this.options.base))
                throw new Error(`Can't internalize url '${url}'`);
            
            url = new URL(url);
            url.pathname = url.pathname.substring(this.options.base.length-1);
        }

        if (this.options.hash)
        {
            if (url.pathname != "/")
                throw new Error(`can't internalize url "${url.href}"`);
            let hash = url.hash.substring(1);
            if (!hash.startsWith("/"))
                hash = "/" + hash;
            url = new URL(`${url.origin}${hash}`);
        }

        return url;
    }

    /** Externalizes a URL
     *
     * @param {URL} url The URL to externalize
     * @param {boolean} [asset] If true, ignores the hash option (used to externalize asset URLs with base only)
     * @returns {URL}
     */
    externalize(url, asset)
    {
        if (!asset && this.options.hash)
        {
            url = new URL(`${url.origin}/#${url.pathname}${url.search}${url.hash}`);
        }

        if (this.options.base)
        {
            url = new URL(url);
            url.pathname = this.options.base.slice(0, -1) + url.pathname;
        }
        return url;
    }
}

/** Fetchs a text asset
 * 
 *  In the browser, issues a fetch request for an asset
 *  On the server, uses fs.readFile to load a local file asset
 *
 *  The asset path must be absolute (start with a '/') and is
 *  resolved relative to the project root.
 * 
 * @param {string} path The path of the asset to fetch
 * @returns {Promise<string>}
 */
async function fetchTextAsset(path)
{
    if (!path.startsWith("/"))
        throw new Error("asset paths must start with '/'");

    // Externalize URL
    if (router.urlMapper)
    {
        let url = new URL(path, new URL(coenv.window.location));
        url = router.urlMapper.externalize(url, true);
        path = url.pathname + url.search;
    }

    // Fetch it
    return coenv.fetchTextAsset(path);
}

/** Fetchs a JSON asset
 * 
 *  In the browser, issues a fetch request for an asset
 *  On the server, uses fs.readFile to load a local file asset
 *
 *  The asset path must be absolute (start with a '/') and is
 *  resolved relative to the project root.
 * 
 * @param {string} path The path of the asset to fetch
 * @returns {Promise<object>}
 */
async function fetchJsonAsset(path)
{
    return JSON.parse(await fetchTextAsset(path));
}

export { DocumentScrollPosition, PageCache, Router, UrlMapper, ViewStateRestoration, WebHistoryRouterDriver, fetchJsonAsset, fetchTextAsset, router, urlPattern };
