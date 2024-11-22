import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import bundleSize from 'rollup-plugin-bundle-size';

export default {
    input: "core/index.js",
    plugins: [
        replace({
            preventAssignment: true,
            values: {
                'getEnv().browser': true,
            }
        }),
        bundleSize(),
    ],
    output: [
        {
            file: "./dist/codeonly-core.js",
            format: "es",
            plugins: [
            ],
        },
        {
            file: "./dist/codeonly-core.min.js",
            format: "es",
            plugins: [
                terser(),
            ],
        },
    ]
}