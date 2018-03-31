import * as XMLBuilder from 'xmlbuilder';
export interface IMOSExternalMetaData {
    MosScope?: IMOSScope;
    MosSchema: string;
    MosPayload: any;
}
export declare enum IMOSScope {
    OBJECT = "OBJECT",
    STORY = "STORY",
    PLAYLIST = "PLAYLIST",
}
export declare class mosExternalMetaData {
    private _scope;
    private _schema;
    private _payload;
    constructor(obj: IMOSExternalMetaData);
    readonly scope: IMOSScope;
    readonly schema: string;
    readonly payload: any;
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
