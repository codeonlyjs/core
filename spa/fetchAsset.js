import { router } from "./Router.js"

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

export async function fetchJsonAsset(path)
{
    return JSON.parse(await fetchTextAsset(path));
}
