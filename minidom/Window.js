import { Document } from "./Document.js";

export class Window extends EventTarget
{
    constructor()
    {
        super();
        this.document = new Document();
        this.blockAnimationFrames = false;
        this.pendingAnimationFrames = [];
    }



    requestAnimationFrame(callback) 
    { 
        if (this.blockAnimationFrames)
        {
            this.pendingAnimationFrames.push(callback);
        }
        else
        {
            setImmediate(callback);
        }
    }

    waitAnimationFrames()
    {
        if (this.blockAnimationFrames)
            throw new Error("Can't await animation frames when blocked");

        return new Promise((resolve) => {
            setImmediate(() => setImmediate(resolve));
        });
    }

    dispatchAnimationFrames()
    {
        let any = false;
        while (this.pendingAnimationFrames.length != 0)
        {
            let pending = this.pendingAnimationFrames;
            this.pendingAnimationFrames = [];
            for (let i=0; i<pending.length; i++)
            {
                pending[i]();
                any = true;
            }
        }
        return any;
    }

/*
    animationFrames = null;

    blockAnimationFrames()
    {
        if (this.animationFrames === null)
            this.animationFrames = [];
    }

    dispatchAnimationFrames()
    {
        if (this.animationFrames != null)
        {
            let temp = this.animationFrames;
            this.animationFrames = [];
            temp.forEach(x => x());
        }
    }
*/
}

