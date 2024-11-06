export let TransitionNone = 
{
    before: function(node, nodes)
    {
        node.before(...nodes);
    },
    after: function(node, nodes)
    {
        node.after(...nodes);
    },
    remove: function(nodes)
    {
        nodes.forEach(x => x.remove());
    },
    setMounted: function(component, mounted)
    {   
        component.setMounted(mounted)
    },
    destroy: function(component)
    {
        component.destroy();
    },
    start: function()
    {
    },
    finish: function()
    {
    }
}