/// <reference types="node" />
import { EventEmitter } from 'events';
import { MosMessage } from '../mosModel/MosMessage';
export declare type CallBackFunction = (err: any, data: object) => void;
export declare class MosSocketClient extends EventEmitter {
    private _host;
    private _port;
    private _autoReconnect;
    private _reconnectDelay;
    private _reconnectAttempts;
    private _debug;
    private _description;
    private _client;
    private _shouldBeConnected;
    private _connected;
    private _lastConnectionAttempt;
    private _reconnectAttempt;
    private _connectionAttemptTimer;
    private _commandTimeoutTimer;
    private _commandTimeout;
    private _queueCallback;
    private _queueMessages;
    private _sentMessage;
    private processQueueTimeout;
    private _startingUp;
    private dataChunks;
    /** */
    constructor(host: string, port: number, description: string, timeout?: number, debug?: boolean);
    /** */
    autoReconnect: boolean;
    /** */
    autoReconnectInterval: number;
    /** */
    autoReconnectAttempts: number;
    /** */
    connect(): void;
    /** */
    disconnect(): void;
    queueCommand(message: MosMessage, cb: CallBackFunction): void;
    processQueue(): void;
    /** */
    readonly host: string;
    /** */
    readonly port: number;
    /** */
    dispose(): void;
    /**
     * convenience wrapper to expose all logging calls to parent object
     */
    log(args: any): void;
    /** */
    /** */
    private connected;
    private _sendReply(messageId, err, res);
    /** */
    private executeCommand(message);
    /** */
    private _autoReconnectionAttempt();
    /** */
    private _clearConnectionAttemptTimer();
    /** */
    /** */
    private _onConnected();
    /** */
    private _onData(data);
    /** */
    private _onError(error);
    /** */
    private _onClose(hadError);
    private _triggerQueueCleanup();
}
