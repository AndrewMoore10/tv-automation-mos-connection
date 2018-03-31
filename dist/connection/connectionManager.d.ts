import { ConnectionType, IConnection } from './socketConnection';
export declare class ConnectionManager {
    private _connections;
    /** */
    register(socket: IConnection): void;
    /** */
    unregister(socket: IConnection): void;
    /** */
    getSocketsFor(connectionID: ConnectionType): IConnection[];
}
