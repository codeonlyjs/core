/** @internal */
export let TransitionNone = 
{
    enterNodes: function() {},
    leaveNodes: function() {},
    onWillEnter: function(cb) { cb(); },
    onDidLeave: function(cb) { cb(); },
    start: function() {},
    finish: function() {},
}