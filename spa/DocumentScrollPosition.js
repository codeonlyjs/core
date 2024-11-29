export class DocumentScrollPosition
{
    static get()
    {
        if (coenv.browser)
        {
            return { 
                top: coenv.window.pageYOffset || coenv.document.documentElement.scrollTop,
                left: coenv.window.pageXOffset || coenv.document.documentElement.scrollLeft,
            }
        }
    }
    static set(value)
    {
        if (coenv.browser)
        {
            if (!value)
                coenv.window.scrollTo(0, 0);
            else
                coenv.window.scrollTo(value.left, value.top);
        }
    }
}