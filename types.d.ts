declare module "types" {
    export interface CLObject 
    {
        get rootNodes(): Node[];
        update(): void;
        destroy(): void;
        setMounted(mounted: boolean): void;
        readonly isSingleRoot?: boolean;
        readonly rootNode?: Node;
    }
}