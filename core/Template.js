import { getEnv } from "./Environment.js";


export class Template
{
    static compile()
    {
        return getEnv().compileTemplate(...arguments);
    }
}