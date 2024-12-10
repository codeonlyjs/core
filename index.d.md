---
title: API Reference
---

# @codeonlyjs/core {#module:@codeonlyjs/core}

## _DomTreeExtend {#_DomTreeExtend}

```ts
type _DomTreeExtend = {
    rebind: () => void;
};
```

### rebind {#_DomTreeExtend#rebind}

```ts
rebind: () => void;
```


Rebinds the DomTree to a new model object


## anyPendingFrames {#anyPendingFrames}

```ts
function anyPendingFrames(): boolean;
```


Check if there are any pending nextFrame callbacks


## CaptureViewStateCallback {#CaptureViewStateCallback}

```ts
type CaptureViewStateCallback = (route: Route) => any;
```

## CLObject {#CLObject}

```ts
interface CLObject 
{
    get rootNodes(): Node[];
    update(): void;
    destroy(): void;
    setMounted(mounted: boolean): void;
    readonly isSingleRoot?: boolean;
    readonly rootNode?: Node;
}
```

### destroy {#CLObject#destroy}

```ts
destroy(): void;
```

### isSingleRoot {#CLObject#isSingleRoot}

```ts
readonly isSingleRoot?: boolean;
```

### rootNode {#CLObject#rootNode}

```ts
readonly rootNode?: Node;
```

### rootNodes {#CLObject#rootNodes}

#### rootNodes {#CLObject#rootNodes.get}

```ts
get rootNodes(): Node[];
```

### setMounted {#CLObject#setMounted}

```ts
setMounted(mounted: boolean): void;
```

### update {#CLObject#update}

```ts
update(): void;
```

## compileTemplate {#compileTemplate}

```ts
function compileTemplate(rootTemplate: object, compilerOptions: any): DomTreeConstructor;
```

Compiles a template into a domTreeConstructor function


* **`rootTemplate`** The template to be compiled

## Component {#Component}

```ts
class Component extends EventTarget {
    static get domTreeConstructor(): DomTreeConstructor;
    static onProvideDomTreeConstructor(): DomTreeConstructor;
    static onProvideTemplate(): {};
    static get isSingleRoot(): boolean;
    static nextFrameOrder: number;
    static template: {};
    update(): void;
    invalidate(): void;
    create(): void;
    get created(): boolean;
    get domTree(): DomTree;
    get isSingleRoot(): boolean;
    get rootNode(): Node;
    get rootNodes(): Node[];
    get invalid(): boolean;
    validate(): void;
    set loadError(value: Error);
    get loadError(): Error;
    get loading(): boolean;
    load(callback: () => any, silent?: boolean): any;
    destroy(): void;
    onMount(): void;
    onUnmount(): void;
    listen(target: EventTarget, event: string, handler?: Function): void;
    unlisten(target: EventTarget, event: string, handler?: Function): void;
    get mounted(): boolean;
    setMounted(mounted: any): void;
    mount(el: Element | string): void;
    unmount(): void;
}
```

Components are the primary building block for constructing CodeOnly
applications. They encapsulate program logic, a DOM (aka HTML) template
and an optional a set of CSS styles.

Components can be used either in the templates of other components
or mounted onto the document DOM to appear in a web page.


### create {#Component#create}

```ts
create(): void;
```

Ensures the DOM elements of this component are created.

Calling this method does nothing if the component is already created.



### created {#Component#created}

#### created {#Component#created.get}

```ts
get created(): boolean;
```

Returns true if this component's DOM elements have been created



### destroy {#Component#destroy}

```ts
destroy(): void;
```

Destroys this components `domTree` returning it to
the constructed but not created state.

A destroyed component can be recreated by remounting it
or by calling its [create](#create) method.



### domTree {#Component#domTree}

#### domTree {#Component#domTree.get}

```ts
get domTree(): DomTree;
```

Gets the `domTree` for this component, creating it if necessary



### domTreeConstructor (static) {#Component.domTreeConstructor}

#### domTreeConstructor (static) {#Component.domTreeConstructor.get}

```ts
static get domTreeConstructor(): DomTreeConstructor;
```

Gets the `domTreeConstructor` for this component class.

A `domTreeConstructor` is the constructor function used to
create `domTree` instances for this component class.

The first time this property is accessed, it calls the
static `onProvideDomTreeConstructor` method to actually provide the
instance.


### invalid {#Component#invalid}

#### invalid {#Component#invalid.get}

```ts
get invalid(): boolean;
```

Indicates if this component is currently marked as invalid


### invalidate {#Component#invalidate}

```ts
invalidate(): void;
```

Marks this component as requiring a DOM update.

Does nothing if the component hasn't yet been created.

This method is implicitly bound to the component instance
and can be used as an event listener to invalidate the
component when an event is triggered.



### isSingleRoot (static) {#Component.isSingleRoot}

#### isSingleRoot (static) {#Component.isSingleRoot.get}

```ts
static get isSingleRoot(): boolean;
```

Indicates if instances of this component class will be guaranteed
to only ever have a single root node



### isSingleRoot {#Component#isSingleRoot}

#### isSingleRoot {#Component#isSingleRoot.get}

```ts
get isSingleRoot(): boolean;
```

Returns true if this component instance has, and will only ever
have a single root node



### listen {#Component#listen}

```ts
listen(target: EventTarget, event: string, handler?: Function): void;
```

Registers an event listener to be added to an object when
automatically when the component is mounted, and removed when
unmounted



* **`target`** The object dispatching the events

* **`event`** The event to listen for

* **`handler`** The event listener to add/remove.  If not provided, the component's [invalidate](#invalidate) method is used.

### load {#Component#load}

```ts
load(callback: () => any, silent?: boolean): any;
```

Performs an async data load operation.

The callback function is typically an async function that performs
a data request.  While in the callback, the [loading](#loading) property
will return `true`.  If the callback throws an error, it will be captured
to the [loadError](#loadError) property.

Before calling and after returning from the callback, the component is
invalidated so visual elements (eg: spinners) can be updated.

If the silent parameter is `true` the `loading` property isn't set and
the component is only invalidated after returning from the callback.



* **`callback`** The callback to perform the load operation

* **`silent`** Whether to perform a silent update

### loadError {#Component#loadError}

#### loadError {#Component#loadError.get}

```ts
get loadError(): Error;
```

Gets the error object (if any) that was thrown during the last async data [load](#load) operation.



#### loadError {#Component#loadError.set}

```ts
set loadError(value: Error);
```

Sets the error object associated with the current async data [load](#load) operation.


### loading {#Component#loading}

#### loading {#Component#loading.get}

```ts
get loading(): boolean;
```

Indicates if the component is currently in an async data [load](#load) operation



### mount {#Component#mount}

```ts
mount(el: Element | string): void;
```

Mounts this component against an element in the document.



* **`el`** The element or an element selector that specifies where to mount the component

### mounted {#Component#mounted}

#### mounted {#Component#mounted.get}

```ts
get mounted(): boolean;
```

Indicates if the component is current mounted.



### nextFrameOrder (static) {#Component.nextFrameOrder}

```ts
static nextFrameOrder: number;
```

### onMount {#Component#onMount}

```ts
onMount(): void;
```

Notifies a component that is has been mounted

Override this method to receive the notification.  External
resources (eg: adding event listeners to external objects) should be
acquired when the component is mounted.



### onProvideDomTreeConstructor (static) {#Component.onProvideDomTreeConstructor}

```ts
static onProvideDomTreeConstructor(): DomTreeConstructor;
```

Provides the `domTreeConstructor` to be used by this component class.

This method is only called once per component class and should provide
a constructor function that can create `domTree` instances.


### onProvideTemplate (static) {#Component.onProvideTemplate}

```ts
static onProvideTemplate(): {};
```

Provides the template to be used by this component class.

This method is only called once per component class and should provide
the template to be compiled for this component class


### onUnmount {#Component#onUnmount}

```ts
onUnmount(): void;
```

Notifies a component that is has been mounted

Override this method to receive the notification.  External
resources (eg: removing event listeners from external objects) should be
released when the component is unmounted.



### rootNode {#Component#rootNode}

#### rootNode {#Component#rootNode.get}

```ts
get rootNode(): Node;
```

Returns the single root node of this component (if it is a single
root node component)



### rootNodes {#Component#rootNodes}

#### rootNodes {#Component#rootNodes.get}

```ts
get rootNodes(): Node[];
```

Returns the root nodes of this element



### setMounted {#Component#setMounted}

```ts
setMounted(mounted: any): void;
```

### template (static) {#Component.template}

```ts
static template: {};
```

The template to be used by this component class 

### unlisten {#Component#unlisten}

```ts
unlisten(target: EventTarget, event: string, handler?: Function): void;
```

Removes an event listener previously registered with [listen](#listen)



* **`target`** The object dispatching the events

* **`event`** The event to listen for

* **`handler`** The event listener to add/remove.  If not
provided, the component's [invalidate](#invalidate) method is used.

### unmount {#Component#unmount}

```ts
unmount(): void;
```

Unmounts this component



### update {#Component#update}

```ts
update(): void;
```

Immediately updates this component's DOM elements - even if
the component is not marked as invalid.

Does nothing if the component's DOM elements haven't been created.

If the component is marked as invalid, returns it to the valid state.

This method is implicitly bound to the component instance
and can be used as an event listener to update the
component when an event is triggered.



### validate {#Component#validate}

```ts
validate(): void;
```

Updates this component if it's marked as invalid



## css {#css}

```ts
function css(strings: string[], values: string[]): void;
```

Declares a CSS style string to be added to the `<head>` block

This function is intended to be used as a template literal tag


* **`strings`** The CSS to be added

* **`values`** The interpolated string values

## DomTree {#DomTree}

```ts
type DomTree = CLObject & _DomTreeExtend;
```

## DomTreeConstructor {#DomTreeConstructor}

```ts
type DomTreeConstructor = (DomTreeContext: any) => DomTree;
```

## DomTreeContext {#DomTreeContext}

```ts
type DomTreeContext = {
    model: object;
};
```

### model {#DomTreeContext#model}

```ts
model: object;
```


The model to be used by the domTree


## Environment {#Environment}

```ts
class Environment extends EventTarget {
    browser: boolean;
    enterLoading(): void;
    leaveLoading(): void;
    get loading(): boolean;
    load(callback: () => Promise<any>): Promise<any>;
    untilLoaded(): Promise<void>;
}
```

The base class for all environment types


### browser {#Environment#browser}

```ts
browser: boolean;
```

### enterLoading {#Environment#enterLoading}

```ts
enterLoading(): void;
```

Notifies the environment that an async load operation is starting


### leaveLoading {#Environment#leaveLoading}

```ts
leaveLoading(): void;
```

Notifies the environment that an async load operation has finished


### load {#Environment#load}

```ts
load(callback: () => Promise<any>): Promise<any>;
```

Runs an async data load operation


* **`callback`** A callback that performs the data load

### loading {#Environment#loading}

#### loading {#Environment#loading.get}

```ts
get loading(): boolean;
```

Indicates if there are async data load operations in progress


### untilLoaded {#Environment#untilLoaded}

```ts
untilLoaded(): Promise<void>;
```

Returns a promise that resolves when any pending load operation has finished


## fetchJsonAsset {#fetchJsonAsset}

```ts
function fetchJsonAsset(path: string): Promise<object>;
```

Fetches a JSON asset

 In the browser, issues a fetch request for an asset
 On the server, uses fs.readFile to load a local file asset

 The asset path must be absolute (start with a '/') and is
 resolved relative to the project root.



* **`path`** The path of the asset to fetch

## fetchTextAsset {#fetchTextAsset}

```ts
function fetchTextAsset(path: string): Promise<string>;
```

Fetches a text asset

 In the browser, issues a fetch request for an asset
 On the server, uses fs.readFile to load a local file asset

 The asset path must be absolute (start with a '/') and is
 resolved relative to the project root.



* **`path`** The path of the asset to fetch

## generateStatic {#generateStatic}

```ts
function generateStatic(options: {
    entryFile?: string[];
    entryMain?: string[];
    entryHtml?: string[];
    entryUrls?: string[];
    ext?: string;
    pretty?: boolean;
    outDir?: string;
    baseUrl?: string;
    verbose?: boolean;
    cssUrl?: string;
}): Promise<{
    files: any[];
    elapsed: number;
}>;
```

Generates a static generated site (SSG)



* **`options`** site generation options

* **`options.entryFile`** The entry .js file (as an array, first found used)

* **`options.entryMain`** The name of the entry point function in the entryFile (as an array, first found used)

* **`options.entryHtml`** The HTML file to use as template for generated files (as an array, first found used)

* **`options.entryUrls`** The URL's to render (will also recursively render all linked URLs)

* **`options.ext`** The extension to append to all generated files (including the period)

* **`options.pretty`** Prettify the generated HTML

* **`options.outDir`** The output directory to write generated files

* **`options.baseUrl`** The base URL used to qualify in-page URLs to an external full URL

* **`options.verbose`** Verbose output

* **`options.cssUrl`** Name of the CSS styles file

## html {#html}

```ts
function html(html: string | ((...args: any[]) => string)): HtmlString;
```

Marks a string as being HTML instead of plain text

Normally strings passed to templates are treated as plain text.  Wrapping
a value in html() indicates the string should be treated as HTML instead.



* **`html`** The HTML value to be wrapped, or a function that returns a string

## htmlEncode {#htmlEncode}

```ts
function htmlEncode(str: string): string;
```

Encodes a string to make it safe for use in HTML


* **`str`** The string to encode

## HtmlString {#HtmlString}

```ts
class HtmlString {
    static areEqual(a: any, b: any): boolean;
    constructor(html: string);
    html: string;
}
```

Contains a HTML string


### areEqual (static) {#HtmlString.areEqual}

```ts
static areEqual(a: any, b: any): boolean;
```

### constructor {#HtmlString#constructor}

```ts
constructor(html: string);
```

Constructs a new HtmlString object


* **`html`** The HTML string

### html {#HtmlString#html}

```ts
html: string;
```

The HTML string


## input {#input}

```ts
function input(options: InputOptions): InputHandler;
```

Declares additional settings for input bindings


* **`options`** Additional input options

## InputHandler {#InputHandler}

```ts
type InputHandler = object;
```

## InputOptions {#InputOptions}

```ts
type InputOptions = {
    event: string;
    prop?: string;
    target?: string | ((model: object) => string);
    format?: (value: any) => string;
    parse?: (value: string) => any;
    get?: (model: any, context: any) => any;
    set?: (model: any, value: any, context: any) => void;
    on_change?: (model: any, event: Event) => any;
};
```

### event {#InputOptions#event}

```ts
event: string;
```


The name of the event (usually "change" or "input") to trigger the input binding


### format {#InputOptions#format}

```ts
format?: (value: any) => string;
```


Format the property value into a string for display


### get {#InputOptions#get}

```ts
get?: (model: any, context: any) => any;
```


Get the value of the property


### on_change {#InputOptions#on_change}

```ts
on_change?: (model: any, event: Event) => any;
```


A callback to be invoked when the property value is changed by the user


### parse {#InputOptions#parse}

```ts
parse?: (value: string) => any;
```


Parse a display string into a property value


### prop {#InputOptions#prop}

```ts
prop?: string;
```


The name of the property on the target object


### set {#InputOptions#set}

```ts
set?: (model: any, value: any, context: any) => void;
```


Set the value of the property


### target {#InputOptions#target}

```ts
target?: string | ((model: object) => string);
```


The target object providing the binding property


## MatchCallback {#MatchCallback}

```ts
type MatchCallback = (route: Route) => Promise<boolean>;
```

## nextFrame {#nextFrame}

```ts
function nextFrame(callback: () => void, order?: number): void;
```


Invokes a callback on the next update cycle



* **`callback`** The callback to be invoked

* **`order`** The priority of the callback in related to others (lowest first, default 0)

## Notify {#Notify}

```ts
function Notify(): {
    (sourceObject: any, ...args: any[]): void;
    addEventListener: (sourceObject: any, handler: any) => void;
    removeEventListener: (sourceObject: any, handler: any) => void;
};
```

## PageCache {#PageCache}

```ts
class PageCache {
    constructor(options: {
        max: number;
    });
    get(key: any, factory: (key: any) => any): any;
}
```

Implements a simple MRU cache that can be used to cache Page components for route handlers 

### constructor {#PageCache#constructor}

```ts
constructor(options: {
    max: number;
});
```

Constructs a new page cache


* **`options`** Options controlling the cache

* **`options.max`** The maximum number of cache entries to keep

### get {#PageCache#get}

```ts
get(key: any, factory: (key: any) => any): any;
```

Get a cached object from the cache, or create a new one


* **`key`** The key for the page

* **`factory`** A callback to create the page item if not in the cache

## postNextFrame {#postNextFrame}

```ts
function postNextFrame(callback: () => void): void;
```


Invokes a callback after all other nextFrame callbacks have been invoked, or
immediately if there are no pending nextFrame callbacks.


* **`callback`** The callback to invoke

## RestoreViewStateCallback {#RestoreViewStateCallback}

```ts
type RestoreViewStateCallback = (route: Route, viewState: any) => any;
```

## RevokeRouteHandlerPredicate {#RevokeRouteHandlerPredicate}

```ts
type RevokeRouteHandlerPredicate = (handler: RouteHandler) => boolean;
```

## Route {#Route}

```ts
type Route = {
    url: URL;
    state: any;
    current: boolean;
    handler: RouteHandler;
    viewState?: any;
    page?: any;
    title?: string;
};
```

### current {#Route#current}

```ts
current: boolean;
```


True when this is the current route


### handler {#Route#handler}

```ts
handler: RouteHandler;
```


The handler associated with this route


### page {#Route#page}

```ts
page?: any;
```


The page component for this route


### state {#Route#state}

```ts
state: any;
```


State associated with the route


### title {#Route#title}

```ts
title?: string;
```


The route's page title


### url {#Route#url}

```ts
url: URL;
```


The route's URL


### viewState {#Route#viewState}

```ts
viewState?: any;
```


The route's view state


## RouteHandler {#RouteHandler}

```ts
type RouteHandler = {
    pattern?: string | RegExp;
    match?: MatchCallback;
    mayEnter?: RouterEventAsync;
    mayLeave?: RouterEventAsync;
    didEnter?: RouterEventSync;
    didLeave?: RouterEventSync;
    cancelEnter?: RouterEventSync;
    cancelLeave?: RouterEventSync;
    order?: number;
    captureViewState?: CaptureViewStateCallback;
    restoreViewState?: RestoreViewStateCallback;
};
```

### cancelEnter {#RouteHandler#cancelEnter}

```ts
cancelEnter?: RouterEventSync;
```


Notifies that a route that could have been entered was cancelled


### cancelLeave {#RouteHandler#cancelLeave}

```ts
cancelLeave?: RouterEventSync;
```


Notifies that a route that could have been left was cancelled


### captureViewState {#RouteHandler#captureViewState}

```ts
captureViewState?: CaptureViewStateCallback;
```


A callback to capture the view state for this route handler's routes


### didEnter {#RouteHandler#didEnter}

```ts
didEnter?: RouterEventSync;
```


Notifies that a route for this handler has been entered


### didLeave {#RouteHandler#didLeave}

```ts
didLeave?: RouterEventSync;
```


Notifies that a route for this handler has been left


### match {#RouteHandler#match}

```ts
match?: MatchCallback;
```


A callback to confirm the URL match


### mayEnter {#RouteHandler#mayEnter}

```ts
mayEnter?: RouterEventAsync;
```


Notifies that a route for this handler may be entered


### mayLeave {#RouteHandler#mayLeave}

```ts
mayLeave?: RouterEventAsync;
```


Notifies that a route for this handler may be left


### order {#RouteHandler#order}

```ts
order?: number;
```


Order of this route handler when compared to all others (default = 0, lowest first)


### pattern {#RouteHandler#pattern}

```ts
pattern?: string | RegExp;
```


A string pattern or regular expression to match URL pathnames to this route handler


### restoreViewState {#RouteHandler#restoreViewState}

```ts
restoreViewState?: RestoreViewStateCallback;
```


A callback to restore the view state for this route handler's routes


## Router {#Router}

```ts
class Router {
    constructor(handlers: RouteHandler[]);
    start(driver: object): any;
    navigate: any;
    replace: any;
    back: any;
    urlMapper: any;
    internalize(url: URL | string): URL | string;
    externalize(url: URL | string): URL | string;
    get current(): Route;
    get pending(): Route;
    addEventListener(event: string, handler: RouterEventAsync | RouterEventSync): void;
    removeEventListener(event: string, handler: RouterEventAsync | RouterEventSync): void;
    register(handlers: RouteHandler | RouteHandler[]): void;
    revoke(predicate: RevokeRouteHandlerPredicate): void;
    captureViewState: CaptureViewStateCallback;
    restoreViewState: RestoreViewStateCallback;
}
```

The Router class - handles URL load requests, creating
 route objects using route handlers and firing associated
 events


### addEventListener {#Router#addEventListener}

```ts
addEventListener(event: string, handler: RouterEventAsync | RouterEventSync): void;
```

Adds an event listener

Available events are:
  - "mayEnter", "mayLeave" (async, cancellable events)
  - "didEnter" and "didLeave" (sync, non-cancellable events)
  - "cancel" (sync, notification only)



* **`event`** The event to listen to

* **`handler`** The event handler function

### back {#Router#back}

```ts
back: any;
```

### captureViewState {#Router#captureViewState}

```ts
captureViewState: CaptureViewStateCallback;
```

a callback to capture the view state for this route handler's routes


### constructor {#Router#constructor}

```ts
constructor(handlers: RouteHandler[]);
```

Constructs a new Router instance


* **`handlers`** An array of router handlers to initially register

### current {#Router#current}

#### current {#Router#current.get}

```ts
get current(): Route;
```

The current route object


### externalize {#Router#externalize}

```ts
externalize(url: URL | string): URL | string;
```

Externalizes a URL


* **`url`** The URL to internalize

### internalize {#Router#internalize}

```ts
internalize(url: URL | string): URL | string;
```

Internalizes a URL


* **`url`** The URL to internalize

### navigate {#Router#navigate}

```ts
navigate: any;
```

### pending {#Router#pending}

#### pending {#Router#pending.get}

```ts
get pending(): Route;
```

The route currently being navigated to


### register {#Router#register}

```ts
register(handlers: RouteHandler | RouteHandler[]): void;
```

Registers one or more route handlers with the router


* **`handlers`** The handler or handlers to register

### removeEventListener {#Router#removeEventListener}

```ts
removeEventListener(event: string, handler: RouterEventAsync | RouterEventSync): void;
```

Removes a previously added event handler



* **`event`** The event to remove the listener for

* **`handler`** The event handler function to remove

### replace {#Router#replace}

```ts
replace: any;
```

### restoreViewState {#Router#restoreViewState}

```ts
restoreViewState: RestoreViewStateCallback;
```

a callback to restore the view state for this route handler's routes


### revoke {#Router#revoke}

```ts
revoke(predicate: RevokeRouteHandlerPredicate): void;
```

Revoke previously used handlers by matching to a predicate


* **`predicate`** Callback passed each route handler, return true to remove

### start {#Router#start}

```ts
start(driver: object): any;
```

Starts the router, using the specified driver


* **`driver`** The router driver to use

### urlMapper {#Router#urlMapper}

```ts
urlMapper: any;
```

## RouterEventAsync {#RouterEventAsync}

```ts
type RouterEventAsync = (from: Route, to: Route) => Promise<boolean>;
```

## RouterEventSync {#RouterEventSync}

```ts
type RouterEventSync = (from: Route, to: Route) => void;
```

## setEnvProvider {#setEnvProvider}

```ts
function setEnvProvider(value: () => Environment): void;
```

Sets an environment provider


* **`value`** A callback to provide the current environment object

## SSRWorker {#SSRWorker}

```ts
class SSRWorker {
    init(options: any): Promise<void>;
    stop(): Promise<void>;
    getStyles(): Promise<any>;
    render(url: any, options: any): Promise<any>;
}
```

### getStyles {#SSRWorker#getStyles}

```ts
getStyles(): Promise<any>;
```

### init {#SSRWorker#init}

```ts
init(options: any): Promise<void>;
```

### render {#SSRWorker#render}

```ts
render(url: any, options: any): Promise<any>;
```

### stop {#SSRWorker#stop}

```ts
stop(): Promise<void>;
```

## SSRWorkerThread {#SSRWorkerThread}

```ts
class SSRWorkerThread {
    init(options: any): Promise<any>;
    render(url: any): Promise<any>;
    getStyles(): Promise<any>;
    stop(): Promise<any>;
    invoke(method: any, ...args: any[]): Promise<any>;
}
```

### getStyles {#SSRWorkerThread#getStyles}

```ts
getStyles(): Promise<any>;
```

### init {#SSRWorkerThread#init}

```ts
init(options: any): Promise<any>;
```

### invoke {#SSRWorkerThread#invoke}

```ts
invoke(method: any, ...args: any[]): Promise<any>;
```

### render {#SSRWorkerThread#render}

```ts
render(url: any): Promise<any>;
```

### stop {#SSRWorkerThread#stop}

```ts
stop(): Promise<any>;
```

## Style {#Style}

```ts
class Style {
    static declare(css: string): void;
}
```

Utility functions for working with CSS styles


### declare (static) {#Style.declare}

```ts
static declare(css: string): void;
```

Declares a CSS style string to be added to the `<head>` block


* **`css`** The CSS string to be added

## transition {#transition}

```ts
function transition(options: {
    value: (model: object, context: object) => any;
    mode?: string;
    name?: void;
    classNames?: object;
    duration?: number;
    subtree?: boolean;
}, ...args: any[]): TransitionHandler;
```

Declares addition settings transition directives


* **`options`** * @param {(model:object, context:object) => any} options.value The value callback that triggers the animation when it changes

* **`options.mode`** Transition order - concurrent, enter-leave or leave-enter

* **`options.name`** Transition name - used as prefix to CSS class names, default = "tx"

* **`options.classNames`** A map of class name mappings

* **`options.duration`** The duration of the animation in milliseconds

* **`options.subtree`** Whether to monitor the element's sub-trees for animations

## TransitionCss {#module:TransitionCss}

### defaultClassNames {#module:TransitionCss.defaultClassNames}

```ts
defaultClassNames: {
           entering: string;
           "enter-start": string;
           "enter-end": string;
           leaving: string;
           "leave-start": string;
           "leave-end": string;
       }
```

## TransitionHandler {#TransitionHandler}

```ts
type TransitionHandler = {
    enterNodes: (nodes: Node[]) => void;
    leaveNodes: (nodes: Node[]) => void;
    onWillEnter: () => void;
    onDidLeave: () => void;
    start: () => void;
    finish: () => void;
};
```

### enterNodes {#TransitionHandler#enterNodes}

```ts
enterNodes: (nodes: Node[]) => void;
```


Registers the nodes that will be transitioned in


### finish {#TransitionHandler#finish}

```ts
finish: () => void;
```


Instructs the TranstitionHandler to cancel any pending transition and complete all callbacks.


### leaveNodes {#TransitionHandler#leaveNodes}

```ts
leaveNodes: (nodes: Node[]) => void;
```


Registers the nodes that will be transitioned out


### onDidLeave {#TransitionHandler#onDidLeave}

```ts
onDidLeave: () => void;
```


Registers callback to be invoked when leaving nodes can be removed


### onWillEnter {#TransitionHandler#onWillEnter}

```ts
onWillEnter: () => void;
```


Registers a callback to be invoked when entry nodes should be added


### start {#TransitionHandler#start}

```ts
start: () => void;
```


Instructs the TransitionHandler to start the transition


## TransitionNone {#module:TransitionNone}

### enterNodes {#module:TransitionNone.enterNodes}

```ts
function enterNodes(): void;
```

### finish {#module:TransitionNone.finish}

```ts
function finish(): void;
```

### leaveNodes {#module:TransitionNone.leaveNodes}

```ts
function leaveNodes(): void;
```

### onDidLeave {#module:TransitionNone.onDidLeave}

```ts
function onDidLeave(cb: any): void;
```

### onWillEnter {#module:TransitionNone.onWillEnter}

```ts
function onWillEnter(cb: any): void;
```

### start {#module:TransitionNone.start}

```ts
function start(): void;
```

## UrlMapper {#UrlMapper}

```ts
class UrlMapper {
    constructor(options: {
        base: string;
        hash: boolean;
    });
    options: {
        base: string;
        hash: boolean;
    };
    internalize(url: URL): URL;
    externalize(url: URL, asset?: boolean): URL;
}
```

Provides URL internalization and externalization 

### constructor {#UrlMapper#constructor}

```ts
constructor(options: {
    base: string;
    hash: boolean;
});
```

Constructs a new Url Mapper


* **`options`** Options for how to map URLs

* **`options.base`** The base URL of the external URL

* **`options.hash`** True to use hashed URLs

### externalize {#UrlMapper#externalize}

```ts
externalize(url: URL, asset?: boolean): URL;
```

Externalizes a URL



* **`url`** The URL to externalize

* **`asset`** If true, ignores the hash option (used to externalize asset URLs with base only)

### internalize {#UrlMapper#internalize}

```ts
internalize(url: URL): URL;
```

Internalizes a URL



* **`url`** The URL to internalize

### options {#UrlMapper#options}

```ts
options: {
    base: string;
    hash: boolean;
};
```

## urlPattern {#urlPattern}

```ts
function urlPattern(pattern: string): string;
```

Converts a URL pattern string to a regular expression string



* **`pattern`** The URL pattern to be converted to a regular expression

## viteGenerateStatic {#viteGenerateStatic}

```ts
function viteGenerateStatic(options: any): {
    name: string;
    configResolved: (config: any) => void;
    buildStart: () => Promise<void>;
    closeBundle: () => Promise<void>;
};
```

