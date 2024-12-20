declare module "@codeonlyjs/core" {
    /**
     * Sets an environment provider.
     *
     * @param {() => Environment} value A callback to provide the current environment object
     * @returns {void}
     */
    export function setEnvProvider(value: () => Environment): void;
    /**
     * The base class for all environment types
     *
     * The environment object is available via the globally declared `coenv`
     * variable.
     *
     * * In the browser, there is a single environment object that
     *   represents the browser.
     * * When rendering, there are multiple environment objects, one per render
     *   request.
     *
     * Never modify, nor cache the environment object as it can (and will) change
     * from request to request in a server environment.
     *
     * @extends {EventTarget}
     */
    export class Environment extends EventTarget {
        /**
         * True when running in browser environment.
         */
        browser: boolean;
        /**
         * True when running in a rendering environment.
         */
        ssr: boolean;
        /**
         * Notifies the environment that an async load operation is starting.
         *
         * Environment level loading notifications are used when rendering to
         * determine when the initial page load has completed and rendering
         * can commence.
         *
         * @returns {void}
         */
        enterLoading(): void;
        /**
         * Notifies the environment that an async load operation has finished.
         *
         * @returns {void}
         */
        leaveLoading(): void;
        /**
         * Returns `true` if there are in progress async load operations.
         *
         * @type {boolean}
         */
        get loading(): boolean;
        /**
         * Runs an async data load operation.
         *
         * @param {() => Promise<any>} callback A callback that performs the data load
         * @returns {Promise<any>}
         */
        load(callback: () => Promise<any>): Promise<any>;
        /**
         * Returns a promise that resolves when any pending load operations have finished.
         * @returns {Promise<void>}
         */
        untilLoaded(): Promise<void>;
    }
    /**
     * Marks a string as being raw HTML instead of plain text
     *
     * Normally strings passed to templates are treated as plain text.  Wrapping
     * a value by calling this function indicates the string should be treated as
     * raw HTML instead.
     *
     * See [Text and HTML](templateText) for more information.
     *
     * @param {string | (...args: any[]) => string} html The HTML value to be wrapped, or a function that returns a string
     * @returns {HtmlString}
     */
    export function html(html: string | ((...args: any[]) => string)): HtmlString;
    /** Contains a HTML string
     */
    export class HtmlString {
        /**
         * Compares two values and returns true if they
         * are both HtmlString instances and both have the
         * same inner `html` value.
         * @param {any} a The first value to compare
         * @param {any} b The second value to compare
         * @returns {boolean}
         */
        static areEqual(a: any, b: any): boolean;
        /** Constructs a new HtmlString object
         * @param {string} html The HTML string
         */
        constructor(html: string);
        /** The HTML string
         * @type {string}
         */
        html: string;
    }
    /** Declares a CSS style string to be added to the `<head>` block
     *
     * This function is intended to be used as a template literal tag
     * @param {string[]} strings The CSS to be added
     * @param {string[]} values The interpolated string values
     * @returns {void}
     */
    export function css(strings: string[], values: string[]): void;
    /** Utility functions for working with CSS styles
     */
    export class Style {
        /** Declares a CSS style string to be added to the `<head>` block
         * @param {string} css The CSS string to be added
         * @returns {void}
         */
        static declare(css: string): void;
    }
    /**
     * Components are the primary building block for constructing CodeOnly
     * applications. They encapsulate program logic, a DOM template
     * and an optional a set of CSS styles.
     *
     * Components can be used either in the templates of other components
     * or mounted onto the document DOM to appear in a web page.
     *
     * See also [Component Basics](components).
     *
     * @extends EventTarget
     */
    export class Component extends EventTarget {
        /**
         * Gets the {@linkcode DomTreeConstructor} for this component class.
         *
         * The DomTreeConstructor is the constructor function used to
         * create {@linkcode DomTree} instances for this component class.
         *
         * The first time this property is accessed, it calls the
         * static {@linkcode Component.onProvideDomTreeConstructor} method to
         * provide the instance.
         *
         * @type {DomTreeConstructor}
         */
        static get domTreeConstructor(): DomTreeConstructor;
        /**
         * Provides the {@linkcode DomTreeConstructor} to be used by this
         * component class.
         *
         * This method is called once per component class and should provide
         * a constructor function that can create DomTree instances.
         * @returns {DomTreeConstructor}
         */
        static onProvideDomTreeConstructor(): DomTreeConstructor;
        /**
         * Provides the template to be used by this component class.
         *
         * This method is called once per component class and should provide
         * the template to be compiled for this component class.
         */
        static onProvideTemplate(): {};
        /**
         * Returns `true` if every instance of this component class will only
         * ever have a single root node.
         *
         * @type {boolean}
         */
        static get isSingleRoot(): boolean;
        /**
         * The template to be used by this component class
         */
        static template: {};
        /**
         * Immediately updates this component's DOM elements - even if
         * the component is not marked as invalid.
         *
         * Does nothing if the component's DOM elements haven't been created.
         *
         * If the component has been invalidated, returns it to the valid state.
         *
         * This method is bound to the component instance and can be used
         * directly as the handler for an event listener to update the
         * component when an event is triggered.
         *
         * @returns {void}
         */
        update(): void;
        /**
         * Invalidates this component, marking it as requiring a DOM update.
         *
         * Does nothing if the component hasn't yet been created.
         *
         * This method is bound to the component instance and can be used
         * directly as the handler for an event listener to invalidate the
         * component when an event is triggered.
         *
         * @returns {void}
         */
        invalidate(): void;
        /**
         * Ensures this component's {@link DomTree} has been created.
         *
         * Calling this method does nothing if the DomTree is already created.
         *
         * @returns {void}
         */
        create(): void;
        /**
         * Returns true if this component's {@link DomTree} has been created.
         *
         * @type {boolean}
         */
        get created(): boolean;
        /**
         * Gets the {@linkcode DomTree} for this component, creating it if necessary.
         *
         * @type {DomTree}
        */
        get domTree(): DomTree;
        /**
         * Returns true if this component instance is guaranteed to always only
         * have a single root node.
         *
         * @type {boolean}
         */
        get isSingleRoot(): boolean;
        /**
         * Returns the single root node of this component (if it is a single
         * root node component).
         *
         * @type {Node}
         */
        get rootNode(): Node;
        /**
         * Returns an array of root DOM nodes for this element, creating them if necessary.
         *
         * @type {Node[]}
        */
        get rootNodes(): Node[];
        /**
         * Indicates if this component in invalid.
         *
         * A component is invalid if it has been invalidated by
         * a previous call to {@linkcode Component#invalidate} and
         * hasn't yet be updated.
         *
         * @type {boolean}
         */
        get invalid(): boolean;
        /**
         * Updates this component if it has been marked as invalid
         * by a previous call to {@linkcode Component#invalidate}.
         *
         * @returns {void}
         */
        validate(): void;
        /**
         * Sets the error object associated with the current call to {@linkcode Component#load}.
         *
         * @param {Error | null} value The new error object
         */
        set loadError(value: Error | null);
        /**
         * Gets the error object thrown during the last call to {@linkcode Component#load}.
         *
         * @type {Error | null}
        */
        get loadError(): Error | null;
        /**
         * Indicates if the component is currently in an {@linkcode Component#load} operation.
         *
         * @type {boolean}
         */
        get loading(): boolean;
        /**
         * Performs an async data load operation.
         *
         * The callback function is an async function that performs an async data load.
         * While in the callback, the {@link Component#loading} property returns `true`.
         *
         * If the callback throws an error, it will be captured to the {@link Component#loadError}
         * property.
         *
         * Before calling and after returning from the callback, the component is
         * invalidated so visual elements (eg: spinners) can be updated.
         *
         * If the silent parameter is `true` the {@link Component#loading} property isn't set and
         * the component is only invalidated after returning from the callback.
         *
         * @param {() => Promise<any>} callback The callback to perform the load operation
         * @param {Boolean} [silent] Whether to perform a silent update
         * @returns {Promise<any>} The result of the callback
         */
        load(callback: () => Promise<any>, silent?: boolean): Promise<any>;
        /**
         * Destroys this component's {@linkcode DomTree} returning it to
         * the constructed, but non-created state.
         *
         * A destroyed component can be re-created by remounting it
         * or by calling its {@link Component#create} method.
         *
         * @returns {void}
         */
        destroy(): void;
        /**
         * Notifies a component that is has been mounted.
         *
         * Override this method to receive the notification.  External
         * resources should be acquired when the component is mounted.
         * (eg: adding event listeners to external objects)
         *
         * @returns {void}
         */
        onMount(): void;
        /**
         * Notifies a component that is has been unmounted.
         *
         * Override this method to receive the notification.  External
         * resources should be released when the component is unmounted.
         * (eg: removing event listeners from external objects)
         *
         * @returns {void}
         */
        onUnmount(): void;
        /**
         * Registers an event listener to be automatically added to an object when
         * when the component is mounted, and removed when unmounted.
         *
         * @param {object} target Any object that supports addEventListener and removeEventListener
         * @param {string} event The event to listen to
         * @param {Function} [handler] The event handler to add.  If not provided, the component's {@link Component#invalidate} method is used.
         * @returns {void}
         */
        listen(target: object, event: string, handler?: Function): void;
        /**
         * Removes an event listener previously registered with {@link Component#listen}
         *
         * @param {object} target Any object that supports addEventListener and removeEventListener
         * @param {string} event The event being listened to
         * @param {Function} [handler] The event handler to remove.  If not provided, the component's {@link Component#invalidate} method is used.
         * @returns {void}
         */
        unlisten(target: object, event: string, handler?: Function): void;
        /**
         * Returns `true` if the component is currently mounted.
         *
         * @type {boolean}
         */
        get mounted(): boolean;
        /**
         * Notifies the object it has been mounted or unmounted
         *
         * @param {boolean} mounted `true` if the object has been mounted, `false` if unmounted
         */
        setMounted(mounted: boolean): void;
        /**
         * Mounts this component against an element in the document.
         *
         * @param {Element | string} el The element or an element selector that specifies where to mount the component
         * @returns {void}
         */
        mount(el: Element | string): void;
        /**
         * Unmounts this component
         *
         * @returns {void}
         */
        unmount(): void;
    }
    /**
     * Compiles a template into a {@link DomTreeConstructor} function.
     *
     * Usually templates are automatically compiled by Components and this
     * function isn't used directly.   For more information, see
     * [Template Internals](templateInternals).
     *
     * @param {object} rootTemplate The template to be compiled
     * @returns {DomTreeConstructor}
     */
    export function compileTemplate(rootTemplate: object, options: any): DomTreeConstructor;
    /**
     * Invokes a callback on the next update cycle.
     *
     * @param {() => void} callback The callback to be invoked.
     * @param {Number} [order] The priority of the callback in related to others (lowest first, default 0).
     * @returns {void}
     */
    export function nextFrame(callback: () => void, order?: number): void;
    /**
     * Invokes a callback after all other nextFrame callbacks have been invoked, or
     * immediately if there are no pending nextFrame callbacks.
     * @param {() => void} callback The callback to invoke
     * @returns {void}
     */
    export function postNextFrame(callback: () => void): void;
    /**
     * Check if there are any pending nextFrame callbacks
     * @returns {boolean}
     */
    export function anyPendingFrames(): boolean;
    /** Declares addition settings transition directives
     * @param {{TransitionOptions | string | Function}[]} options
     */
    export function transition(...options: any[]): {
        (...args: any[]): any;
        withTransition(context: any): any;
    };
    /**
     * Options for controlling behaviour of transitions.
     *
     * See [Transition Options](templateTransitions#transition-options) for more information.
     */
    export type TransitionOptions = {
        /**
         * The value callback that triggers the animation when it changes
         */
        value: (model: object, context: object) => any;
        /**
         * Transition order - "concurrent", "enter-leave" or "leave-enter"
         */
        mode?: string;
        /**
         * Transition name - used as prefix to CSS class names, default = "tx"
         */
        name?: void;
        /**
         * A map of class name mappings.
         */
        classNames?: object;
        /**
         * The duration of the animation in milliseconds.
         */
        duration?: number;
        /**
         * Whether to monitor the element's sub-trees for animations.
         */
        subtree?: boolean;
    };
    /**
     * Implemented by objects that handle transitions
     */
    export type TransitionHandler = {
        /**
         * Registers the nodes that will be transitioned in
         */
        enterNodes: (nodes: Node[]) => void;
        /**
         * Registers the nodes that will be transitioned out
         */
        leaveNodes: (nodes: Node[]) => void;
        /**
         * Registers a callback to be invoked when entry nodes should be added
         */
        onWillEnter: () => void;
        /**
         * Registers callback to be invoked when leaving nodes can be removed
         */
        onDidLeave: () => void;
        /**
         * Instructs the TransitionHandler to start the transition
         */
        start: () => void;
        /**
         * Instructs the TranstitionHandler to cancel any pending transition and complete all callbacks.
         */
        finish: () => void;
    };
    /**
     * Entry point into the fluent template builder API
     *
     * The API to the fluent object is dynamic and can't be documented
     * as a typical API interface.
     *
     * See the (Fluent Templates](templateFluent) for how to use this API.
     *
     * @type {any}
     */
    export let $: any;
    /**
     * Creates a new notify service instance.
     *
     * Usuauly notify instances don't need to be created and the
     * default {@link notify} instance can be used directly.
     *
     * @returns {INotify}
     */
    export function Notify(): INotify;
    /**
     * Default {@link Notify | Notify} Instance
     * @type {INotify}
     */
    export let notify: INotify;
    /**
     * Encodes a string to make it safe for use in HTML.
     *
     * @param {string} str The string to encode
     * @returns {string}
     */
    export function htmlEncode(str: string): string;
    /**
     * Declares additional settings for bi-direction input field binding.
     *
     * See {@linkcode InputOptions} for available options.
     *
     * See [Input Bindings](templateInput) for more information.
     *
     * @param {InputOptions} options Additional input options
     * @returns {object}
     */
    export function input(options: InputOptions): object;
    /**
     * Options for controlling input bindings.
     *
     * If the {@linkcode InputOptions#get} and {@linkcode InputOptions#set} handlers are specified
     * they override both {@linkcode InputOptions#target} and {@linkcode InputOptions#prop} which are no
     * longer used.
     */
    export type InputOptions = {
        /**
         * The name of the event (usually "change" or "input") to trigger the input binding.  If not specified, "input" is used.
         */
        event: string;
        /**
         * The name of the property on the target object.
         */
        prop?: string;
        /**
         * The target object providing the binding property.  If not specified, the template's {@linkcode DomTreeContext#model} object is used.
         */
        target?: string | ((model: object) => string);
        /**
         * Format the property value into a string for display.
         */
        format?: (value: any) => string;
        /**
         * Parse a display string into a property value.
         */
        parse?: (value: string) => any;
        /**
         * Get the value of the property.
         */
        get?: (model: any, context: any) => any;
        /**
         * Set the value of the property.
         */
        set?: (model: any, value: any, context: any) => void;
        /**
         * A callback to be invoked when the property value is changed by the user.
         */
        on_change?: (model: any, event: Event) => any;
    };
    /**
     * Converts a URL pattern string to a regular expression string.
     *
     * @param {string} pattern The URL pattern to be converted to a regular expression
     * @returns {string}
     */
    export function urlPattern(pattern: string): string;
    /**
     * Implements a simple MRU cache that can be used to cache page components used by route handlers.
     */
    export class PageCache {
        /**
         * Constructs a new page cache.
         *
         * @param {object} options Options controlling the cache
         * @param {number} options.max The maximum number of cache entries to keep
         */
        constructor(options: {
            max: number;
        });
        /**
         * Get an object from the cache, or if no matches found invoke a callback
         * to create a new instance.
         *
         * @param {any} key The key for the page.
         * @param {(key: any) => any} factory A callback to create the item when not found in the cache.
         * @return {any}
         */
        get(key: any, factory: (key: any) => any): any;
    }
    /**
     * A Router handles URL load requests, by creating route objects matching them to
     * route handlers and firing associated events.
     */
    export class Router {
        /**
         * Constructs a new Router instance
         *
         * @param {RouteHandler[]} handlers
         *
         * An array of router handlers to initially register, however usually
         * handlers are registered using the {@link Router#register} method.
         */
        constructor(handlers: RouteHandler[]);
        /**
         * Starts the router, using the specified driver
         *
         * @param {object | null} driver The router driver to use, or `null` to use the default Web History router driver.
         * @returns {Promise<any>} The result returned from the driver's start method (usually the initially navigated {@linkcode Route} object).
         */
        start(driver: object | null): Promise<any>;
        /**
         * Navigates to a new URL.
         * @type {(url: URL | string) => Promise<Route>}
         */
        navigate: (url: URL | string) => Promise<Route>;
        /**
         * Replaces the current URL, without performing a navigation.
         * @type {(url: URL | string) => void} url The new URL to display
         */
        replace: (url: URL | string) => void;
        /**
         * Navigates back one step in the history, or if there is
         * no previous history navigates to the root URL.
         * @type {() => void}
         */
        back: () => void;
        /**
         * An optional URL mapper to be used for URL internalization and
         * externalization.
         *
         * @type {UrlMapper}
         */
        urlMapper: UrlMapper;
        /**
         * Internalizes a URL.
         *
         * @param {URL | string} url The URL to internalize
         * @returns { URL | string}
         */
        internalize(url: URL | string): URL | string;
        /**
         * Externalizes a URL.
         *
         * @param {URL | string} url The URL to internalize
         * @returns { URL | string}
         */
        externalize(url: URL | string): URL | string;
        /**
         * The current route object.
         * @type {Route}
         */
        get current(): Route;
        /**
         * The route currently being navigated to, but not yet committed.
         * @type {Route}
         */
        get pending(): Route;
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
        addEventListener(event: string, handler: RouterEventAsync | RouterEventSync): void;
        /**
         * Removes a previously registered event handler.
         *
         * @param {string} event The event to remove the listener for
         * @param {RouterEventAsync | RouterEventSync} handler The event handler function to remove
         */
        removeEventListener(event: string, handler: RouterEventAsync | RouterEventSync): void;
        /**
         * Registers one or more route handlers.
         *
         * @param {RouteHandler | RouteHandler[]} handlers The handler or handlers to register
         */
        register(handlers: RouteHandler | RouteHandler[]): void;
        /**
         * Revoke previously registered handlers that match a predicate callback.
         *
         * @param {(handler: RouteHandler) => boolean} predicate Callback passed each route handler, return `true` to remove
         */
        revoke(predicate: (handler: RouteHandler) => boolean): void;
        /**
         * A callback to capture the view state for a route.
         *
         * @type {(route: Route) => object}
         */
        captureViewState: (route: Route) => object;
        /**
         * A callback to restore the view state for a route.
         *
         * @type {(route: Route, state: object) => void}
         */
        restoreViewState: (route: Route, state: object) => void;
    }
    /**
     * Default {@link Router} instance.
     *
     * Nearly all applications only ever need a single router
     * instance and can use this pre-created instance.
     */
    export let router: Router;
    /**
     * Route objects store information about the current navigation, including the
     * URL, the matched handler and anything else the handler wants to associate with
     * the route.
     */
    export type Route = {
        /**
         * The route's internalized URL.
         */
        url: URL;
        /**
         * State associated with the route.
         *
         * The router stores important information in the state object so the clients
         * should never edit settings in the state object.  An application can however
         * store additional information in the state object, by setting properties on
         * it and then calling the {@linkcode Router#replace} method.
         */
        state: any;
        /**
         * `true` when this is the current route.
         *
         * There will only ever be one current route.
         */
        current: boolean;
        /**
         * The {@linkcode RouteHandler} associated with this route.
         */
        handler: RouteHandler;
        /**
         * The route's view state.
         *
         * This information will be available on the Route object once
         * the `mayEnter` event has been fired by the Router.
         *
         * By default the web history router driver will save and restore the current document
         * scroll position but applications can save and restore additional custom information
         * as necessary. For more information see [View State Restoration](routerDetails#view-state-restoration).
         */
        viewState?: any;
        /**
         * The page component for this route.
         *
         * CodeOnly nevers sets or uses this property, but it is included here because
         * by convention, most applications will set a `page` property.
         */
        page?: any;
        /**
         * The route's page title
         *
         * CodeOnly nevers sets or uses this property, but it is included here because
         * by convention, most applications will set a `title` property.
         */
        title?: string;
    };
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
     */
    export type RouteHandler = {
        /**
         * A string pattern (see {@linkcode urlPattern}) or regular expression to match URL pathnames to this route handler. If not specified, all URL's will match.
         */
        pattern?: string | RegExp;
        /**
         * A callback to confirm the URL match. If not specified all URL's matching the pattern will be considered matches.
         */
        match?: (route: Route) => Promise<boolean>;
        /**
         * Notifies that a route for this handler may be entered.
         */
        mayEnter?: (from: Route, to: Route) => Promise<boolean>;
        /**
         * Notifies that a route for this handler may be left.
         */
        mayLeave?: (from: Route, to: Route) => Promise<boolean>;
        /**
         * Notifies that a route for this handler has been entered.
         */
        didEnter?: (from: Route, to: Route) => boolean;
        /**
         * Notifies that a route for this handler has been left.
         */
        didLeave?: (from: Route, to: Route) => boolean;
        /**
         * Notifies that a route that may have been entered was cancelled.
         */
        cancelEnter?: (from: Route, to: Route) => boolean;
        /**
         * Notifies that a route that may have been left was cancelled.
         */
        cancelLeave?: (from: Route, to: Route) => boolean;
        /**
         * Order of this route handler in relation to all others (default = 0, lowest first).
         */
        order?: number;
        /**
         * A callback to capture the view state for this route handler's routes.
         */
        captureViewState?: (route: Route) => object;
        /**
         * A callback to restore the view state for this route handler's routes.
         */
        restoreViewState?: (route: Route, state: object) => void;
    };
    /** Provides URL internalization and externalization */
    export class UrlMapper {
        /** Constructs a new Url Mapper
         * @param {object} options Options for how to map URLs
         * @param {string} options.base The base URL of the external URL
         * @param {boolean} options.hash True to use hashed URLs
         */
        constructor(options: {
            base: string;
            hash: boolean;
        });
        /** Internalizes a URL
         *
         * @param {URL} url The URL to internalize
         * @returns {URL}
         */
        internalize(url: URL): URL;
        /** Externalizes a URL
         *
         * @param {URL} url The URL to externalize
         * @param {boolean} [asset] If true, ignores the hash option (used to externalize asset URLs with base only)
         * @returns {URL}
         */
        externalize(url: URL, asset?: boolean): URL;
    }
    /**
     * Fetches a text asset.
     *
     * In the browser, issues a fetch request for an asset
     * On the server, uses fs.readFile to load a local file asset.
     *
     * The asset path must be absolute (start with a '/') and is
     * resolved relative to the project root.
     *
     * @param {string} path The path of the asset to fetch
     * @returns {Promise<string>}
     */
    export function fetchTextAsset(path: string): Promise<string>;
    /**
     * Fetches a JSON asset.
     *
     * In the browser, issues a fetch request for an asset
     * On the server, uses fs.readFile to load a local file asset.
     *
     * The asset path must be absolute (start with a '/') and is
     * resolved relative to the project root.
     *
     * @param {string} path The path of the asset to fetch
     * @returns {Promise<object>}
     */
    export function fetchJsonAsset(path: string): Promise<object>;
    /**
     * Implements page rendering for SSG and/or SSR
     */
    export class SSRWorker {
        /**
         * Initializes the SSR worker
         * @param {object} options Options
         * @param {string} options.entryFile The main entry .js file
         * @param {string} options.entryMain The name of the main function in the entry file
         * @param {string} options.entryHtml An HTML string into which mounted components will be written
         * @param {string} [options.cssUrl] A URL to use in-place of directly inserting CSS declarations
         * @returns {Promise<void>}
         */
        init(options: {
            entryFile: string;
            entryMain: string;
            entryHtml: string;
            cssUrl?: string;
        }): Promise<void>;
        /**
         * Stops the worker.
         */
        stop(): Promise<void>;
        /**
         * Gets the declared CSS styles
         * @returns {Promise<string>}
         */
        getStyles(): Promise<string>;
        /**
         * Renders a page
         * @param {string} url URL of the page to render
         * @param {any} options Additional options to be made available via `coenv`
         * @returns {SSRResult} The results of the render
         */
        render(url: string, options: any): SSRResult;
    }
    /**
     * The results of an SSRWorker/SSRWorkerThread render operation.
     *
     * In addition to the `content` property, this object includes
     * any properties from the `ssr` property of the route object to
     * which the URL was matched.  This can be used to return additional
     * information such as HTTP status codes from the rendering process.
     */
    export type SSRResult = {
        /**
         * The rendered HTML
         */
        content: string;
    };
    /**
     * Runs an SSRWorker in a Node worker thread for
     * application isolation
     */
    export class SSRWorkerThread {
        /**
         * Initializes the SSR worker
         * @param {object} options Options
         * @param {string} options.entryFile The main entry .js file
         * @param {string} options.entryMain The name of the main function in the entry file
         * @param {string} options.entryHtml An HTML string into which mounted components will be written
         * @param {string} [options.cssUrl] A URL to use in-place of directly inserting CSS declarations
         * @returns {Promise<void>}
         */
        init(options: {
            entryFile: string;
            entryMain: string;
            entryHtml: string;
            cssUrl?: string;
        }): Promise<void>;
        /**
         * Renders a page
         * @param {string} url URL of the page to render
         * @returns {SSRResult} The results of the render
         */
        render(url: string): SSRResult;
        /**
         * Gets the declared CSS styles
         * @returns {Promise<string>}
         */
        getStyles(): Promise<string>;
        /**
         * Stops the worker.
         */
        stop(): Promise<any>;
    }
    /** Generates a static generated site (SSG)
     *
     * @param {GenerateStaticOptions} options - site generation options
     */
    export function generateStatic(options: GenerateStaticOptions): Promise<{
        files: any[];
        elapsed: number;
    }>;
    /**
     * Options for generating static sites
     */
    export type GenerateStaticOptions = {
        /**
         * The entry .js file (as an array, first found used)
         */
        entryFile?: string[];
        /**
         * The name of the entry point function in the entryFile (as an array, first found used)
         */
        entryMain?: string[];
        /**
         * The HTML file to use as template for generated files (as an array, first found used)
         */
        entryHtml?: string[];
        /**
         * The URL's to render (will also recursively render all linked URLs)
         */
        entryUrls?: string[];
        /**
         * The extension to append to all generated files (including the period)
         */
        ext?: string;
        /**
         * Prettify the generated HTML
         */
        pretty?: boolean;
        /**
         * The output directory to write generated files
         */
        outDir?: string;
        /**
         * The base URL used to qualify in-page URLs to an external full URL
         */
        baseUrl?: string;
        /**
         * Verbose output
         */
        verbose?: boolean;
        /**
         * Name of the CSS styles file
         */
        cssUrl?: string;
    };
    /**
     * Vite Plugin to generate static sites.
     * @param {GenerateStaticOptions} options - options used for static page generation
     */
    export function viteGenerateStatic(options: GenerateStaticOptions): {
        name: string;
        configResolved: (config: any) => void;
        buildStart: () => Promise<void>;
        closeBundle: () => Promise<void>;
    };
    /**
     * Interface to a notify service instance.
     */
    export type INotify =
    {
        /**
         * Fires a notification.
         * 
         * @param {any} sourceObject The event source object or value
         * @param {any[]} args Optional arguments to pass to the event handlers
         * @returns {void}
         */
        (sourceObject: any, ...args: any[]): void;

        /**
         * Adds an event listener to the notify service.
         * 
         * @param {any} sourceObject The event source object or value
         * @param {(sourceObject, ...args) => void} handler The event handler
         * @returns {void}
         */
        addEventListener: (sourceObject: any, handler: any) => void;

        /**
         * Removes previously registered event listener from the notify service.
         * 
         * @param {any} sourceObject The event source object or value
         * @param {(sourceObject, ...args) => void} handler The event handler
         * @returns {void}
         */
        removeEventListener: (sourceObject: any, handler: any) => void;
    }
    /**
     * Component Like Object.  Minimumm requirement for any
     * object to be hosted by a template
     */
    export interface CLObject 
    {
        /**
         * Gets the root nodes of this object
         */
        get rootNodes(): Node[];
        /**
         * Instructs the object to update its DOM
         */
        update(): void;
        /**
         * Notifies the object it can release held resources
         */
        destroy(): void;
        /**
         * Notifies the object is has been mounted or unmounted
         * @param {boolean} mounted True when the object has been mounted, false when unmounted
         */
        setMounted(mounted: boolean): void;
        /**
         * If present and if true, indicates this object will
         * only ever have a single root node
         */
        readonly isSingleRoot?: boolean;
        /**
         * Returns the root node (if isSingleRoot is true)
         */
        readonly rootNode?: Node;
    }
    /**
     * Implemented by all objects that manage a DOM tree.
     */
    export interface DomTree extends CLObject
    {
        /**
         * Instructs the DomTree that the model property of
         * the DomTree's context object has changed and that
         * it should rebind to the new instance
         */
        rebind(): void;
    }
    /**
     * Context object for DomTrees.
     */
    export interface DomTreeContext
    {
        /**
         * The context's model object
         */
        get model(): object;
    }
    /**
     * A function that creates a DomTree
     */
    export type DomTreeConstructor = (DomTreeContext: any) => DomTree;

}

//# sourceMappingURL=index.d.ts.map
