import { nextFrame } from "./nextFrame.js";
import { compileTemplate } from "./TemplateCompiler.js";

/** Components are the primary building block for constructing CodeOnly
applications. They encapsulate program logic, a DOM (aka HTML) template 
and an optional a set of CSS styles.

Components can be used either in the templates of other components
or mounted onto the document DOM to appear in a web page.

@extends EventTarget
*/
export class Component extends EventTarget
{
    /** Constructs a new component instance */
    constructor()
    {
        super();

        // Bind these so they can be passed directly to update callbacks.
        this.update = this.update.bind(this);
        this.invalidate = this.invalidate.bind(this);
    }

    static _domTreeConstructor;

    /** Gets the `domTreeConstructor` for this component class.
     * 
     * A `domTreeConstructor` is the constructor function used to 
     * create `domTree` instances for this component class.
     * 
     * The first time this property is accessed, it calls the 
     * static `onProvideDomTreeConstructor` method to actually provide the
     * instance.
     * @type {import("./TemplateCompiler").DomTreeConstructor}
    */
    static get domTreeConstructor()
    {
        if (!this._domTreeConstructor)
            this._domTreeConstructor = this.onProvideDomTreeConstructor();
        return this._domTreeConstructor
    }

    /** Provides the `domTreeConstructor` to be used by this component class.
     * 
     * This method is only called once per component class and should provide
     * a constructor function that can create `domTree` instances.
     * @returns {import("./TemplateCompiler").DomTreeConstructor}
     */
    static onProvideDomTreeConstructor()
    {
        return compileTemplate(this.onProvideTemplate());
    }

    /** Provides the template to be used by this component class.
     * 
     * This method is only called once per component class and should provide
     * the template to be compiled for this component class
     */
    static onProvideTemplate()
    {
        return this.template;
    }

    /** Indicates if instances of this component class will be guaranteed
     * to only ever have a single root node
     * 
     * @type {boolean}
     */
    static get isSingleRoot()
    {
        return this.domTreeConstructor.isSingleRoot;
    }

    /** Ensures the DOM elements of this component are created.
     * 
     * Calling this method does nothing if the component is already created.
     * 
     * @returns {void}
     */
    create()
    {
        if (!this.#domTree)
            this.#domTree = new this.constructor.domTreeConstructor({ model: this });
    }

    /** Returns true if this component's DOM elements have been created 
     * 
     * @type {boolean}
     */
    get created()
    {
        return this.#domTree != null;
    }

    /** Gets the `domTree` for this component, creating it if necessary 
     * 
     * @type {import("./TemplateCompiler").DomTree}
    */
    get domTree()
    {
        if (!this.#domTree)
            this.create();
        return this.#domTree;
    }
    #domTree;
    
    /** Returns true if this component instance has, and will only ever 
     * have a single root node
     * 
     * @type {boolean}
     */
    get isSingleRoot() 
    { 
        return this.domTree.isSingleRoot; 
    }

    /** Returns the single root node of this component (if it is a single 
     * root node component)
     * 
     * @type {Node}
     */
    get rootNode() 
    { 
        if (!this.isSingleRoot)
            throw new Error("rootNode property can't be used on multi-root template");

        return this.domTree.rootNode;
    }

    /** Returns the root nodes of this element 
     * 
     * @type {Node[]}
    */
    get rootNodes() 
    { 
        return this.domTree.rootNodes; 
    }

    static nextFrameOrder = -100;

    #invalid = false;

    /** Indicates if this component is currently marked as invalid
     * @type {boolean}
     */
    get invalid()
    {
        return this.#invalid;
    }


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
    invalidate()
    {
        // No need to invalidate if not created yet
        if (!this.#domTree)
            return;

        // Already invalid?
        if (this.invalid)
            return;

        // Mark
        this.#invalid = true;

        // Request callback
        Component.invalidateWorker(this);
    }

    /** Updates this component if it's marked as invalid
     * 
     * @returns {void}
     */
    validate()
    {
        if (this.invalid)
            this.update();
    }

    /** @private */
    static _invalidComponents = [];

    /** @private */
    static invalidateWorker(component)
    {
        // Add component to list requiring validation
        this._invalidComponents.push(component);

        // If it's the first, set up a nextFrame callback
        if (this._invalidComponents.length == 1)
        {
            nextFrame(() => {
                // Process invalid components.
                // NB: new components invalidated while validating original
                //     set of components will be added to end of array 
                //     and also updated this frame.
                for (let i=0; i<this._invalidComponents.length; i++)
                {
                    this._invalidComponents[i].validate();
                }
                this._invalidComponents = [];
            }, Component.nextFrameOrder);
        }
    }


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
    update()
    {
        if (!this.#domTree)
            return;
        
        this.#invalid = false;
        this.domTree.update();
    }

    
    /** Gets the error object (if any) that was thrown during the last async data {@link load} operation.
     * 
     * @type {Error}
    */
   get loadError()
   {
       return this.#loadError;
    }
    
    /** Sets the error object associated with the current async data {@link load} operation.
     */
    set loadError(value)
    {
        this.#loadError = value;
        this.invalidate();
    }
    #loadError = null;
        
    #loading = 0;

    /** Indicates if the component is currently in an async data {@link load} operation
     * 
     * @type {boolean}
     */
    get loading()
    {
        return this.#loading != 0;
    }

    /**
     * @callback LoadCallback
     * @returns {any}
     */

    /** Performs an async data load operation.
     * 
     * The callback function is typically an async function that performs
     * a data request.  While in the callback, the {@link loading} property
     * will return `true`.  If the callback throws an error, it will be captured
     * to the {@link loadError} property.
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
    async load(callback, silent)
    {
        if (silent)
        {
            let retv = await callback();
            this.invalidate();
            return retv;
        }

        this.#loading++;
        if (this.#loading == 1)
        {
            this.#loadError = null;
            this.invalidate();  
            coenv.enterLoading();
            this.dispatchEvent(new Event("loading"));
        }
        try
        {
            return await callback();
        }
        catch (err)
        {
            this.#loadError = err;
        }
        finally
        {
            this.#loading--;
            if (this.#loading == 0)
            {
                this.invalidate();
                this.dispatchEvent(new Event("loaded"));
                coenv.leaveLoading();
            }
        }
    }


    /** Destroys this components `domTree` returning it to 
     * the constructed but not created state.
     * 
     * A destroyed component can be recreated by remounting it
     * or by calling its {@link create} method.
     * 
     * @returns {void}
     */
    destroy()
    {
        if (this.#domTree)
        {
            this.#domTree.destroy();
            this.#domTree = null;
        }
    }

    /** Notifies a component that is has been mounted
     * 
     * Override this method to receive the notification.  External
     * resources (eg: adding event listeners to external objects) should be 
     * acquired when the component is mounted.
     * 
     * @returns {void}
     */
    onMount()
    {
    }

    /** Notifies a component that is has been mounted
     * 
     * Override this method to receive the notification.  External
     * resources (eg: removing event listeners from external objects) should be 
     * released when the component is unmounted.
     * 
     * @returns {void}
     */
    onUnmount()
    {
    }

    #listeners;


    /** Registers an event listener to be added to an object when
     * automatically when the component is mounted, and removed when
     * unmounted
     * 
     * @param {EventTarget} target The object dispatching the events
     * @param {string} event The event to listen for
     * @param {Function} [handler] The event listener to add/remove.  If not provided, the component's {@link invalidate} method is used.
     * @returns {void}
     */
    listen(target, event, handler)
    {
        if (!target || !event)
            return;
        if (!handler)
            handler = this.invalidate;
        if (!this.#listeners)
            this.#listeners = [];
        this.#listeners.push({
            target, event, handler
        });
        if (this.#mounted)
            target.addEventListener(event, handler);
    }

    /** Removes an event listener previously registered with {@link listen}
     * 
     * @param {EventTarget} target The object dispatching the events
     * @param {string} event The event to listen for
     * @param {Function} [handler] The event listener to add/remove.  If not 
     * provided, the component's {@link invalidate} method is used.
     * @returns {void}
     */
    unlisten(target, event, handler)
    {
        if (!target || !event || !this.#listeners)
            return;
        let index = this.#listeners.findIndex(x =>
            x.target == target &&
            x.event == event &&
            x.handler == handler
            );
        if (index >= 0)
        {
            this.#listeners.splice(index, 1);
            if (this.#mounted)
                target.removeEventListener(event, handler);
        }
    }

    /** Indicates if the component is current mounted.
     * 
     * @type {boolean}
     */
    get mounted()
    {
        return this.#mounted;
    }

    #mounted = false;

    
    setMounted(mounted)
    {
        // Depth first
        this.#domTree?.setMounted(mounted);

        // Remember state
        this.#mounted = mounted;

        // Add event listeners
        let needsInvalidate = false;
        if (mounted && this.#listeners)
        {
            this.#listeners.forEach(x => x.target.addEventListener(x.event, x.handler));
            needsInvalidate = this.#listeners.length > 0 && this.#domTree;
        }

        // Dispatch to self
        if (mounted)
            this.onMount();
        else
            this.onUnmount();

        // Force invalidate?
        if (needsInvalidate)
            this.invalidate();

        // Remove event listeners
        if (!mounted && this.#listeners)
            this.#listeners.forEach(x => x.target.removeEventListener(x.event, x.handler));
    }

    /** Mounts this component against an element in the document.
     * 
     * @param {Element | string} el The element or an element selector that specifies where to mount the component
     * @returns {void}
     */
    mount(el)
    {
        coenv.mount(this, el);
    }

    /** Unmounts this component
     * 
     * @returns {void}
     */
    unmount()
    {
        coenv.unmount(this);
    }

    /** The template to be used by this component class */
    static template = {};
}
