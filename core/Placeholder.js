import { htmlEncode } from "./htmlEncode.js";

export function Placeholder(comment)
{
    let fn = function()
    {
        let node = coenv.document?.createComment(comment);

        return {
            get rootNode() { return node; },
            get rootNodes() { return [ node ]; },
            get isSingleRoot() { return true; },
            setMounted(m) { },
            destroy() {},
            update() {},
        }
    }

    fn.isSingleRoot = true;
    return fn;
}