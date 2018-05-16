/// <reference types="node" />
import { IConnectionConfig, IProfiles } from './config/connectionConfig';
import { IMosConnection, IMOSDeviceConnectionOptions } from './api';
import { MosDevice } from './MosDevice';
import { NCSServerConnection } from './connection/NCSServerConnection';
import { EventEmitter } from 'events';
export declare class MosConnection extends EventEmitter implements IMosConnection {
    static CONNECTION_PORT_LOWER: number;
    static CONNECTION_PORT_UPPER: number;
    static CONNECTION_PORT_QUERY: number;
    static _nextSocketID: number;
    private _conf;
    private _debug;
    private _lowerSocketServer;
    private _upperSocketServer;
    private _querySocketServer;
    private _incomingSockets;
    private _ncsConnections;
    private _mosDevices;
    private _initialized;
    private _isListening;
    private _onconnection;
    /** */
    constructor(configOptions: IConnectionConfig);
    init(): Promise<boolean>;
    /** */
    connect(connectionOptions: IMOSDeviceConnectionOptions): Promise<MosDevice>;
    onConnection(cb: (mosDevice: MosDevice) => void): void;
    registerMosDevice(myMosID: string, theirMosId0: string, theirMosId1: string | null, primary: NCSServerConnection | null, secondary: NCSServerConnection | null): MosDevice;
    /** */
    readonly isListening: boolean;
    /** */
    readonly isCompliant: boolean;
    /** */
    readonly acceptsConnections: boolean;
    /** */
    readonly profiles: IProfiles;
    /** */
    dispose(): Promise<void>;
    /** */
    readonly complianceText: string;
    /** */
    private _initiateIncomingConnections();
    /** */
    private _registerIncomingClient(client);
    /** */
    private _disposeIncomingSocket(socketID);
    private static readonly nextSocketID;
}
