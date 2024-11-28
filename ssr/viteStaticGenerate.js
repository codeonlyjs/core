import path from "node:path";
import { generateStatic } from "./generateStatic.js";

export function viteStaticGenerate(options)
{
    return {
        name: 'viteStaticGenerate', 
        configResolved: (config) => {
            if (!options.outDir)
                options.outDir = config.build.outDir;
        },
        buildStart: async () => 
        {
            // Run prebuild script
            if (options.prebuild)
            {
                await import("file://" + path.resolve(options.prebuild))
            }
        },
        closeBundle: async () => {
            // Generate static files
            await generateStatic(options);
        }
    };
}