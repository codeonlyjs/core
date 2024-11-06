export function Transition(options) 
{
    let insertOps = [];
    let nodesToInsert = [];
    let nodesToRemove = [];
    let compsToUnmount = [];
    let compsToDestroy = [];
    let nodesTransitioning = [];
    let finished = false;

    function className(state)
    {
        return `${options.name ?? "co"}-${state}`;
    }

    function track_transitions(nodes, class_add, class_remove)
    {
        // Switch classes after one frame
        requestAnimationFrame(() => {
            nodes.forEach(x => {
                x.classList?.add(className(class_add));
                x.classList?.remove(className(class_remove));
            });
        });

        // Track that these nodes might be transition
        nodesTransitioning.push(...nodes);
    }

    function start_inserts()
    {
        // Apply classes
        nodesToInsert.forEach(x => x.classList?.add(className("entering"), className("enter-start")));

        // Insert
        for (let o of insertOps)
        {
            if (o.before)
                o.before.before(...o.nodes);
            else
                o.after.after(...o.nodes);
        }

        // Track transitions
        track_transitions(nodesToInsert, "enter-end", "enter-start")
    }

    function finish_inserts()
    {
        nodesToInsert.forEach(x => {
            x.classList?.remove(
                className("enter-start"), 
                className("entering"), 
                className("enter-end")
            );
        });
        nodesToInsert = [];
    }

    function start_removes()
    {
        // Apply classes
        nodesToRemove.forEach(x => x.classList?.add(className("leaving"), className("leave-start")));

        // Track transitions
        track_transitions(nodesToRemove, "leave-end", "leave-start")
    }

    function finish_removes()
    {
        nodesToRemove.forEach(x => {
            x.classList?.remove(
                className("leave-start"), 
                className("leaving"), 
                className("leave-end")
            );
            x.remove();
        });
        nodesToRemove = [];
    }

    function while_busy()
    {
        return new Promise((resolve, reject) => {
            requestAnimationFrame(() => requestAnimationFrame(() => {
                
                // Get all active animations
                let animations = [];
                for (let n of nodesTransitioning)
                {
                    if (n.nodeType == 1)
                        animations.push(...n.getAnimations({subtree: true}));
                }
                nodesTransitioning = [];

                // Wait till they're all done
                Promise.all(animations.map(x => x.finished)).then(resolve);
            }));
        });
    }

    async function start()
    {
        let mode = options.mode ?? "";

        if (mode == "" || mode == "enter-leave")
            start_inserts();
        if (mode == "" || mode == "leave-enter")
            start_removes();

        await while_busy();

        if (finished)
            return;

        if (mode != "")
        {
            if (mode == "enter-leave")
            {
                start_removes();
                finish_inserts();
            }
            else if (mode == "leave-enter")
            {
                // Must start inserts before finishing
                // removes so we don't lose DOM position.
                start_inserts();
                finish_removes();
            }

            await while_busy();
        }

        finish();
    }

    function finish()
    {
        if (finished)
            return;

        finished = true;
        finish_removes();
        finish_inserts();
        compsToUnmount.forEach(x => x.setMounted(false));
        compsToDestroy.forEach(x => x.destroy());
    }

    return {
        before: function(node, nodes)
        {
            insertOps.push({
                before: node,
                nodes,
            });
            nodesToInsert.push(...nodes);
        },
        after: function(node, nodes)
        {
            insertOps.push({
                after: node,
                nodes,
            });
            nodesToInsert.push(...nodes);
        },
        remove: function(nodes)
        {
            nodesToRemove.push(...nodes);
        },
        setMounted: function(component, mounted)
        {   
            if (mounted)
                component.setMounted(true)
            else
                compsToUnmount.push(component);
        },
        destroy: function(component)
        {
            compsToDestroy.push(component);
        },
        start,
        finish,
    }
}