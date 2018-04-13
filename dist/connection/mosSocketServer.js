"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = require("net");
const events_1 = require("events");
const socketConnection_1 = require("./socketConnection");
class MosSocketServer extends events_1.EventEmitter {
    /** */
    constructor(port, description) {
        super();
        this._port = port;
        this._portDescription = description;
        this._socketServer = net_1.createServer();
        this._socketServer.on('connection', (socket) => this._onClientConnection(socket));
        this._socketServer.on('close', () => this._onServerClose());
        this._socketServer.on('error', (error) => this._onServerError(error));
    }
    /** */
    listen() {
        return new Promise((resolve, reject) => {
            // already listening
            if (this._socketServer.listening) {
                resolve(true);
                return;
            }
            // handles listening-listeners and cleans up
            let handleListeningStatus = (e) => {
                this._socketServer.removeListener('listening', handleListeningStatus);
                this._socketServer.removeListener('close', handleListeningStatus);
                this._socketServer.removeListener('error', handleListeningStatus);
                if (this._socketServer.listening) {
                    resolve(true);
                }
                else {
                    reject(e || false);
                }
            };
            // listens and handles error and events
            this._socketServer.once('listening', handleListeningStatus);
            this._socketServer.once('close', handleListeningStatus);
            this._socketServer.once('error', handleListeningStatus);
            this._socketServer.listen(this._port);
        });
    }
    /** */
    dispose(sockets) {
        return new Promise((resolveDispose) => {
            let closePromises = [];
            // close clients
            sockets.forEach(socket => {
                closePromises.push(new Promise((resolve) => {
                    socket.on('close', resolve);
                    socket.end();
                    socket.destroy();
                }));
            });
            // close server
            closePromises.push(new Promise((resolve) => {
                this._socketServer.on('close', resolve);
                this._socketServer.close();
            }));
            Promise.all(closePromises).then(() => resolveDispose());
        });
    }
    /** */
    _onClientConnection(socket) {
        this.emit(socketConnection_1.SocketServerEvent.CLIENT_CONNECTED, {
            socket: socket,
            portDescription: this._portDescription
        });
    }
    /** */
    _onServerError(error) {
        // @todo: implement
        console.log('Server error:', error);
    }
    /** */
    _onServerClose() {
        // @todo: implement
        console.log(`Server closed: on port ${this._port}`);
    }
}
exports.MosSocketServer = MosSocketServer;
//# sourceMappingURL=mosSocketServer.js.map