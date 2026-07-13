import { router } from "./Router.js"

let handlers = [];

/** Registers a handler for fetch Asset requests
 * @param {FetchAssetHandler} handler The handler to register
 */
export function registerFetchAssetHandler(handler)
{
    handlers.push(handler);
}

/** Revokes a previous registered handler for fetch Asset requests
 * @param {FetchAssetHandler} handler The handler to register
 */
export function revokeFetchAssetHandler(handler)
{
    let index = handlers.indexOf(handler);
    if (index >= 0)
        handlers.splice(index, 1);
}

function mapFetchPath(path)
{
    if (!path.startsWith("/"))
        throw new Error("asset paths must start with '/'");

    // Externalize URL
    if (coenv.browser && router.urlMapper)
    {
        let url = new URL(path, new URL(coenv.window.location));
        url = router.urlMapper.externalize(url, true);
        path = url.pathname + url.search;
    }

    return path;
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
export async function fetchTextAsset(path)
{
    path = mapFetchPath(path);

    for (let h of handlers)
    {
        let r = await h(path);
        if (r)
        {
            if (r.text)
                return text;
            if (r.json)
                return JSON.stringify(r.json);
            if (r.binary)
                return new TextDecoder('utf8').decode(r.binary);
            throw new Error("Invalid fetch handler response");
        }
    }

    // Fetch it
    return coenv.fetchTextAsset(path);
}

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
export async function fetchJsonAsset(path)
{
    path = mapFetchPath(path);

    for (let h of handlers)
    {
        let r = await h(path);
        if (r)
        {
            if (r.text)
                return JSON.parse(text);
            if (r.json)
                return r.json;
            if (r.binary)
                return JSON.parse(new TextDecoder('utf8').decode(r.binary));
            throw new Error("Invalid fetch handler response");
        }
    }

    return JSON.parse(await coenv.fetchTextAsset(path));
}
