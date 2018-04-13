import { IConnectionConfig, IProfiles } from './config/connectionConfig';
import { IMosConnection, IMOSDeviceConnectionOptions, IMOSDevice } from './api';
export declare class MosConnection implements IMosConnection {
    static CONNECTION_PORT_LOWER: number;
    static CONNECTION_PORT_UPPER: number;
    static CONNECTION_PORT_QUERY: number;
    static _nextSocketID: number;
    private _conf;
    private _lowerSocketServer;
    private _upperSocketServer;
    private _querySocketServer;
    private _servers;
    private _isListening;
    private _onconnection;
    /** */
    constructor(configOptions: IConnectionConfig);
    /** */
    connect(connectionOptions: IMOSDeviceConnectionOptions): Promise<IMOSDevice>;
    onConnection(cb: (mosDevice: IMOSDevice) => void): void;
    /** */
    readonly isListening: Promise<boolean[]>;
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
    private _registerIncomingClient(e);
    /** */
    private _disposeIncomingSocket(socket, socketID);
    /** */
    private _getServerForHost(host);
    private static readonly nextSocketID;
}
