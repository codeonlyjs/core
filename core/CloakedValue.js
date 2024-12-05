/** @internal */
export class CloakedValue
{
    constructor(value)
    {
        this.value = value;
    }
}

/** @internal */
export function cloak(value)
{
    return new CloakedValue(value);
}
