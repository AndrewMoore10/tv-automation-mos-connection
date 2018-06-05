/// <reference types="node" />
import { Socket } from 'net';
import { NCSServerConnection } from './connection/NCSServerConnection';
import { MosString128 } from './dataTypes/mosString128';
import { MosTime } from './dataTypes/mosTime';
import { IMOSExternalMetaData } from './dataTypes/mosExternalMetaData';
import { IMOSListMachInfo, IMOSDefaultActiveX } from './mosModel/0_listMachInfo';
import { IMOSObject, IMOSDevice, IMOSRunningOrder, IMOSRunningOrderBase, IMOSRunningOrderStatus, IMOSStoryStatus, IMOSItemStatus, IMOSROReadyToAir, IMOSStoryAction, IMOSItem, IMOSROAction, IMOSROStory, IMOSItemAction, IMOSROFullStory, IMOSROAck, IMOSConnectionStatus } from './api';
import { IConnectionConfig } from './config/connectionConfig';
export declare class MosDevice implements IMOSDevice {
    socket: Socket;
    manufacturer: MosString128;
    model: MosString128;
    hwRev: MosString128;
    swRev: MosString128;
    DOM: MosTime;
    SN: MosString128;
    ID: MosString128;
    time: MosTime;
    opTime: MosTime;
    mosRev: MosString128;
    defaultActiveX: Array<IMOSDefaultActiveX>;
    mosExternalMetaData: Array<IMOSExternalMetaData>;
    private _idPrimary;
    private _idSecondary;
    private _debug;
    private supportedProfiles;
    private _primaryConnection;
    private _secondaryConnection;
    private _currentConnection;
    private _callbackOnGetMachineInfo?;
    private _callbackOnConnectionChange?;
    private _callbackOnRequestMOSOBject?;
    private _callbackOnRequestAllMOSObjects?;
    private _callbackOnCreateRunningOrder?;
    private _callbackOnReplaceRunningOrder?;
    private _callbackOnDeleteRunningOrder?;
    private _callbackOnRequestRunningOrder?;
    private _callbackOnMetadataReplace?;
    private _callbackOnRunningOrderStatus?;
    private _callbackOnStoryStatus?;
    private _callbackOnItemStatus?;
    private _callbackOnReadyToAir?;
    private _callbackOnROInsertStories?;
    private _callbackOnROInsertItems?;
    private _callbackOnROReplaceStories?;
    private _callbackOnROReplaceItems?;
    private _callbackOnROMoveStories?;
    private _callbackOnROMoveItems?;
    private _callbackOnRODeleteStories?;
    private _callbackOnRODeleteItems?;
    private _callbackOnROSwapStories?;
    private _callbackOnROSwapItems?;
    private _callbackOnROStory?;
    constructor(idPrimary: string, idSecondary: string | null, connectionConfig: IConnectionConfig, primaryConnection: NCSServerConnection | null, secondaryConnection: NCSServerConnection | null);
    readonly hasConnection: boolean;
    readonly idPrimary: string;
    readonly idSecondary: string | null;
    readonly primaryHost: string | null;
    readonly primaryId: string | null;
    readonly secondaryHost: string | null;
    readonly secondaryId: string | null;
    emitConnectionChange(): void;
    connect(): void;
    dispose(): Promise<void>;
    routeData(data: any): Promise<any>;
    getMachineInfo(): Promise<IMOSListMachInfo>;
    onGetMachineInfo(cb: () => Promise<IMOSListMachInfo>): void;
    onConnectionChange(cb: (connectionStatus: IMOSConnectionStatus) => void): void;
    getConnectionStatus(): IMOSConnectionStatus;
    onRequestMOSObject(cb: (objId: string) => Promise<IMOSObject | null>): void;
    onRequestAllMOSObjects(cb: () => Promise<Array<IMOSObject>>): void;
    getMOSObject(objID: MosString128): Promise<IMOSObject>;
    getAllMOSObjects(): Promise<Array<IMOSObject>>;
    onCreateRunningOrder(cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>): void;
    onReplaceRunningOrder(cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>): void;
    onDeleteRunningOrder(cb: (runningOrderId: MosString128) => Promise<IMOSROAck>): void;
    onRequestRunningOrder(cb: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>): void;
    getRunningOrder(runningOrderId: MosString128): Promise<IMOSRunningOrder | null>;
    onMetadataReplace(cb: (metadata: IMOSRunningOrderBase) => Promise<IMOSROAck>): void;
    onRunningOrderStatus(cb: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck>): void;
    onStoryStatus(cb: (status: IMOSStoryStatus) => Promise<IMOSROAck>): void;
    onItemStatus(cb: (status: IMOSItemStatus) => Promise<IMOSROAck>): void;
    setRunningOrderStatus(status: IMOSRunningOrderStatus): Promise<IMOSROAck>;
    setStoryStatus(status: IMOSStoryStatus): Promise<IMOSROAck>;
    setItemStatus(status: IMOSItemStatus): Promise<IMOSROAck>;
    onReadyToAir(cb: (Action: IMOSROReadyToAir) => Promise<IMOSROAck>): void;
    onROInsertStories(cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>): void;
    onROInsertItems(cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>): void;
    onROReplaceStories(cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>): void;
    onROReplaceItems(cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>): void;
    onROMoveStories(cb: (Action: IMOSStoryAction, Stories: Array<MosString128>) => Promise<IMOSROAck>): void;
    onROMoveItems(cb: (Action: IMOSItemAction, Items: Array<MosString128>) => Promise<IMOSROAck>): void;
    onRODeleteStories(cb: (Action: IMOSROAction, Stories: Array<MosString128>) => Promise<IMOSROAck>): void;
    onRODeleteItems(cb: (Action: IMOSStoryAction, Items: Array<MosString128>) => Promise<IMOSROAck>): void;
    onROSwapStories(cb: (Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128) => Promise<IMOSROAck>): void;
    onROSwapItems(cb: (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128) => Promise<IMOSROAck>): void;
    getAllRunningOrders(): Promise<Array<IMOSRunningOrderBase>>;
    onROStory(cb: (story: IMOSROFullStory) => Promise<IMOSROAck>): void;
}
