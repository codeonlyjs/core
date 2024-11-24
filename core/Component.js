import { nextFrame } from "./nextFrame.js";
import { Template } from "./Template.js";
import { env } from "./Environment.js";

export class Component extends EventTarget
{
    constructor()
    {
        super();

        // Bind these so they can be passed directly to update callbacks.
        this.update = this.update.bind(this);
        this.invalidate = this.invalidate.bind(this);
    }

    static _domTreeConstructor;
    static get domTreeConstructor()
    {
        if (!this._domTreeConstructor)
            this._domTreeConstructor = this.onProvideDomTreeConstructor();
        return this._domTreeConstructor
    }

    static onProvideDomTreeConstructor()
    {
        return Template.compile(this.onProvideTemplate());
    }

    static onProvideTemplate()
    {
        return this.template;
    }

    static get isSingleRoot()
    {
        return this.domTreeConstructor.isSingleRoot;
    }

    create()
    {
        if (!this.#domTree)
            this.#domTree = new this.constructor.domTreeConstructor({ model: this });
    }

    get created()
    {
        return this.#domTree != null;
    }

    #domTree;
    get domTree()
    {
        if (!this.#domTree)
            this.create();
        return this.#domTree;
    }

    get isSingleRoot() 
    { 
        return this.domTree.isSingleRoot; 
    }

    get rootNode() 
    { 
        if (!this.isSingleRoot)
            throw new Error("rootNode property can't be used on multi-root template");

        return this.domTree.rootNode;
    }

    get rootNodes() 
    { 
        return this.domTree.rootNodes; 
    }

    static nextFrameOrder = -100;

    invalidate()
    {
        // No need to invalidate if not created yet
        if (!this.#domTree)
            return;

        // Already invalid?
        if (this.invalid)
            return;

        // Mark
        this.invalid = true;

        // Request callback
        Component.invalidate(this);
    }

    validate()
    {
        if (this.invalid)
            this.update();
    }

    static _invalidComponents = [];
    static invalidate(component)
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

    update()
    {
        if (!this.#domTree)
            return;
        
        this.invalid = false;
        this.domTree.update();
    }

    #loadError = null;
    get loadError()
    {
        return this.#loadError;
    }
    set loadError(value)
    {
        this.#loadError = value;
        this.invalidate();
    }

    #loading = 0;
    get loading()
    {
        return this.#loading != 0;
    }
    set loading(value)
    {
        throw new Error("setting Component.loading not supported, use load() function");
    }

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
            env.enterLoading();
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
                env.leaveLoading();
            }
        }
    }


    render(w)
    {
        this.domTree.render(w);
    }

    destroy()
    {
        if (this.#domTree)
        {
            this.#domTree.destroy();
            this.#domTree = null;
        }
    }

    onMount()
    {
    }

    onUnmount()
    {
    }

    #listeners;
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
        if (mounted && this.#listeners)
            this.#listeners.forEach(x => x.target.addEventListener(x.event, x.handler));

        // Dispatch to self
        if (mounted)
            this.onMount();
        else
            this.onUnmount();

        // Remove event listeners
        if (!mounted && this.#listeners)
            this.#listeners.forEach(x => x.target.removeEventListener(x.event, x.handler));
    }

    mount(el)
    {
        env.mount(this, el);
    }

    unmount()
    {
        env.unmount(this);
    }

    static template = {};
}
