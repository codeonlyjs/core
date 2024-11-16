export function Notify()
{
    let objectListenerMap = new WeakMap();
    let valueListenerMap = new Map();

    function resolveMap(sourceObject)
    {
        return sourceObject instanceof Object ? 
            objectListenerMap : valueListenerMap
    }


    // Add a listener for a source object
    function addListener(sourceObject, handler)
    {
        if (!sourceObject)
            return;
        let map = resolveMap(sourceObject);
        let listeners = map.get(sourceObject);
        if (!listeners)
            listeners = map.set(sourceObject, [handler]);
        else
            listeners.push(handler);
    }

    // Remove a listener for a source object
    function removeListener(sourceObject, handler)
    {
        if (!sourceObject)
            return;
        let map = resolveMap(sourceObject);
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
    function fire(sourceObject)
    {
        if (!sourceObject)
            return;
        let map = resolveMap(sourceObject);
        let listeners = map.get(sourceObject);
        if (listeners)
        {
            for (let i=listeners.length-1; i>=0; i--)
            {
                listeners[i].apply(null, arguments);
            }
        }
    }

    fire.addEventListener = addListener;
    fire.removeEventListener = removeListener;
    return fire;
}

// Default instance of update manager
export let notify = new Notify();