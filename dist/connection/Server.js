"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import {ProfilesSupport} from '../config/connectionConfig';
// import {Socket} from 'net';
/** */
class MosDevice {
    // private _profiles: ProfilesSupport
    // private _primaryServer: Server
    // private _buddyServr: Server
    // private _currentServer: Server = this._primaryServer
    /** */
    get id() {
        return this._id;
    }
}
exports.MosDevice = MosDevice;
/** */
class Server {
    constructor() {
        // private _connected: boolean
        // private _lastSeen: number
        this._sockets = {};
    }
    /** */
    registerIncomingConnection(socketID, socket, portDescription) {
        this._sockets[socketID] = {
            socket: socket,
            portDescription: portDescription
        };
    }
    /** */
    removeSocket(socketID) {
        delete this._sockets[socketID];
    }
    /** */
    get lowerPortSockets() {
        let sockets = [];
        for (let i in this._sockets) {
            if (this._sockets[i].portDescription === 'lower') {
                sockets.push(this._sockets[i].socket);
            }
        }
        return sockets;
    }
    /** */
    get upperPortSockets() {
        let sockets = [];
        for (let i in this._sockets) {
            if (this._sockets[i].portDescription === 'upper') {
                sockets.push(this._sockets[i].socket);
            }
        }
        return sockets;
    }
    /** */
    get queryPortSockets() {
        let sockets = [];
        for (let i in this._sockets) {
            if (this._sockets[i].portDescription === 'query') {
                sockets.push(this._sockets[i].socket);
            }
        }
        return sockets;
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.js.map