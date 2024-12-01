import path from "node:path";
import { generateStatic } from "./generateStatic.js";

export function viteGenerateStatic(options)
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
            let r = await generateStatic(options);
            console.log(`Rendered ${r.files.length} files in ${r.elapsed}ms`);
        }
    };
}