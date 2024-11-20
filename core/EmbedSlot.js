import { Plugins } from "./Plugins.js";
import { is_constructor } from "./Utils.js";
import { HtmlString } from "./HtmlString.js";
import { TemplateNode } from "./TemplateNode.js";
import { env } from "./Environment.js";
import { TransitionNone } from "./TransitionNone.js";

export class EmbedSlot
{
    static integrate(template, compilerOptions)
    {
        let contentTemplate = null;
        if (template.content && typeof(template.content) === "object")
        {
            contentTemplate = template.content;
            delete template.content;
        }
        let retv = {
            isSingleRoot: false,
            data: { 
                ownsContent: template.ownsContent ?? true,
                content: template.content,
            },
            nodes: [
                contentTemplate ? new TemplateNode(contentTemplate, compilerOptions) : null,
                template.placeholder ? new TemplateNode(template.placeholder, compilerOptions) : null,
            ]
        }

        delete template.content;
        delete template.placeholder;
        delete template.ownsContent;

        return retv;
    }


    static transform(template)
    {
        // Wrap non-constructor callbacks in an embed slot where the 
        // callback is the content
        if (template instanceof Function && !is_constructor(template))
        {
            return {
                type: EmbedSlot,
                content: template,
            }
        }

        if (template.type == 'embed-slot')
            template.type = EmbedSlot;
        return template;
    }

    #context;
    #content;           // As set by user (potentially callback)
    #contentValue;      // Either #content or result of #content() if function
    #contentObject;     // Either a component like object, or an array of nodes
    #headSentinal;
    #tailSentinal;
    #placeholderConstructor;
    #pendingTransition;

    constructor(options)
    {
        this.#context = options.context;
        this.#placeholderConstructor = options.nodes[1];
        this.#headSentinal = env.document?.createTextNode("");
        this.#tailSentinal = env.document?.createTextNode("");
        this.#ownsContent = options.data.ownsContent ?? true;

        // Load now
        if (options.nodes[0])
            this.content = options.nodes[0]();
        else
            this.content = options.data.content;
    }

    get #contentNodes()
    {
        return this.#contentObject?.rootNodes ?? this.#contentObject ?? [];
    }

    get rootNodes() 
    { 
        return [ 
            this.#headSentinal, 
            ...this.#contentNodes,
            this.#tailSentinal 
        ]; 
    }

    get isSingleRoot()
    {
        return false;
    }

    // When ownsContent to false old content
    // wont be `destroy()`ed
    #ownsContent = true;
    get ownsContent()
    {
        return this.#ownsContent;
    }
    set ownsContent(value)
    {
        this.#ownsContent = value;
    }

    get content()
    {
        return this.#content;
    }

    set content(value)
    {
        // Store new content
        this.#content = value;

        if (this.#content instanceof Function)
        {
            this.replaceContent(this.#content.call(this.#context.model, this.#context.model, this.#context));
        }
        else
        {
            this.replaceContent(this.#content);
        }
    }

    update()
    {
        if (this.#content instanceof Function)
        {
            this.replaceContent(this.#content.call(this.#context.model, this.#context.model, this.#context));
        }

        this.#contentObject?.update?.();
    }

    bind()
    {
        if (!this.#contentValue)        // only placeholder
            this.#contentObject?.bind?.()
    }

    unbind()
    {
        if (!this.#contentValue)        // only placeholder
            this.#contentObject?.unbind?.()
    }

    get isAttached() {  }

    get #attached()
    {
        return this.#headSentinal?.parentNode != null;
    }

    #mounted
    setMounted(mounted)
    {
        this.#mounted = mounted;
        this.#contentObject?.setMounted?.(mounted);
    }

    replaceContent(value)
    {
        // Same value?
        if (this.#contentValue === value || HtmlString.areEqual(this.#contentValue, value))
        {
            if (value || this.#contentObject)   // Make sure placeholder constructed
                return;
        }

        // Capture old content and nodes
        let oldContentObject = this.#contentObject;
        let nodesLeaving = [...this.#contentNodes];

        // Store new value 
        this.#contentValue = value;

        // Resolve place-holder
        let newContentObject;
        if (!value)
        {
            newContentObject = this.#placeholderConstructor?.(this.#context) ?? null;
        }
        else if (value.rootNodes)
        {
            newContentObject = value;
        }
        else if (value instanceof HtmlString)
        {
            // Convert node
            let span = env.document.createElement('span');
            span.innerHTML = value.html;
            newContentObject = [ ...span.childNodes ];
            newContentObject.forEach(x => x.remove());
        }
        else if (typeof(value) === 'string')
        {
            // Convert to node
            newContentObject = [ env.document.createTextNode(value) ]
        }
        else if (Array.isArray(value))
        {
            // TODO: assert all are Node objects
            newContentObject = value;
        }
        else if (env.Node !== undefined && value instanceof env.Node)
        {
            // Wrap single node in an array
            newContentObject = [ value ];
        }
        else if (value.render)
        {
            // Render only
            newContentObject = value;
        }
        else
        {
            throw new Error("Embed slot requires component, array of HTML nodes or a single HTML node");
        }

        // Store new content object
        this.#contentObject = newContentObject;

        if (this.#attached)
        {
            // Work out transition
            this.#pendingTransition?.finish();
            let tx;
            if (this.#mounted)
                tx = this.#content?.withTransition?.(this.#context);
            if (!tx)
                tx = TransitionNone;
            this.#pendingTransition = tx;

            tx.enterNodes(this.#contentNodes);
            tx.leaveNodes(nodesLeaving);
            tx.onWillEnter(() => {
                this.#tailSentinal.before(...this.#contentNodes);
                this.#contentObject?.setMounted?.(true);
            });
            tx.onDidLeave(() => {
                nodesLeaving.forEach(x => x.remove());
                oldContentObject?.setMounted?.(false);
                if (this.#ownsContent)
                    oldContentObject?.destroy?.();
            })
            tx.start();
        }
        else
        {
            if (this.#mounted)
            {
                oldContentObject?.setMounted?.(false);
                this.#contentObject?.setMounted?.(true);
            }
            if (this.#ownsContent)
                oldContentObject?.destroy?.();
        }
    }

    destroy()
    {
        if (this.#ownsContent)
            this.#contentObject?.destroy?.();
    }

    render(w)
    {
        this.#contentObject?.render?.(w);
    }
}

Plugins.register(EmbedSlot);