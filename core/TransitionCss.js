export function TransitionCss(options, ctx) 
{
    let onWillEnter;
    let onDidLeave;
    let enterNodes = [];
    let leaveNodes = [];
    let nodesTransitioning = [];
    let finished = false;

    function className(state)
    {
        if (options.classNames)
            return options.classNames[state];
        else
            return `${options.cssClassPrefix ?? "tx"}-${state}`;
    }

    function track_transitions(nodes, class_add, class_remove)
    {
        // Switch classes after one frame
        requestAnimationFrame(() => 
        requestAnimationFrame(() => {
            nodes.forEach(x => {
                x.classList?.add(className(class_add));
                x.classList?.remove(className(class_remove));
            });
        }));

        // Track that these nodes might be transition
        nodesTransitioning.push(...nodes);
    }

    function start_enter()
    {
        // Apply classes
        enterNodes.forEach(x => x.classList?.add(className("entering"), className("enter-start")));

        // Do operation
        onWillEnter?.();
        onWillEnter = null;

        // Track transitions
        track_transitions(enterNodes, "enter-end", "enter-start")
    }

    function finish_enter()
    {
        enterNodes?.forEach(x => {
            x.classList?.remove(
                className("enter-start"), 
                className("entering"), 
                className("enter-end")
            );
        });
    }

    function start_leave()
    {
        // Apply classes
        leaveNodes.forEach(x => x.classList?.add(className("leaving"), className("leave-start")));

        // Track transitions
        track_transitions(leaveNodes, "leave-end", "leave-start")
    }

    function finish_leave()
    {
        leaveNodes.forEach(x => {
            x.classList?.remove(
                className("leave-start"), 
                className("leaving"), 
                className("leave-end")
            );
        });

        // Do operation
        onDidLeave?.();
        onDidLeave = null;
    }

    function while_busy()
    {
        return new Promise((resolve, reject) => {
            requestAnimationFrame(() => 
            requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                
                // Get all active animations
                let animations = [];
                for (let n of nodesTransitioning)
                {
                    if (n.nodeType == 1)
                        animations.push(...n.getAnimations({subtree: true}));
                }
                nodesTransitioning = [];

                // Wait till they're all done
                Promise.allSettled(animations.map(x => x.finished)).then(resolve);
            })}));
        });
    }

    async function start()
    {
        // Work out animation mode
        let mode = options.mode;
        if (mode instanceof Function)
            mode = mode(ctx.model, ctx);
        
        switch (mode)
        {
            case "enter-leave":
            case "leave-enter":
                break;
            default:
                mode = "";
                break;
        }


        options.on_start?.(ctx.model, ctx);

        if (mode == "" || mode == "enter-leave")
            start_enter();
        if (mode == "" || mode == "leave-enter")
            start_leave();

        await while_busy();

        if (finished)
            return;

        if (mode != "")
        {
            if (mode == "enter-leave")
            {
                start_leave();
                finish_enter();
            }
            else if (mode == "leave-enter")
            {
                // Must start inserts before finishing
                // removes so we don't lose DOM position.
                start_enter();
                finish_leave();
            }

            await while_busy();
        }
        else
        {
            finish_enter();
            finish_leave();
        }

        finished = true;
        options.on_finish?.(ctx.model, ctx);
    }

    function finish()
    {
        if (finished)
            return;

        finished = true;

        onWillEnter?.();
        finish_enter();
        finish_leave();

        options.on_cancel?.(ctx.model, ctx);
    }

    return {

        enterNodes: function(nodes)
        {
            enterNodes.push(...nodes);
        },

        leaveNodes: function(nodes)
        {
            leaveNodes.push(...nodes);
        },

        onWillEnter: function(cb)
        {
            onWillEnter = cb;
        },

        onDidLeave: function(cb)
        {
            onDidLeave = cb;
        },

        start,
        finish,
    }
}