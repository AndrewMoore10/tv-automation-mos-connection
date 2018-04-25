import { EventEmitter } from 'events'
import { Socket } from 'net'
import { SocketConnectionEvent } from './socketConnection'
import { MosMessage } from '../mosModel/MosMessage'
import * as parser from 'xml2json'
const iconv = require('iconv-lite')

export type CallBackFunction = (err: any, data: object) => void

export class MosSocketClient extends EventEmitter {
	private _host: string
	private _port: number
	private _autoReconnect: boolean = true
	private _reconnectDelay: number = 3000
	private _reconnectAttempts: number = 0
	private _debug: boolean = false

	private _description: string
	private _client: Socket
	private _shouldBeConnected: boolean = false
	private _connected: boolean
	private _lastConnectionAttempt: number
	private _reconnectAttempt: number = 0
	private _connectionAttemptTimer: NodeJS.Timer

	private _commandTimeoutTimer: NodeJS.Timer
	private _commandTimeout: number = 10000

	private _queueCallback: {[messageId: string]: CallBackFunction} = {}
	private _queueMessages: Array<MosMessage> = []
	private _ready: boolean = false

	private processQueueInterval: any
  /** */
	constructor (host: string, port: number, description: string, debug?: boolean) {
		super()
		this._host = host
		this._port = port
		this._description = description
		if (debug) this._debug = debug

	}

  /** */
	set autoReconnect (autoReconnect: boolean) {
		this._autoReconnect = autoReconnect
	}

  /** */
	set autoReconnectInterval (autoReconnectInterval: number) {
		this._reconnectDelay = autoReconnectInterval
	}

  /** */
	set autoReconnectAttempts (autoReconnectAttempts: number) {
		this._reconnectAttempts = autoReconnectAttempts
	}

  /** */
	connect (): void {
		// prevent manipulation of active socket
		if (!this.connected) {
			// throttling attempts
			if (!this._lastConnectionAttempt || (Date.now() - this._lastConnectionAttempt) >= this._reconnectDelay) { // !_lastReconnectionAttempt (means first attempt) OR time > _reconnectionDelay since last attempt
				// recreate client if new attempt:
				if (this._client && this._client.connecting) {
					this._client.destroy()
					this._client.removeAllListeners()
					delete this._client
				}

				// (re)create client, either on first run or new attempt:
				if (!this._client) {
					this._client = new Socket()
					this._client.on('close', (hadError: boolean) => this._onClose(hadError))
					this._client.on('connect', () => this._onConnected())
					this._client.on('data', (data: Buffer) => this._onData(data))
					this._client.on('error', this._onError)
				}

				// connect:
				if (this._debug) console.log(new Date(), `Socket ${this._description} attempting connection`)
				if (this._debug) console.log('port', this._port, 'host', this._host)
				this._client.connect(this._port, this._host)
				this._shouldBeConnected = true
				this._lastConnectionAttempt = Date.now()
			}

			// set timer to retry when needed:
			if (!this._connectionAttemptTimer) {
				this._connectionAttemptTimer = global.setInterval(this._autoReconnectionAttempt, this._reconnectDelay)
			}

			this._ready = true
		}
	}

  /** */
	disconnect (): void {
		this.dispose()
	}

	queueCommand (message: MosMessage, cb: CallBackFunction): void {

		message.prepare()
		// console.log('queueing', message.messageID, message.constructor.name )
		this._queueCallback[message.messageID] = cb
		this._queueMessages.push(message)

		this.processQueue()
	}
	processQueue () {
		if (this._ready) {
			if (this.processQueueInterval) clearInterval(this.processQueueInterval)
			if (this._queueMessages.length) {
				this._ready = false
				let message = this._queueMessages[0]
				this.executeCommand(message)
			}
		} else {
			clearInterval(this.processQueueInterval)
			this.processQueueInterval = setInterval(() => {
				this.processQueue()
			}, 200)
		}
	}

  /** */
	get host (): string {
		if (this._client) {
			return this._host
		}
		return this._host
	}

  /** */
	get port (): number {
		if (this._client) {
			return this._port
		}
		return this._port
	}

  /** */
	dispose (): void {
		this._ready = false
		this._shouldBeConnected = false
		this._clearConnectionAttemptTimer()
		if (this._client) {
			this._client.once('close', () => { this.emit(SocketConnectionEvent.DISPOSED) })
			this._client.end()
			this._client.destroy()
			delete this._client
		}
	}

  /**
   * convenience wrapper to expose all logging calls to parent object
   */
	log (args: any): void {
		if (this._debug) console.log(args)
	}

  /** */
	private set connected (connected: boolean) {
		this._connected = connected === true
		this.emit(SocketConnectionEvent.CONNECTED)
	}

  /** */
	private get connected (): boolean {
		return this._connected
	}

  /** */
	private executeCommand (message: MosMessage): void {

		// message.prepare() // @todo, is prepared? is sent already? logic needed
		let str: string = message.toString()
		let buf = iconv.encode(str, 'utf16-be')

		// console.log('sending',this._client.name, str)

		global.clearTimeout(this._commandTimeoutTimer)
		this._commandTimeoutTimer = global.setTimeout(() => this._onCommandTimeout(), this._commandTimeout)
		this._client.write(buf, 'ucs2')
		if (this._debug) console.log(`MOS command sent from ${this._description} : ${str}\r\nbytes sent: ${this._client.bytesWritten}`)

	}

  /** */
	private _autoReconnectionAttempt (): void {
		if (this._autoReconnect) {
			if (this._reconnectAttempts > 0) {								// no reconnection if no valid reconnectionAttemps is set
				if ((this._reconnectAttempt >= this._reconnectAttempts)) {	// if current attempt is not less than max attempts
					// reset reconnection behaviour
					this._clearConnectionAttemptTimer()
					return
				}
				// new attempt if not allready connected
				if (!this.connected) {
					this._reconnectAttempt++
					this.connect()
				}
			}
		}
	}

	/** */
	private _clearConnectionAttemptTimer (): void {
		// @todo create event telling reconnection ended with result: true/false
		// only if reconnection interval is true
		this._reconnectAttempt = 0
		global.clearInterval(this._connectionAttemptTimer)
		delete this._connectionAttemptTimer
	}

  /** */
	private _onCommandTimeout () {
		global.clearTimeout(this._commandTimeoutTimer)
		this.emit(SocketConnectionEvent.TIMEOUT)
	}

  /** */
	private _onConnected () {
		this._client.emit(SocketConnectionEvent.ALIVE)
		global.clearInterval(this._connectionAttemptTimer)
		// this._clearConnectionAttemptTimer()
		this.connected = true
	}

  /** */
	private _onData (data: Buffer ) {
		this._client.emit(SocketConnectionEvent.ALIVE)
		// data = Buffer.from(data, 'ucs2').toString()
		let str: string = iconv.decode(data, 'utf16-be')

		if (this._debug) console.log(`${this._description} Received: ${str}`)

		try {
			let parsedData: any = parser.toJson(str, {
				'object': true,
				coerce: true,
				trim: true
			})

			let messageId = parsedData.mos.messageID
			let cb: CallBackFunction | undefined = this._queueCallback[messageId]
			let msg = this._queueMessages[0]
			if (msg.messageID.toString() !== (messageId + '')) {
				console.log('Mos reply id diff: ' + messageId + ', ' + msg.messageID)
			}
			if (cb) {
				cb(null, parsedData)
				this._queueMessages.shift() // remove the first message
				delete this._queueCallback[messageId]
			}

		} catch (e) {
			console.log('str', str)
			throw e
		}

		this._ready = true
		this.processQueue()
	}

  /** */
	private _onError (error: Error) {
		// dispatch error!!!!!
		if (this._debug) console.log(`Socket event error: ${error.message}`)
	}

	/** */
	private _onClose (hadError: boolean) {
		this.connected = false
		this._ready = false
		if (hadError) {
			if (this._debug) console.log('Socket closed with error')
		} else {
			if (this._debug) console.log('Socket closed without error')
		}

		this.emit(SocketConnectionEvent.DISCONNECTED)

		if (this._shouldBeConnected === true) {
			if (this._debug) console.log('Socket should reconnect')
			this.connect()
		}
	}
}
