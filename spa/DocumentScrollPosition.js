import { getEnv } from "../core/Environment.js";

export class DocumentScrollPosition
{
    static get()
    {
        if (getEnv().browser)
        {
            return { 
                top: getEnv().window.pageYOffset || getEnv().document.documentElement.scrollTop,
                left: getEnv().window.pageXOffset || getEnv().document.documentElement.scrollLeft,
            }
        }
    }
    static set(value)
    {
        if (getEnv().browser)
        {
            if (!value)
                getEnv().window.scrollTo(0, 0);
            else
                getEnv().window.scrollTo(value.left, value.top);
        }
    }
}