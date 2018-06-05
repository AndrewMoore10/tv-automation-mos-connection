"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const net_1 = require("net");
const socketConnection_1 = require("./socketConnection");
const parser = require("xml2json");
const iconv = require('iconv-lite');
const parseOptions = {
    'object': true,
    coerce: true,
    trim: true
};
class MosSocketClient extends events_1.EventEmitter {
    /** */
    constructor(host, port, description, timeout, debug) {
        super();
        this._autoReconnect = true;
        this._reconnectDelay = 3000;
        this._reconnectAttempts = 0;
        this._debug = false;
        this._shouldBeConnected = false;
        this._connected = false;
        this._reconnectAttempt = 0;
        this._queueCallback = {};
        this._queueMessages = [];
        this._sentMessage = null;
        this._startingUp = true;
        this.dataChunks = '';
        this._host = host;
        this._port = port;
        this._description = description;
        this._commandTimeout = timeout || 5000;
        if (debug)
            this._debug = debug;
    }
    /** */
    set autoReconnect(autoReconnect) {
        this._autoReconnect = autoReconnect;
    }
    /** */
    set autoReconnectInterval(autoReconnectInterval) {
        this._reconnectDelay = autoReconnectInterval;
    }
    /** */
    set autoReconnectAttempts(autoReconnectAttempts) {
        this._reconnectAttempts = autoReconnectAttempts;
    }
    /** */
    connect() {
        // prevent manipulation of active socket
        if (!this.connected) {
            // throttling attempts
            if (!this._lastConnectionAttempt || (Date.now() - this._lastConnectionAttempt) >= this._reconnectDelay) {
                // recreate client if new attempt:
                if (this._client && this._client.connecting) {
                    this._client.destroy();
                    this._client.removeAllListeners();
                    delete this._client;
                }
                // (re)create client, either on first run or new attempt:
                if (!this._client) {
                    this._client = new net_1.Socket();
                    this._client.on('close', (hadError) => this._onClose(hadError));
                    this._client.on('connect', () => this._onConnected());
                    this._client.on('data', (data) => this._onData(data));
                    this._client.on('error', this._onError);
                }
                // connect:
                if (this._debug)
                    console.log(new Date(), `Socket ${this._description} attempting connection`);
                if (this._debug)
                    console.log('port', this._port, 'host', this._host);
                this._client.connect(this._port, this._host);
                this._shouldBeConnected = true;
                this._lastConnectionAttempt = Date.now();
            }
            // set timer to retry when needed:
            if (!this._connectionAttemptTimer) {
                this._connectionAttemptTimer = global.setInterval(() => {
                    this._autoReconnectionAttempt();
                }, this._reconnectDelay);
            }
            // this._readyToSendMessage = true
            // this._sentMessage = null
        }
    }
    /** */
    disconnect() {
        this.dispose();
    }
    queueCommand(message, cb) {
        message.prepare();
        // console.log('queueing', message.messageID, message.constructor.name )
        this._queueCallback[message.messageID + ''] = cb;
        this._queueMessages.push({ time: Date.now(), msg: message });
        this.processQueue();
    }
    processQueue() {
        // console.log('this.connected', this.connected)
        if (!this._sentMessage && this.connected) {
            if (this.processQueueTimeout)
                clearTimeout(this.processQueueTimeout);
            let message = this._queueMessages.shift();
            if (message) {
                // Send the message:
                this.executeCommand(message);
            }
            else {
                // The queue is empty, do nothing
            }
        }
        else {
            // Try again later:
            clearTimeout(this.processQueueTimeout);
            this.processQueueTimeout = setTimeout(() => {
                this.processQueue();
            }, 200);
        }
    }
    /** */
    get host() {
        if (this._client) {
            return this._host;
        }
        return this._host;
    }
    /** */
    get port() {
        if (this._client) {
            return this._port;
        }
        return this._port;
    }
    /** */
    dispose() {
        // this._readyToSendMessage = false
        this.connected = false;
        this._shouldBeConnected = false;
        this._clearConnectionAttemptTimer();
        if (this._client) {
            this._client.once('close', () => { this.emit(socketConnection_1.SocketConnectionEvent.DISPOSED); });
            this._client.end();
            this._client.destroy();
            delete this._client;
        }
    }
    /**
     * convenience wrapper to expose all logging calls to parent object
     */
    log(args) {
        if (this._debug)
            console.log(args);
    }
    /** */
    set connected(connected) {
        this._connected = connected === true;
        this.emit(socketConnection_1.SocketConnectionEvent.CONNECTED);
    }
    /** */
    get connected() {
        return this._connected;
    }
    _sendReply(messageId, err, res) {
        let cb = this._queueCallback[messageId + ''];
        if (cb) {
            cb(err, res);
        }
        else {
            // this._onUnhandledCommandTimeout()
        }
        this._sentMessage = null;
        delete this._queueCallback[messageId + ''];
    }
    /** */
    executeCommand(message) {
        if (this._sentMessage)
            throw Error('executeCommand: there already is a sent Command!');
        this._sentMessage = message;
        let sentMessageId = message.msg.messageID;
        // console.log('executeCommand', message)
        // message.prepare() // @todo, is prepared? is sent already? logic needed
        let messageString = message.msg.toString();
        if (this._debug)
            console.log('messageString', messageString);
        let buf = iconv.encode(messageString, 'utf16-be');
        // if (this._debug) console.log('sending',this._client.name, str)
        // Command timeout:
        global.setTimeout(() => {
            if (this._sentMessage && this._sentMessage.msg.messageID === sentMessageId) {
                if (this._debug)
                    console.log('timeout ' + sentMessageId);
                this._sendReply(sentMessageId, Error('Command timed out'), null);
                this.processQueue();
            }
        }, this._commandTimeout);
        this._client.write(buf, 'ucs2');
        if (this._debug)
            console.log(`MOS command sent from ${this._description} : ${messageString}\r\nbytes sent: ${this._client.bytesWritten}`);
        this.emit('rawMessage', 'sent', messageString);
    }
    /** */
    _autoReconnectionAttempt() {
        if (this._autoReconnect) {
            if (this._reconnectAttempts > 0) {
                if ((this._reconnectAttempt >= this._reconnectAttempts)) {
                    // reset reconnection behaviour
                    this._clearConnectionAttemptTimer();
                    return;
                }
                // new attempt if not allready connected
                if (!this.connected) {
                    this._reconnectAttempt++;
                    this.connect();
                }
            }
        }
    }
    /** */
    _clearConnectionAttemptTimer() {
        // @todo create event telling reconnection ended with result: true/false
        // only if reconnection interval is true
        this._reconnectAttempt = 0;
        global.clearInterval(this._connectionAttemptTimer);
        delete this._connectionAttemptTimer;
    }
    /** */
    // private _onUnhandledCommandTimeout () {
    // 	global.clearTimeout(this._commandTimeoutTimer)
    // 	this.emit(SocketConnectionEvent.TIMEOUT)
    // }
    /** */
    _onConnected() {
        this._client.emit(socketConnection_1.SocketConnectionEvent.ALIVE);
        global.clearInterval(this._connectionAttemptTimer);
        // this._clearConnectionAttemptTimer()
        this.connected = true;
    }
    /** */
    _onData(data) {
        this._client.emit(socketConnection_1.SocketConnectionEvent.ALIVE);
        // data = Buffer.from(data, 'ucs2').toString()
        let messageString = iconv.decode(data, 'utf16-be').trim();
        this.emit('rawMessage', 'recieved', messageString);
        if (this._debug)
            console.log(`${this._description} Received: ${messageString}`);
        let firstMatch = '<mos>'; // <mos>
        let first = messageString.substr(0, firstMatch.length);
        let lastMatch = '</mos>'; // </mos>
        let last = messageString.substr(-lastMatch.length);
        let parsedData;
        try {
            // console.log(first === firstMatch, last === lastMatch, last, lastMatch)
            if (first === firstMatch && last === lastMatch) {
                // Data ready to be parsed:
                parsedData = parser.toJson(messageString, parseOptions);
                this.dataChunks = '';
            }
            else if (last === lastMatch) {
                // Last chunk, ready to parse with saved data:
                parsedData = parser.toJson(this.dataChunks + messageString, parseOptions);
                this.dataChunks = '';
            }
            else if (first === firstMatch) {
                // Chunk, save for later:
                this.dataChunks = messageString;
            }
            else {
                // Chunk, save for later:
                this.dataChunks += messageString;
            }
            // let parsedData: any = parser.toJson(messageString, )
            if (parsedData) {
                let messageId = parsedData.mos.messageID;
                if (messageId) {
                    if (this._sentMessage) {
                        if (this._sentMessage.msg.messageID.toString() === (messageId + '')) {
                            this._sendReply(this._sentMessage.msg.messageID, null, parsedData);
                        }
                        else {
                            if (this._debug)
                                console.log('Mos reply id diff: ' + messageId + ', ' + this._sentMessage.msg.messageID);
                            if (this._debug)
                                console.log(parsedData);
                            this.emit('warning', 'Mos reply id diff: ' + messageId + ', ' + this._sentMessage.msg.messageID);
                            this._triggerQueueCleanup();
                        }
                        // let cb: CallBackFunction | undefined = this._queueCallback[messageId]
                        // if (cb) {
                        // 	cb(null, parsedData)
                        // }
                        // delete this._queueCallback[messageId]
                        // this._sentMessage = null
                    }
                    else {
                        // huh, we've got a reply to something we've not sent.
                        if (this._debug)
                            console.log('Got a reply (' + messageId + '), but we haven\'t sent any message', messageString);
                        this.emit('warning', 'Got a reply (' + messageId + '), but we haven\'t sent any message ' + messageString);
                    }
                    clearTimeout(this._commandTimeoutTimer);
                }
                else {
                    // error message?
                    if (parsedData.mos.mosAck && parsedData.mos.mosAck.status === 'NACK') {
                        if (this._debug)
                            console.log('Mos Error message:' + parsedData.mos.mosAck.statusDescription);
                        this.emit('error', 'Error message: ' + parsedData.mos.mosAck.statusDescription);
                    }
                    else {
                        // unknown message..
                        this.emit('error', 'Unknown message: ' + messageString);
                    }
                }
            }
            else {
                return;
            }
            // console.log('messageString', messageString)
            // console.log('first msg', messageString)
            this._startingUp = false;
        }
        catch (e) {
            // console.log('messageString', messageString)
            if (this._startingUp) {
                // when starting up, we might get half a message, let's ignore this error then
                console.log('Strange XML-message upon startup');
            }
            else {
                console.log('dataChunks-------------\n', this.dataChunks);
                console.log('messageString---------\n', messageString);
                this.emit('error', e);
            }
        }
        // this._readyToSendMessage = true
        this.processQueue();
    }
    /** */
    _onError(error) {
        // dispatch error!!!!!
        if (this._debug)
            console.log(`Socket event error: ${error.message}`);
    }
    /** */
    _onClose(hadError) {
        this.connected = false;
        // this._readyToSendMessage = false
        if (hadError) {
            if (this._debug)
                console.log('Socket closed with error');
        }
        else {
            if (this._debug)
                console.log('Socket closed without error');
        }
        this.emit(socketConnection_1.SocketConnectionEvent.DISCONNECTED);
        if (this._shouldBeConnected === true) {
            if (this._debug)
                console.log('Socket should reconnect');
            this.connect();
        }
    }
    _triggerQueueCleanup() {
        // in case we're in unsync with messages, prevent deadlock:
        setTimeout(() => {
            console.log('QueueCleanup');
            for (let i = this._queueMessages.length - 1; i >= 0; i--) {
                let message = this._queueMessages[i];
                if (Date.now() - message.time > this._commandTimeout) {
                    this._sendReply(message.msg.messageID, Error('Command Timeout'), null);
                    this._queueMessages.splice(i, 1);
                }
            }
        }, this._commandTimeout);
    }
}
exports.MosSocketClient = MosSocketClient;
//# sourceMappingURL=mosSocketClient.js.map