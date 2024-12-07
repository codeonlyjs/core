import { router } from "./Router.js"

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
export async function fetchTextAsset(path)
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

    // Fetch it
    return coenv.fetchTextAsset(path);
}

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
export async function fetchJsonAsset(path)
{
    return JSON.parse(await fetchTextAsset(path));
}
