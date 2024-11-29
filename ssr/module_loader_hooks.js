let g_enabled = true;

export function enableModuleHook(enable)
{
    g_enabled = enable;
}

export async function resolve(specifier, context, nextResolve) {

    if (g_enabled && specifier == "@codeonlyjs/core")
    {
        specifier = new URL("./node_modules/@codeonlyjs/core/index.js", import.meta.url).href;
    }

    return nextResolve(specifier);
}