/** Implements a simple MRU cache that can be used to cache Page components for route handlers */
export class PageCache
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
        }
        this.#cache.unshift(e);

        // Trim size
        if (this.#cache.length > this.#options.max)
            this.#cache.splice(this.#cache);

        return e.page;
    }


}
