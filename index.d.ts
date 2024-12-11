declare module "@codeonlyjs/core" {
    /** Sets an environment provider
     * @param {() => Environment} value A callback to provide the current environment object
     * @returns {void}
     */
    export function setEnvProvider(value: () => Environment): void;
    /** The base class for all environment types
     * @extends {EventTarget}
     */
    export class Environment extends EventTarget {
        /**
         * True when running in browser environment
         */
        browser: boolean;
        /**
         * True when running in a rendering environment
         */
        ssr: boolean;
        /** Notifies the environment that an async load operation is starting
         * @returns {void}
         */
        enterLoading(): void;
        /** Notifies the environment that an async load operation has finished
         * @returns {void}
         */
        leaveLoading(): void;
        /** Indicates if there are async data load operations in progress
         * @type {boolean}
         */
        get loading(): boolean;
        /** Runs an async data load operation
         * @param {() => Promise<any>} callback A callback that performs the data load
         * @returns {Promise<any>}
         */
        load(callback: () => Promise<any>): Promise<any>;
        /** Returns a promise that resolves when any pending load operation has finished
         * @returns {Promise<void>}
         */
        untilLoaded(): Promise<void>;
    }
    /** Marks a string as being HTML instead of plain text
     *
     * Normally strings passed to templates are treated as plain text.  Wrapping
     * a value in html() indicates the string should be treated as HTML instead.
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
     * applications. They encapsulate program logic, a DOM (aka HTML) template
     * and an optional a set of CSS styles.
     *
     * Components can be used either in the templates of other components
     * or mounted onto the document DOM to appear in a web page.
     *
     * @extends EventTarget
     */
    export class Component extends EventTarget {
        /** Gets the `domTreeConstructor` for this component class.
         *
         * A `domTreeConstructor` is the constructor function used to
         * create `domTree` instances for this component class.
         *
         * The first time this property is accessed, it calls the
         * static `onProvideDomTreeConstructor` method to actually provide the
         * instance.
         * @type {DomTreeConstructor}
        */
        static get domTreeConstructor(): DomTreeConstructor;
        /** Provides the `domTreeConstructor` to be used by this component class.
         *
         * This method is only called once per component class and should provide
         * a constructor function that can create `domTree` instances.
         * @returns {import("./TemplateCompiler").DomTreeConstructor}
         */
        static onProvideDomTreeConstructor(): import("core/TemplateCompiler").DomTreeConstructor;
        /** Provides the template to be used by this component class.
         *
         * This method is only called once per component class and should provide
         * the template to be compiled for this component class
         */
        static onProvideTemplate(): {};
        /** Indicates if instances of this component class will be guaranteed
         * to only ever have a single root node
         *
         * @type {boolean}
         */
        static get isSingleRoot(): boolean;
        /** The template to be used by this component class */
        static template: {};
        /** Immediately updates this component's DOM elements - even if
         * the component is not marked as invalid.
         *
         * Does nothing if the component's DOM elements haven't been created.
         *
         * If the component is marked as invalid, returns it to the valid state.
         *
         * This method is implicitly bound to the component instance
         * and can be used as an event listener to update the
         * component when an event is triggered.
         *
         * @returns {void}
         */
        update(): void;
        /** Marks this component as requiring a DOM update.
         *
         * Does nothing if the component hasn't yet been created.
         *
         * This method is implicitly bound to the component instance
         * and can be used as an event listener to invalidate the
         * component when an event is triggered.
         *
         * @returns {void}
         */
        invalidate(): void;
        /** Ensures the DOM elements of this component are created.
         *
         * Calling this method does nothing if the component is already created.
         *
         * @returns {void}
         */
        create(): void;
        /** Returns true if this component's DOM elements have been created
         *
         * @type {boolean}
         */
        get created(): boolean;
        /**
         * Gets the `domTree` for this component, creating it if necessary
         *
         * @type {DomTree}
        */
        get domTree(): DomTree;
        /** Returns true if this component instance has, and will only ever
         * have a single root node
         *
         * @type {boolean}
         */
        get isSingleRoot(): boolean;
        /** Returns the single root node of this component (if it is a single
         * root node component)
         *
         * @type {Node}
         */
        get rootNode(): Node;
        /** Returns the root nodes of this element
         *
         * @type {Node[]}
        */
        get rootNodes(): Node[];
        /** Indicates if this component is currently marked as invalid
         * @type {boolean}
         */
        get invalid(): boolean;
        /** Updates this component if it's marked as invalid
         *
         * @returns {void}
         */
        validate(): void;
        /**
         * Sets the error object associated with the current async data {@link Component#load} operation.
         * @param {Error | null} value The new error object
         */
        set loadError(value: Error | null);
        /** Gets the error object (if any) that was thrown during the last async data {@link Component#load} operation.
         *
         * @type {Error}
        */
        get loadError(): Error;
        /** Indicates if the component is currently in an async data {@link Component#load} operation
         *
         * @type {boolean}
         */
        get loading(): boolean;
        /**
         * @callback LoadCallback
         * @returns {any}
         */
        /** Performs an async data load operation.
         *
         * The callback function is typically an async function that performs
         * a data request.  While in the callback, the {@link Component#loading} property
         * will return `true`.  If the callback throws an error, it will be captured
         * to the {@link Component#loadError} property.
         *
         * Before calling and after returning from the callback, the component is
         * invalidated so visual elements (eg: spinners) can be updated.
         *
         * If the silent parameter is `true` the `loading` property isn't set and
         * the component is only invalidated after returning from the callback.
         *
         * @param {LoadCallback} callback The callback to perform the load operation
         * @param {Boolean} [silent] Whether to perform a silent update
         * @returns {any} The result of the callback
         */
        load(callback: () => any, silent?: boolean): any;
        /** Destroys this components `domTree` returning it to
         * the constructed but not created state.
         *
         * A destroyed component can be recreated by remounting it
         * or by calling its {@link Component#create} method.
         *
         * @returns {void}
         */
        destroy(): void;
        /** Notifies a component that is has been mounted
         *
         * Override this method to receive the notification.  External
         * resources (eg: adding event listeners to external objects) should be
         * acquired when the component is mounted.
         *
         * @returns {void}
         */
        onMount(): void;
        /** Notifies a component that is has been mounted
         *
         * Override this method to receive the notification.  External
         * resources (eg: removing event listeners from external objects) should be
         * released when the component is unmounted.
         *
         * @returns {void}
         */
        onUnmount(): void;
        /** Registers an event listener to be added to an object when
         * automatically when the component is mounted, and removed when
         * unmounted
         *
         * @param {EventTarget} target The object dispatching the events
         * @param {string} event The event to listen for
         * @param {Function} [handler] The event listener to add/remove.  If not provided, the component's {@link Component#invalidate} method is used.
         * @returns {void}
         */
        listen(target: EventTarget, event: string, handler?: Function): void;
        /** Removes an event listener previously registered with {@link Component#listen}
         *
         * @param {EventTarget} target The object dispatching the events
         * @param {string} event The event to listen for
         * @param {Function} [handler] The event listener to add/remove.  If not
         * provided, the component's {@link Component#invalidate} method is used.
         * @returns {void}
         */
        unlisten(target: EventTarget, event: string, handler?: Function): void;
        /** Indicates if the component is current mounted.
         *
         * @type {boolean}
         */
        get mounted(): boolean;
        /**
         * Notifies the object is has been mounted or unmounted
         * @param {boolean} mounted True when the object has been mounted, false when unmounted
         */
        setMounted(mounted: boolean): void;
        /** Mounts this component against an element in the document.
         *
         * @param {Element | string} el The element or an element selector that specifies where to mount the component
         * @returns {void}
         */
        mount(el: Element | string): void;
        /** Unmounts this component
         *
         * @returns {void}
         */
        unmount(): void;
    }
    /** Compiles a template into a domTreeConstructor function
     * @param {object} rootTemplate The template to be compiled
     * @returns {DomTreeConstructor}
     */
    export function compileTemplate(rootTemplate: object): DomTreeConstructor;
    /**
     * Invokes a callback on the next update cycle
     *
     * @param {() => void} callback The callback to be invoked
     * @param {Number} [order] The priority of the callback in related to others (lowest first, default 0)
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
     * Transition Options
     */
    export type TransitionOptions = {
        /**
         * The value callback that triggers the animation when it changes
         */
        value: (model: object, context: object) => any;
        /**
         * Transition order - concurrent, enter-leave or leave-enter
         */
        mode?: string;
        /**
         * Transition name - used as prefix to CSS class names, default = "tx"
         */
        name?: void;
        /**
         * A map of class name mappings
         */
        classNames?: object;
        /**
         * The duration of the animation in milliseconds
         */
        duration?: number;
        /**
         * Whether to monitor the element's sub-trees for animations
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
    export let $: any;
    /**
     * Implements a simple notification and broadcast service
     */
    export function Notify(): {
        (sourceObject: any, ...args: any[]): void;
        addEventListener: (sourceObject: any, handler: any) => void;
        removeEventListener: (sourceObject: any, handler: any) => void;
    };
    export let notify: any;
    /** Encodes a string to make it safe for use in HTML
     * @param {string} str The string to encode
     * @returns {string}
     */
    export function htmlEncode(str: string): string;
    /** Declares additional settings for input bindings
     * @param {InputOptions} options Additional input options
     * @returns {object}
     */
    export function input(options: InputOptions): object;
    /**
     * Options for controlling input bindings
     */
    export type InputOptions = {
        /**
         * The name of the event (usually "change" or "input") to trigger the input binding
         */
        event: string;
        /**
         * The name of the property on the target object
         */
        prop?: string;
        /**
         * The target object providing the binding property
         */
        target?: string | ((model: object) => string);
        /**
         * Format the property value into a string for display
         */
        format?: (value: any) => string;
        /**
         * Parse a display string into a property value
         */
        parse?: (value: string) => any;
        /**
         * Get the value of the property
         */
        get?: (model: any, context: any) => any;
        /**
         * Set the value of the property
         */
        set?: (model: any, value: any, context: any) => void;
        /**
         * A callback to be invoked when the property value is changed by the user
         */
        on_change?: (model: any, event: Event) => any;
    };
    /** Converts a URL pattern string to a regular expression string
     *
     * @param {string} pattern The URL pattern to be converted to a regular expression
     * @returns {string}
     */
    export function urlPattern(pattern: string): string;
    /** Implements a simple MRU cache that can be used to cache Page components for route handlers */
    export class PageCache {
        /** Constructs a new page cache
         * @param {object} options Options controlling the cache
         * @param {number} options.max The maximum number of cache entries to keep
         */
        constructor(options: {
            max: number;
        });
        /** Get a cached object from the cache, or create a new one
         * @param {any} key The key for the page
         * @param {(key: any) => any} factory A callback to create the page item if not in the cache
         * @return {any}
         */
        get(key: any, factory: (key: any) => any): any;
    }
    /**
     * The Router class - handles URL load requests, creating
     * route objects using route handlers and firing associated
     * events
     */
    export class Router {
        /** Constructs a new Router instance
         * @param {RouteHandler[]} handlers An array of router handlers to initially register
         */
        constructor(handlers: RouteHandler[]);
        /** Starts the router, using the specified driver
         * @param {object} driver The router driver to use
         * @returns {any} The result returned from the driver's start method
         */
        start(driver: object): any;
        /**
         * Navigates to a new URL
         * @param {URL | string} url The external URL to navigate to
         * @returns {Promise<Route>}
         */
        navigate: any;
        /**
         * Replaces the current URL, without performing a navigation
         * @param {URL | string} url The new URL to display
         * @returns {void}
         */
        replace: any;
        /**
         * Navigates back one step in the history, or if there is
         * no previous history navigates to the root URL
         * @returns {void}
         */
        back: any;
        /**
         * An option URL mapper to be used for URL internalization and
         * externalization.
         * @type {UrlMapper}
         */
        urlMapper: UrlMapper;
        /** Internalizes a URL
         * @param {URL | string} url The URL to internalize
         * @returns { URL | string}
         */
        internalize(url: URL | string): URL | string;
        /** Externalizes a URL
         * @param {URL | string} url The URL to internalize
         * @returns { URL | string}
         */
        externalize(url: URL | string): URL | string;
        /** The current route object
         * @type {Route}
         */
        get current(): Route;
        /** The route currently being navigated to
         * @type {Route}
         */
        get pending(): Route;
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
        addEventListener(event: string, handler: RouterEventAsync | RouterEventSync): void;
        /** Removes a previously added event handler
         *
         * @param {string} event The event to remove the listener for
         * @param {RouterEventAsync | RouterEventSync} handler The event handler function to remove
         */
        removeEventListener(event: string, handler: RouterEventAsync | RouterEventSync): void;
        /** Registers one or more route handlers with the router
         * @param {RouteHandler | RouteHandler[]} handlers The handler or handlers to register
         */
        register(handlers: RouteHandler | RouteHandler[]): void;
        /** Revoke previously used handlers by matching to a predicate
         * @param {(handler: RouteHandler) => boolean} predicate Callback passed each route handler, return true to remove
         */
        revoke(predicate: (handler: RouteHandler) => boolean): void;
        /** a callback to capture the view state for this route handler's routes
         * @type {(route: Route) => object}
         */
        captureViewState: (route: Route) => object;
        /** a callback to restore the view state for this route handler's routes
         * @type {(route: Route, state: object) => void}
         */
        restoreViewState: (route: Route, state: object) => void;
    }
    /** The default {@link Router} instance */
    export let router: Router;
    /**
     * Represents a Route instance
     */
    export type Route = {
        /**
         * The route's URL
         */
        url: URL;
        /**
         * State associated with the route
         */
        state: any;
        /**
         * True when this is the current route
         */
        current: boolean;
        /**
         * The handler associated with this route
         */
        handler: RouteHandler;
        /**
         * The route's view state
         */
        viewState?: any;
        /**
         * The page component for this route
         */
        page?: any;
        /**
         * The route's page title
         */
        title?: string;
    };
    /**
     * RouteHandlers handle mapping URLs to Route instances
     */
    export type RouteHandler = {
        /**
         * A string pattern or regular expression to match URL pathnames to this route handler
         */
        pattern?: string | RegExp;
        /**
         * A callback to confirm the URL match
         */
        match?: (route: Route) => Promise<boolean>;
        /**
         * Notifies that a route for this handler may be entered
         */
        mayEnter?: (from: Route, to: Route) => Promise<boolean>;
        /**
         * Notifies that a route for this handler may be left
         */
        mayLeave?: (from: Route, to: Route) => Promise<boolean>;
        /**
         * Notifies that a route for this handler has been entered
         */
        didEnter?: (from: Route, to: Route) => boolean;
        /**
         * Notifies that a route for this handler has been left
         */
        didLeave?: (from: Route, to: Route) => boolean;
        /**
         * Notifies that a route that could have been entered was cancelled
         */
        cancelEnter?: (from: Route, to: Route) => boolean;
        /**
         * Notifies that a route that could have been left was cancelled
         */
        cancelLeave?: (from: Route, to: Route) => boolean;
        /**
         * Order of this route handler when compared to all others (default = 0, lowest first)
         */
        order?: number;
        /**
         * A callback to capture the view state for this route handler's routes
         */
        captureViewState?: (route: Route) => object;
        /**
         * A callback to restore the view state for this route handler's routes
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
    /** Fetches a text asset
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
    export function fetchTextAsset(path: string): Promise<string>;
    /** Fetches a JSON asset
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
