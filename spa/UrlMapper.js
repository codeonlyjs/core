/** Provides URL internalization and externalization */
export class UrlMapper
{
    /** Constructs a new Url Mapper
     * @param {object} options Options for how to map URLs
     * @param {string} options.base The base URL of the external URL
     * @param {boolean} options.hash True to use hashed URLs
     */
    constructor(options)
    {
        this.#options = options;
        if (this.#options.base && 
            (!this.#options.base.startsWith("/") ||
             !this.#options.base.endsWith("/")))
        {
            throw new Error(`UrlMapper base '${this.#options.base}' must start and end with '/'`);
        }
    }

    #options;

    /** Internalizes a URL
     *
     * @param {URL} url The URL to internalize
     * @returns {URL}
     */
    internalize(url)
    {
        if (this.#options.base)
        {
            if (!url.pathname.startsWith(this.#options.base))
                throw new Error(`Can't internalize url '${url}'`);
            
            url = new URL(url);
            url.pathname = url.pathname.substring(this.#options.base.length-1);
        }

        if (this.#options.hash)
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
        if (!asset && this.#options.hash)
        {
            url = new URL(`${url.origin}/#${url.pathname}${url.search}${url.hash}`);
        }

        if (this.#options.base)
        {
            url = new URL(url);
            url.pathname = this.#options.base.slice(0, -1) + url.pathname;
        }
        return url;
    }
}