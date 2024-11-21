export function TransitionCss(options, ctx) 
{
    let onWillEnter;
    let onDidLeave;
    let enterNodes = [];
    let leaveNodes = [];
    let nodesTransitioning = [];
    let finished = false;
    let entering = false;
    let leaving = false;

    function resolve(x)
    {
        if (x instanceof Function)
            return x(ctx.model, ctx);
        else
            return x;
    }

    // Resolve dynamic values
    let name = resolve(options.name);
    let mode = resolve(options.mode);
    let classNames = resolve(options.clasNames);
    let duration = resolve(options.duration);
    let subtree = resolve(options.subtree);

    // Resolve mode        
    switch (mode)
    {
        case "enter-leave":
        case "leave-enter":
            break;
        default:
            mode = "";
            break;
    }

    // Resolve duration
    if (duration != undefined && !Array.isArray(duration))
        duration = [ duration, duration ];


    // For an array of states, get the full set of class names
    // associated with that state.
    function classNamesForState(states)
    {
        let result = [];
        for (let s of states)
        {
            // Look in options.classNames the in default names
            let cls_names = classNames?.[s] ?? TransitionCss.defaultClassNames[s];

            // Split on semicolon
            cls_names = (cls_names ?? "").split(";");

            // Replace * with animation name
            cls_names = cls_names.map(x => x.replace(/\*/g, options.name ?? "tx"));

            // Add to list
            result.push(...cls_names);
        }
        return result;
    }

    function addClasses(nodes, states)
    {
        let classes = classNamesForState(states);
        if (classes.length)
            nodes.forEach(x => x.classList?.add(...classes));
    }

    function removeClasses(nodes, states)
    {
        let classes = classNamesForState(states)
        if (classes.length)
            nodes.forEach(x => x.classList?.remove(...classes));
    }

    function track_transitions(nodes, class_add, class_remove)
    {
        // Switch classes after one frame
        requestAnimationFrame(() => 
        requestAnimationFrame(() => {
            addClasses(nodes, [ class_add ]);
            removeClasses(nodes, [ class_remove ]);
        }));

        // Track that these nodes might be transition
        nodesTransitioning.push(...nodes);
    }

    function start_enter()
    {
        entering = true;

        // Apply classes
        addClasses(enterNodes, [ "entering", "enter-start" ]);

        // Do operation
        onWillEnter?.();
        onWillEnter = null;

        // Track transitions
        track_transitions(enterNodes, "enter-end", "enter-start")
    }

    function finish_enter()
    {
        entering = false;
        removeClasses(enterNodes, [ "enter-start", "entering", "enter-end" ]);
    }

    function start_leave()
    {
        leaving = true;

        // Apply classes
        addClasses(leaveNodes, [ "leaving", "leave-start" ]);

        // Track transitions
        track_transitions(leaveNodes, "leave-end", "leave-start")
    }

    function finish_leave()
    {
        leaving = false;
        removeClasses(leaveNodes, [ "leave-start", "leaving", "leave-end" ]);

        // Do operation
        onDidLeave?.();
        onDidLeave = null;
    }

    function while_busy(enter)
    {
        // Use duration instead of animation watching?
        if (duration !== undefined)
        {
            let d = 0;
            if (entering)
                d = d[0];
            if (leaving)
                d = Math.max(d, d[1]);

            return new Promise((resolve) => setTimeout(resolve, d));
        }

        return new Promise((resolve, reject) => {
            requestAnimationFrame(() => 
            requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                
                // Get all active animations
                let animations = [];
                for (let n of nodesTransitioning)
                {
                    if (n.nodeType == 1)
                        animations.push(...n.getAnimations({subtree: subtree ?? true}));
                }
                nodesTransitioning = [];

                // Wait till they're all done
                Promise.allSettled(animations.map(x => x.finished)).then(resolve);
            })}));
        });
    }

    async function start()
    {
        options.on_start?.(ctx.model, ctx);

        if (mode == "" || mode == "enter-leave")
            start_enter();
        if (mode == "" || mode == "leave-enter")
            start_leave();

        await while_busy(0);

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

            await while_busy(1);

            if (mode == "enter-leave")
            {
                finish_leave();
            }
            else if (mode == "leave-enter")
            {
                finish_enter();
            }
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

TransitionCss.defaultClassNames = {
    "entering": "*-entering;*-active",
    "enter-start": "*-enter-start;*-out",
    "enter-end": "*-enter-end;*-in",
    "leaving": "*-leaving;*-active",
    "leave-start": "*-leave-start;*-in",
    "leave-end": "*-leave-end;*-out",
}

