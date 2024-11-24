import { Document } from "./Document.js";

export class Window extends EventTarget
{
    constructor()
    {
        super();
        this.document = new Document();
    }

    requestAnimationFrame(callback) 
    { 
        setImmediate(callback);
    }

    waitAnimationFrames()
    {
        return new Promise((resolve) => {
            setImmediate(() => setImmediate(resolve));
        });
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

