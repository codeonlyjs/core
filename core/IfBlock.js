import { Plugins } from "./Plugins.js";
import { Placeholder } from "./Placeholder.js";
import { TemplateNode } from "./TemplateNode.js";
import { env } from "./Environment.js";
import { TransitionNone } from "./TransitionNone.js";

export class IfBlock
{
    static integrate(template, compilerOptions)
    {
        let branches = [];
        let key = template.key;
        delete template.key;
        let nodes = [];
        let hasElseBranch = false;
        let isSingleRoot = true;
        for (let i=0; i<template.branches.length; i++)
        {
            // Get branch
            let branch = template.branches[i];

            // Setup branch info for this branch
            let brInfo = {};
            branches.push(brInfo);

            // Setup condition
            if (branch.condition instanceof Function)
            {
                brInfo.condition = branch.condition;
                hasElseBranch = false;
            }
            else if (branch.condition !== undefined)
            {
                brInfo.condition = () => branch.condition;
                hasElseBranch = !!branch.condition;
            }
            else
            {
                brInfo.condition = () => true;
                hasElseBranch = true;
            }

            // Setup template
            if (branch.template !== undefined)
            {
                // Check if branch template has a single root
                let ni_branch = new TemplateNode(branch.template, compilerOptions);
                if (!ni_branch.isSingleRoot)
                    isSingleRoot = false;

                brInfo.nodeIndex = nodes.length;
                nodes.push(ni_branch);
            }
        }

        delete template.branches;

        // Make sure there's always an else block
        if (!hasElseBranch)
        {
            branches.push({
                condition: () => true,
            });
        }

        return {
            isSingleRoot,
            nodes,
            data: {
                key,
                branches,
                isSingleRoot,
            }
        };
    }

    static transform(template)
    {
        if (template.key !== undefined)
        {
            let key = template.key;
            if (!(key instanceof Function))
                throw new Error("`key` is not a function");
            delete template.key;
            let newTemplate = {
                type: IfBlock,
                key,
                branches: [
                    {
                        template: this.transform(template),
                        condition: true,
                    }
                ]
            }
            return newTemplate;
        }

        if (template.if !== undefined)
        {
            let newTemplate = {
                type: IfBlock,
                branches: [
                    {
                        template: template,
                        condition: template.if,
                    }
                ]
            }

            delete template.if;
            return newTemplate;
        }

        return template;
    }

    static transformGroup(templates)
    {
        let ifBlock = null;
        for (let i=0; i<templates.length; i++)
        {
            let t = templates[i];
            if (t.if)
            {
                ifBlock = {
                    type: IfBlock,
                    branches: [
                        {
                            condition: t.if,
                            template: t,
                        }
                    ]
                };
                delete t.if;
                templates.splice(i, 1, ifBlock);
            }
            else if (t.elseif)
            {
                if (!ifBlock)
                    throw new Error("template has 'elseif' without a preceeding condition");

                ifBlock.branches.push({
                    condition: t.elseif,
                    template: t,
                });
                delete t.elseif;

                // Remove branch
                templates.splice(i, 1);
                i--;
            }
            else if (t.else !== undefined)
            {
                if (!ifBlock)
                    throw new Error("template has 'else' without a preceeding condition");

                ifBlock.branches.push({
                    condition: true,
                    template: t,
                });
                delete t.else;

                // End of group
                ifBlock = null;

                // Remove branch
                templates.splice(i, 1);
                i--;
            }
            else
            {
                ifBlock = null;
            }
        }
    }

    constructor(options)
    {
        this.isSingleRoot = options.data.isSingleRoot;
        this.branches = options.data.branches;
        this.key = options.data.key;
        this.branch_constructors = [];
        this.context = options.context;

        // Setup constructors for branches
        for (let br of this.branches)
        {
            if (br.nodeIndex !== undefined)
            {
                this.branch_constructors.push(options.nodes[br.nodeIndex]);
            }
            else
            {
                this.branch_constructors.push(Placeholder(" IfBlock placeholder "));
            }
        }

        // Initialize
        this.activeBranchIndex = -1;
        this.activeKey = undefined;
        this.activeBranch = Placeholder(" IfBlock placeholder ")();

        // Multi-root if blocks need a sentinal to mark position
        // in case one of the multi-root branches has no elements
        if (!this.isSingleRoot)
            this.headSentinal = env.document?.createComment(" if ");
    }

    destroy()
    {
        this.activeBranch.destroy();
    }

    update()
    {
        // Make sure correct branch is active
        this.switchActiveBranch();

        // Update the active branch
        this.activeBranch.update();
    }

    render(w)
    {
        // Update the active branch
        if (!this.isSingleRoot)
            w.write(`<!-- if -->`);

        this.activeBranch.render(w);
    }


    unbind()
    {
        this.activeBranch.unbind?.();
    }

    bind()
    {
        this.activeBranch.bind?.();
    }

    get isAttached()
    {
        if (this.isSingleRoot)
            return this.activeBranch.rootNode?.parentNode != null;
        else
            return this.headSentinal.parentNode != null;
    }

    switchActiveBranch()
    {
        // Switch branch
        let newActiveBranchIndex = this.resolveActiveBranch();
        let newActiveKey = this.key ? this.key.call(this.context.model, this.context.model, this.context) : undefined;
        if (newActiveBranchIndex != this.activeBranchIndex ||
            newActiveKey != this.activeKey)
        {
            // Finish old transition
            this.#pendingTransition?.finish();

            let isAttached = this.isAttached;
            let oldActiveBranch = this.activeBranch;
            this.activeBranchIndex = newActiveBranchIndex;
            this.activeKey = newActiveKey;
            this.activeBranch = this.branch_constructors[newActiveBranchIndex]();

            if (isAttached)
            {
                // Work out new transition
                let transition;
                if (this.#mounted)
                {
                    if (this.key)
                        transition = this.key.withTransition?.(this.context);
                    else
                        transition = this.branches[0].condition.withTransition?.(this.context);
                }
                if (!transition)
                    transition = TransitionNone;
                this.#pendingTransition = transition;

                transition.enterNodes(this.activeBranch.rootNodes);
                transition.leaveNodes(oldActiveBranch.rootNodes);
                
                transition.onWillEnter(() => {
                    if (this.isSingleRoot)
                    {
                        let last = oldActiveBranch.rootNodes[oldActiveBranch.rootNodes.length - 1];
                        last.after(this.activeBranch.rootNodes[0]);
                    }
                    else
                        this.headSentinal.after(...this.activeBranch.rootNodes);

                    if (this.#mounted)
                        this.activeBranch.setMounted(true);
                });
                
                transition.onDidLeave(() => {
                    oldActiveBranch.rootNodes.forEach(x => x.remove());
                    if (this.#mounted)
                        oldActiveBranch.setMounted(false);
                    oldActiveBranch.destroy();
                });

                transition.start();
            }
            else
            {
                if (this.#mounted)
                {
                    this.activeBranch.setMounted(true);
                    oldActiveBranch.setMounted(false);
                    oldActiveBranch.destroy();
                }
            }
        }
    }

    #pendingTransition;

    resolveActiveBranch()
    {
        for (let i=0; i<this.branches.length; i++)
        {
            if (this.branches[i].condition.call(this.context.model, this.context.model, this.context))
                return i;
        }
        throw new Error("internal error, IfBlock didn't resolve to a branch");
    }

    #mounted = false;
    setMounted(mounted)
    {
        this.#mounted = mounted;
        this.activeBranch.setMounted(mounted);
    }

    get rootNodes()
    {
        if (this.isSingleRoot)
            return this.activeBranch.rootNodes;
        else
            return [ this.headSentinal, ...this.activeBranch.rootNodes ];
    }

    get rootNode()
    {
        return this.activeBranch.rootNode;
    }
}

Plugins.register(IfBlock);