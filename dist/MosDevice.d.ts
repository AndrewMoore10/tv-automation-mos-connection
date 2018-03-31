/// <reference types="node" />
import * as XMLBuilder from 'xmlbuilder';
import { Socket } from 'net';
import { MosString128 } from './dataTypes/mosString128';
import { MosTime } from './dataTypes/mosTime';
import { IMOSExternalMetaData } from './dataTypes/mosExternalMetaData';
import { IMOSListMachInfo, IMOSDefaultActiveX } from './mosModel/0_listMachInfo';
import { IMOSDeviceConnectionOptions } from './api';
export declare class MosDevice {
    id: string;
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
    supportedProfiles: any;
    defaultActiveX: Array<IMOSDefaultActiveX>;
    mosExternalMetaData: Array<IMOSExternalMetaData>;
    constructor(connectionOptions: IMOSDeviceConnectionOptions);
    getMachineInfo(): Promise<IMOSListMachInfo>;
    readonly messageXMLBlocks: XMLBuilder.XMLElementOrXMLNode;
}
