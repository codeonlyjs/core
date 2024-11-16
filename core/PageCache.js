class PageCache
{
    #cache = [];
    #maxCount = 10;

    get(key, factory)
    {
        // Unpack URL Objects
        if (key instanceof URL)
            key = key.pathname + key.query;

        // Check cache
        for (let i=0; i<this.#cache.length; i++)
        {
            let e = this.#cache[i];
            if (e.key == key && !e.page.mounted)
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
        if (this.#cache.length > this.#maxCount)
            this.#cache.splice(this.#cache);

        return e.page;
    }


}

export let pageCache = new PageCache();