declare module "types" 
{
    /**
     * Interface to a notify service instance.
     */
    export type INotify =
    {
        /**
         * Fires a notification.
         * 
         * @param {any} sourceObject The event source object or value
         * @param {any[]} args Optional arguments to pass to the event handlers
         * @returns {void}
         */
        (sourceObject: any, ...args: any[]): void;

        /**
         * Adds an event listener to the notify service.
         * 
         * @param {any} sourceObject The event source object or value
         * @param {(sourceObject, ...args) => void} handler The event handler
         * @returns {void}
         */
        addEventListener: (sourceObject: any, handler: any) => void;

        /**
         * Removes previously registered event listener from the notify service.
         * 
         * @param {any} sourceObject The event source object or value
         * @param {(sourceObject, ...args) => void} handler The event handler
         * @returns {void}
         */
        removeEventListener: (sourceObject: any, handler: any) => void;
    }

    /**
     * Component Like Object.  Minimumm requirement for any
     * object to be hosted by a template
     */
    export interface CLObject 
    {
        /**
         * Gets the root nodes of this object
         */
        get rootNodes(): Node[];
        /**
         * Instructs the object to update its DOM
         */
        update(): void;
        /**
         * Notifies the object it can release held resources
         */
        destroy(): void;
        /**
         * Notifies the object is has been mounted or unmounted
         * @param {boolean} mounted True when the object has been mounted, false when unmounted
         */
        setMounted(mounted: boolean): void;
        /**
         * If present and if true, indicates this object will
         * only ever have a single root node
         */
        readonly isSingleRoot?: boolean;
        /**
         * Returns the root node (if isSingleRoot is true)
         */
        readonly rootNode?: Node;
    }
    /**
     * Implemented by all objects that manage a DOM tree.
     */
    export interface DomTree extends CLObject
    {
        /**
         * Instructs the DomTree that the model property of
         * the DomTree's context object has changed and that
         * it should rebind to the new instance
         */
        rebind(): void;
    }

    /**
     * Context object for DomTrees.
     */
    export interface DomTreeContext
    {
        /**
         * The context's model object
         */
        get model(): object;
    }

    /**
     * A function that creates a DomTree
     */
    export type DomTreeConstructor = (DomTreeContext: any) => DomTree;
}