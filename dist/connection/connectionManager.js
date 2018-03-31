"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConnectionManager {
    constructor() {
        this._connections = {
            lower: {},
            upper: {},
            query: {}
        };
    }
    /** */
    register(socket) {
        this._connections[socket.connectionID][socket.id] = socket;
    }
    /** */
    unregister(socket) {
        delete this._connections[socket.connectionID][socket.id];
    }
    /** */
    getSocketsFor(connectionID) {
        let sockets = [];
        for (let i in this._connections[connectionID]) {
            sockets.push(this._connections[connectionID][i]);
        }
        return sockets;
    }
}
exports.ConnectionManager = ConnectionManager;
//# sourceMappingURL=connectionManager.js.map