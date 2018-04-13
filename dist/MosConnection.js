"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionConfig_1 = require("./config/connectionConfig");
const mosSocketServer_1 = require("./connection/mosSocketServer");
const MosDevice_1 = require("./MosDevice");
const socketConnection_1 = require("./connection/socketConnection");
const Server_1 = require("./connection/Server");
class MosConnection {
    /** */
    constructor(configOptions) {
        this._servers = {};
        this._conf = new connectionConfig_1.ConnectionConfig(configOptions);
        if (this._conf.acceptsConnections) {
            this._isListening = this._initiateIncomingConnections();
        }
    }
    /** */
    connect(connectionOptions) {
        // @todo: implement this
        return new Promise((resolve) => {
            // connect to mos device
            // initialize mosDevice:
            let mosDevice = new MosDevice_1.MosDevice(connectionOptions); // pseudo-code here, put something real
            /*let mosDevice = {
                onRequestMOSObject () {},
                onRequestAllMOSObjects () {},
                getMOSObject () {},
                getAllMOSObjects () {}
            }*/
            // emit to .onConnection
            if (this._onconnection)
                this._onconnection(mosDevice);
            resolve(mosDevice);
        });
    }
    onConnection(cb) {
        this._onconnection = cb;
    }
    /** */
    get isListening() {
        return this._isListening || Promise.reject(`Mos connection is not listening for connections. "Config.acceptsConnections" is "${this._conf.acceptsConnections}"`);
    }
    /** */
    get isCompliant() {
        return false;
    }
    /** */
    get acceptsConnections() {
        return this._conf.acceptsConnections;
    }
    /** */
    get profiles() {
        return this._conf.profiles;
    }
    /** */
    dispose() {
        let lowerSockets = [];
        let upperSockets = [];
        let querySockets = [];
        for (let nextSocketID in this._servers) {
            let server = this._servers[nextSocketID];
            lowerSockets = lowerSockets.concat(server.lowerPortSockets);
            upperSockets = upperSockets.concat(server.upperPortSockets);
            querySockets = querySockets.concat(server.queryPortSockets);
        }
        let disposing = [];
        if (this._lowerSocketServer) {
            disposing.push(this._lowerSocketServer.dispose(lowerSockets));
        }
        if (this._upperSocketServer) {
            disposing.push(this._upperSocketServer.dispose(upperSockets));
        }
        if (this._querySocketServer) {
            disposing.push(this._querySocketServer.dispose(querySockets));
        }
        return new Promise((resolveDispose) => {
            Promise.all(disposing)
                .then(() => resolveDispose());
        });
        // @todo: all outgoing clients
    }
    /** */
    get complianceText() {
        if (this.isCompliant) {
            let profiles = [];
            for (let nextSocketID in this._conf.profiles) {
                if (this._conf.profiles[nextSocketID] === true) {
                    profiles.push(nextSocketID);
                }
            }
            return `MOS Compatible – Profiles ${profiles.join(',')}`;
        }
        return 'Warning: Not MOS compatible';
    }
    /** */
    _initiateIncomingConnections() {
        // shouldn't accept connections, so won't rig socket servers
        if (!this._conf.acceptsConnections) {
            return Promise.reject(false);
        }
        // setup two socket servers, then resolve with their listening statuses
        return new Promise((resolveDispose) => {
            this._lowerSocketServer = new mosSocketServer_1.MosSocketServer(MosConnection.CONNECTION_PORT_LOWER, 'lower');
            this._upperSocketServer = new mosSocketServer_1.MosSocketServer(MosConnection.CONNECTION_PORT_UPPER, 'upper');
            this._querySocketServer = new mosSocketServer_1.MosSocketServer(MosConnection.CONNECTION_PORT_QUERY, 'query');
            this._lowerSocketServer.on(socketConnection_1.SocketServerEvent.CLIENT_CONNECTED, (e) => this._registerIncomingClient(e));
            this._upperSocketServer.on(socketConnection_1.SocketServerEvent.CLIENT_CONNECTED, (e) => this._registerIncomingClient(e));
            this._querySocketServer.on(socketConnection_1.SocketServerEvent.CLIENT_CONNECTED, (e) => this._registerIncomingClient(e));
            Promise.all([
                this._lowerSocketServer.listen(),
                this._upperSocketServer.listen(),
                this._querySocketServer.listen()
            ])
                .then(result => resolveDispose(result));
        });
    }
    /** */
    _registerIncomingClient(e) {
        let socketID = MosConnection.nextSocketID;
        // handles socket listeners
        e.socket.on('close', ( /*hadError: boolean*/) => this._disposeIncomingSocket(e.socket, socketID));
        e.socket.on('data', (data) => console.log(`Socket got data (${socketID}, ${e.socket.remoteAddress}, ${e.portDescription}): ${data}`));
        e.socket.on('error', (error) => console.log(`Socket had error (${socketID}, ${e.socket.remoteAddress}, ${e.portDescription}): ${error}`));
        // registers socket on server
        let server = this._getServerForHost(e.socket.remoteAddress);
        server.registerIncomingConnection(socketID, e.socket, e.portDescription);
        console.log('added: ', this._servers);
    }
    /** */
    _disposeIncomingSocket(socket, socketID) {
        socket.removeAllListeners();
        socket.destroy();
        this._getServerForHost(socket.remoteAddress).removeSocket(socketID);
        console.log('removed: ', this._servers, '\n');
    }
    /** */
    _getServerForHost(host) {
        // create new server if not known
        if (!this._servers[host]) {
            this._servers[host] = new Server_1.Server();
        }
        return this._servers[host];
    }
    static get nextSocketID() {
        return this._nextSocketID++;
    }
}
MosConnection.CONNECTION_PORT_LOWER = 10540;
MosConnection.CONNECTION_PORT_UPPER = 10541;
MosConnection.CONNECTION_PORT_QUERY = 10542;
MosConnection._nextSocketID = 0;
exports.MosConnection = MosConnection;
//# sourceMappingURL=MosConnection.js.map