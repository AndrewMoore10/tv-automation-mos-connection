/// <reference types="node" />
import { Socket } from 'net';
import { ConnectionType } from './socketConnection';
/** */
export declare abstract class MosDevice {
    private _id;
    /** */
    readonly id: string;
}
/** */
export declare class Server {
    private _sockets;
    /** */
    registerIncomingConnection(socketID: number, socket: Socket, portDescription: ConnectionType): void;
    /** */
    removeSocket(socketID: number): void;
    /** */
    readonly lowerPortSockets: Socket[];
    /** */
    readonly upperPortSockets: Socket[];
    /** */
    readonly queryPortSockets: Socket[];
}
