import ConnectionConfig from './config/connectionConfig'
import MosSocketClient from './socket/mosSocketClient'
import MosSocketServer from './socket/mosSocketServer'
import {SocketConnectionStatus} from './socket/mosSocketEvents'
import MosMessage from './mosModel/MosMessage'

export default class MosConnection {
  static PORT_LOWER: number = 10540
  static PORT_UPPER: number = 10541
  static PORT_QUERY: number = 10542

  private _conf: ConnectionConfig

  private _lowerSocket: MosSocketClient
  private _upperSocket: MosSocketServer
  private _querySocket: MosSocketServer
  private _lowerBuddySocket: MosSocketClient
  private _upperBuddySocket: MosSocketServer
  private _queryBuddySocket: MosSocketServer

  private _hasBuddy: boolean

  /** */
  constructor (conf: ConnectionConfig) {

    this._conf = conf

    this._lowerSocket = new MosSocketClient(this._conf.ncs.host, MosConnection.PORT_LOWER, 'Lower')
    this._upperSocket = new MosSocketServer(MosConnection.PORT_UPPER, 'Upper')
    this._querySocket = new MosSocketServer(MosConnection.PORT_QUERY, 'Query')

    if (this._conf.ncsBuddy !== undefined) {
      this._hasBuddy = true
      this._lowerBuddySocket = new MosSocketClient(this._conf.ncsBuddy.host, MosConnection.PORT_LOWER, 'Lower')
      this._upperBuddySocket = new MosSocketServer(MosConnection.PORT_UPPER, 'Upper')
      this._queryBuddySocket = new MosSocketServer(MosConnection.PORT_QUERY, 'Query')
    }

    this._lowerSocket.on(SocketConnectionStatus.CONNECTED, () => {
      this.sendLowerCommand(new HeartBeat())
    })
  }

  }
}
