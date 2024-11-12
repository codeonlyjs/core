import { html } from "./HtmlString.js";
import { env } from "./Environment.js";

export class Html
{
    static embed(content)
    {
        return {
            type: "embed-slot",
            content,
        }
    }

    static h(level, text)
    {
        return {
            type: `h${level}`,
            text: text,
        }
    }
    
    static p(text)
    {
        return {
            type: `p`,
            text: text,
        }
    }

    static a(href, text)
    {
        return {
            type: "a",
            attr_href: href,
            text: text,
        }        
    }

    static raw(text)
    {
        return html(text);
    }

    static encode(str)
    {
        if (str === null || str === undefined)
            return "";
        return (""+str).replace(/["'&<>]/g, function(x) {
            switch (x) 
            {
                case '\"': return '&quot;';
                case '&': return '&amp;';
                case '\'':return '&#39;';
                case '<': return '&lt;';
                case '>': return'&gt;';
            }
        });
    }
}

/*
class HtmlSSR
{
    static title(text)
    {
        return {
            type: "title",
            text: text,
        }
    }

    static style(content)
    {
        return {
            type: "style",
            text: content,
        }
    }

    static linkStyle(url)
    {
        return {
            type: "link",
            attr_href: url,
            attr_type: "text/css",
            attr_rel: "stylesheet",
        }
    }
}

if (!env.browser)
{
    Object.getOwnPropertyNames(HtmlSSR)
        .filter(x => HtmlSSR[x] instanceof Function)
        .forEach(x => Html[x] = HtmlSSR[x]);
}
*/