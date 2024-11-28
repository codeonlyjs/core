import { getEnv } from "../core/Environment.js"
import { router } from "./Router.js"

export async function fetchTextAsset(path)
{
    if (!path.startsWith("/"))
        throw new Error("asset paths must start with '/'");

    // Externalize URL
    if (getEnv().browser && router.urlMapper)
    {
        let url = new URL(path, new URL(getEnv().window.location));
        url = router.urlMapper.externalize(url, true);
        path = url.pathname + url.search;
    }

    // Fetch it
    return getEnv().fetchTextAsset(path);
}

export async function fetchJsonAsset(path)
{
    return JSON.parse(await fetchTextAsset(path));
}
