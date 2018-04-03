import { Socket } from 'net'
import { ConnectionConfig, IConnectionConfig, IProfiles } from './config/connectionConfig'
import { MosSocketClient } from './connection/mosSocketClient'
import { MosSocketServer } from './connection/mosSocketServer'
import {
	IMosConnection,
	IMOSDeviceConnectionOptions,
	IMOSDevice
} from './api'
import { MosDevice } from './MosDevice'
import { SocketServerEvent, SocketDescription } from './connection/socketConnection'
import { NCSServerConnection } from './connection/Server'
const iconv = require('iconv-lite')

export class MosConnection implements IMosConnection {
	static CONNECTION_PORT_LOWER: number = 10540
	static CONNECTION_PORT_UPPER: number = 10541
	static CONNECTION_PORT_QUERY: number = 10542
	static _nextSocketID: number = 0

	private _conf: ConnectionConfig

	private _lowerSocketServer: MosSocketServer
	private _upperSocketServer: MosSocketServer
	private _querySocketServer: MosSocketServer
	private _servers: {[host: string]: NCSServerConnection} = {}

	private _isListening: Promise<boolean[]>

	private _onconnection: (mosDevice: IMOSDevice) => void

	/** */
	constructor (configOptions: IConnectionConfig) {
		this._conf = new ConnectionConfig(configOptions)

		if (this._conf.acceptsConnections) {
			this._isListening = this._initiateIncomingConnections()
		}
	}

	/** */
	connect (connectionOptions: IMOSDeviceConnectionOptions): Promise<IMOSDevice> {
		// @todo: implement this

		return new Promise((resolve) => {

			// connect to mos device
			// Store MosSocketClients instead of Sockets in Server?
			// Create MosSocketClients in construct?
			let primary = new NCSServerConnection(connectionOptions.primary.id, connectionOptions.primary.host, this._conf.mosID)
			let secondary
			this._servers[connectionOptions.primary.host] = primary 

			primary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_LOWER, 'lower')
			primary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_UPPER, 'upper')
			primary.connect()

			if (connectionOptions.secondary) {
				secondary = new NCSServerConnection(connectionOptions.secondary.id, connectionOptions.secondary.host, this._conf.mosID)
				this._servers[connectionOptions.secondary.host] = secondary 
				secondary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_LOWER, 'lower')
				secondary.createClient(MosConnection.nextSocketID, MosConnection.CONNECTION_PORT_UPPER, 'upper')
				secondary.connect()
			}

			console.log(this._servers)

			// initialize mosDevice:
			let connectionConfig = this._conf
			let mosDevice = new MosDevice(connectionConfig, connectionOptions, primary, secondary) // pseudo-code here, put something real

			// emit to .onConnection
			if (this._onconnection) this._onconnection(mosDevice)

			resolve(mosDevice)

		})
	}
	onConnection (cb: (mosDevice: IMOSDevice) => void) {
		this._onconnection = cb
	}

	/** */
	get isListening (): Promise<boolean[]> {
		return this._isListening || Promise.reject(`Mos connection is not listening for connections. "Config.acceptsConnections" is "${this._conf.acceptsConnections}"`)
	}

	/** */
	get isCompliant (): boolean {
		return false
	}

	/** */
	get acceptsConnections (): boolean {
		return this._conf.acceptsConnections
	}

	/** */
	get profiles (): IProfiles {
		return this._conf.profiles
	}

	/** */
	dispose (): Promise<void> {
		let lowerSockets: Socket[] = []
		let upperSockets: Socket[] = []
		let querySockets: Socket[] = []

		for (let nextSocketID in this._servers) {
			let server = this._servers[nextSocketID]
			lowerSockets = lowerSockets.concat(server.lowerPortClients)
			upperSockets = upperSockets.concat(server.upperPortClients)
			querySockets = querySockets.concat(server.queryPortClients)
		}

		let disposing: Promise<void>[] = []
		if (this._lowerSocketServer) {
			disposing.push(this._lowerSocketServer.dispose(lowerSockets))
		}
		if (this._upperSocketServer) {
			disposing.push(this._upperSocketServer.dispose(upperSockets))
		}
		if (this._querySocketServer) {
			disposing.push(this._querySocketServer.dispose(querySockets))
		}

		return new Promise((resolveDispose) => {
			Promise.all(disposing)
			.then(() => resolveDispose())
		})
		// @todo: all outgoing clients
	}

	/** */
	get complianceText (): string {
		if (this.isCompliant) {
			let profiles: string[] = []
			for (let nextSocketID in this._conf.profiles) {
				if (this._conf.profiles[nextSocketID] === true) {
					profiles.push(nextSocketID)
				}
			}

			return `MOS Compatible – Profiles ${profiles.join(',')}`
		}
		return 'Warning: Not MOS compatible'
	}

	/** */
	private _initiateIncomingConnections (): Promise<boolean[]> {
		//console.log('_initiateIncomingConnections')
		// shouldn't accept connections, so won't rig socket servers
		if (!this._conf.acceptsConnections) {
			//console.log('reject')
			return Promise.reject(false)
		}

		// setup two socket servers, then resolve with their listening statuses
		return new Promise((resolveDispose) => {
			this._lowerSocketServer = new MosSocketServer(MosConnection.CONNECTION_PORT_LOWER, 'lower')
			this._upperSocketServer = new MosSocketServer(MosConnection.CONNECTION_PORT_UPPER, 'upper')
			this._querySocketServer = new MosSocketServer(MosConnection.CONNECTION_PORT_QUERY, 'query')

			this._lowerSocketServer.on(SocketServerEvent.CLIENT_CONNECTED, (e: SocketDescription) => this._registerIncomingClient(e))
			this._upperSocketServer.on(SocketServerEvent.CLIENT_CONNECTED, (e: SocketDescription) => this._registerIncomingClient(e))
			this._querySocketServer.on(SocketServerEvent.CLIENT_CONNECTED, (e: SocketDescription) => this._registerIncomingClient(e))

			//console.log('listen on all ports')
			Promise.all(
				[
					this._lowerSocketServer.listen(),
					this._upperSocketServer.listen(),
					this._querySocketServer.listen()
				]
			)
			.then(result => resolveDispose(result))
		})
	}

	/** */
	private _registerIncomingClient (e: SocketDescription) {
		let socketID = MosConnection.nextSocketID

		// handles socket listeners
		e.socket.on('close', (/*hadError: boolean*/) => this._disposeIncomingSocket(e.socket, socketID))
		e.socket.on('data', (data: string) => {
			console.log(`Socket got data (${socketID}, ${e.socket.remoteAddress}, ${e.portDescription}): ${data}`)

			let buf = iconv.encode('<mos><mosID>test2.enps.mos</mosID><ncsID>2012R2ENPS8VM</ncsID><messageID>99</messageID><roAck><roID>2012R2ENPS8VM;P_ENPSMOS\W\F_HOLD ROs;DEC46951-28F9-4A11-8B0655D96B347E52</roID><roStatus>Unknown object M000133</roStatus><storyID>5983A501:0049B924:8390EF2B</storyID><itemID>0</itemID><objID>M000224</objID><status>LOADED</status><storyID>3854737F:0003A34D:983A0B28</storyID><itemID>0</itemID><objID>M000133</objID><itemChannel>A</itemChannel><status>UNKNOWN</status></roAck></mos>', 'utf16-be')
			e.socket.write(buf, 'usc2')
		})
		e.socket.on('error', (error: Error) => console.log(`Socket had error (${socketID}, ${e.socket.remoteAddress}, ${e.portDescription}): ${error}`))

		// registers socket on server
		// e.socket.remoteAddress är ej OK id, måste bytas ut
		let server: NCSServerConnection = this._getServerForHost(e.socket.remoteAddress)
		server.registerIncomingConnection(socketID, e.socket, e.portDescription)
		console.log('added: ', this._servers)
	}

	/** */
	private _disposeIncomingSocket (socket: Socket, socketID: number) {
		socket.removeAllListeners()
		socket.destroy()
		// e.socket.remoteAddress är ej OK id, måste bytas ut
		this._getServerForHost(socket.remoteAddress).removeSocket(socketID)
		console.log('removed: ', this._servers, '\n')
	}

	/** */
	private _getServerForHost (host: string): NCSServerConnection {
		// create new server if not known
		if (!this._servers[host]) {
			this._servers[host] = new NCSServerConnection()
		}

		return this._servers[host]
	}

	private static get nextSocketID (): number {
		return this._nextSocketID++
	}
}
