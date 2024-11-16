export class Notify
{
    #objectListenerMap = new WeakMap();
    #valueListenerMap = new Map();

    #resolveMap(sourceObject)
    {
        return sourceObject instanceof Object ? 
            this.#objectListenerMap : this.#valueListenerMap
    }


    // Add a listener for a source object
    addListener(sourceObject, handler)
    {
        if (!sourceObject)
            return;
        let map = this.#resolveMap(sourceObject);
        let listeners = map.get(sourceObject);
        if (!listeners)
            listeners = map.set(sourceObject, [handler]);
        else
            listeners.push(handler);
    }

    // Remove a listener for a source object
    removeListener(sourceObject, handler)
    {
        if (!sourceObject)
            return;
        let map = this.#resolveMap(sourceObject);
        let listeners = map.get(sourceObject);
        if (listeners)
        {
            let index = listeners.indexOf(handler);
            if (index >= 0)
            {
                listeners.splice(index, 1);
            }
        }
    }

    // Fire a listener for a source object
    fire(sourceObject)
    {
        if (!sourceObject)
            return;
        let map = this.#resolveMap(sourceObject);
        let listeners = map.get(sourceObject);
        if (listeners)
        {
            for (let i=listeners.length-1; i>=0; i--)
            {
                listeners[i].apply(null, arguments);
            }
        }
    }

}

// Default instance of update manager
export let notify = new Notify();