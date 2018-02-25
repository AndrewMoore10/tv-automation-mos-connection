import {Socket} from 'net'
import {ConnectionConfig, ProfilesSupport} from './config/connectionConfig'
import {MosSocketServer} from './connection/mosSocketServer'
import {IMosConnection} from './api'
import { SocketServerEvent, SocketDescription } from './connection/socketConnection';
import { Server } from './connection/Server';


export class MosConnection implements IMosConnection {
	static CONNECTION_PORT_LOWER: number = 10540
	static CONNECTION_PORT_UPPER: number = 10541
	static CONNECTION_PORT_QUERY: number = 10542
	static _i: number = 0

	private _isListening: Promise<boolean[]>

	private _conf: ConnectionConfig

	private _upperSocketServer: MosSocketServer
	private _querySocketServer: MosSocketServer
	private _servers: {[host: string]: Server} = {}
	
	/** */
	constructor (config: ConnectionConfig) {
		this._conf = config
		if (this._conf.acceptsConnections) {
			this._isListening = this._initiateIncomingConnections()
		}
	}

	/** */
	get isListening(): Promise<boolean[]> {
		return this._isListening || Promise.reject(`Mos connection is not listening for connections. "Config.acceptsConnections" is "${this._conf.acceptsConnections}"`)
	}

	/** */
	get isCompliant(): boolean {
		return true
	}

	/** */
	get acceptsConnections(): boolean {
		return this._conf.acceptsConnections
	}

	/** */
	getProfiles(): ProfilesSupport {
		return this._conf.profiles
	}

	/** */
	dispose(): Promise<void> {
		let upperSockets: Socket[] = []
		let querySockets: Socket[] = []

		for (let i in this._servers) {
			let server = this._servers[i]
			upperSockets = upperSockets.concat(server.upperPortSockets)
			querySockets = querySockets.concat(server.queryPortSockets)
		}

		let disposing: Promise<void>[] = []
		if (this._upperSocketServer) {
			disposing.push(this._upperSocketServer.dispose(upperSockets))
		}
		if (this._querySocketServer) {
			disposing.push(this._querySocketServer.dispose(querySockets))
		}

		// @todo: all outgoing client

		return new Promise((outerResolve) => {
			Promise.all(disposing)
				.then(() => outerResolve())
		})
	}

	/** */
	getComplianceText(): string {
		if (this.isCompliant) {
			let profiles: string[] = []
			for (let i in this._conf.profiles) {
				if (this._conf.profiles[i] === true) {
					profiles.push(i)
				}
			}

			return `MOS Compatible – Profiles ${profiles.join(',')}`
		}
		return 'Warning: Not MOS compatible'
	}

	/** */
	private _initiateIncomingConnections(): Promise<boolean[]> {
		// shouldn't accept connections, so won't rig socket servers
		if (!this._conf.acceptsConnections) {
			return Promise.reject(false)
		}

		// setup two socket servers, then resolve with their listening statuses
		return new Promise((outerResolve) => {
			this._upperSocketServer = new MosSocketServer(MosConnection.CONNECTION_PORT_UPPER, 'upper')
			this._querySocketServer = new MosSocketServer(MosConnection.CONNECTION_PORT_QUERY, 'query')

			this._upperSocketServer.on(SocketServerEvent.CLIENT_CONNECTED, (e: SocketDescription) => this._registerIncomingClient(e))
			this._querySocketServer.on(SocketServerEvent.CLIENT_CONNECTED, (e: SocketDescription) => this._registerIncomingClient(e))

			Promise.all(
				[
					this._upperSocketServer.listen(),
					this._querySocketServer.listen()
				]
			)
			.then(result => outerResolve(result))
		})
	}

	/** */
	private _registerIncomingClient (e: SocketDescription) {
		let socketID = MosConnection.i

		// handles socket listeners
		e.socket.on('close', (/*hadError: boolean*/) => this._disposeIncomingSocket(e.socket, socketID))
		e.socket.on('data', (data: string) => console.log(`Socket got data (${socketID}, ${e.socket.remoteAddress}, ${e.portDescription}): ${data}`))
		e.socket.on('error', (error: Error) => console.log(`Socket had error (${socketID}, ${e.socket.remoteAddress}, ${e.portDescription}): ${error}`))

		// registers socket on server
		let server: Server = this._getServerForHost(e.socket.remoteAddress)
		server.registerIncomingConnection(socketID, e.socket, e.portDescription)
		console.log('added: ', this._servers)
	}

	/** */
	private _disposeIncomingSocket(socket: Socket, socketID: number) {
		socket.removeAllListeners()
		socket.destroy()
		this._getServerForHost(socket.remoteAddress).removeSocket(socketID)
		console.log('removed: ', this._servers, '\n')
	}

	/** */
	private _getServerForHost(host: string): Server {
		// create new server if not known
		if (!this._servers[host]) {
			this._servers[host] = new Server()
		}

		return this._servers[host]
	}

	private static get i(): number {
		return this._i++
	}
}
