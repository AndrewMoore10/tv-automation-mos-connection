"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLBuilder = require("xmlbuilder");
class MosMessage {
    /** */
    prepare() {
        if (!this.mosID)
            throw new Error(`Can't prepare message: mosID missing`);
        if (!this.ncsID)
            throw new Error(`Can't prepare message: ncsID missing`);
        this._messageID = MosMessage.messageID;
    }
    /** */
    get messageID() {
        return this._messageID;
    }
    /** */
    toString() {
        let xml = XMLBuilder.create('mos', undefined, undefined, {
            headless: true
        });
        xml.ele('ncsID', this.ncsID);
        xml.ele('mosID', this.mosID);
        xml.ele('messageID', this.messageID);
        xml.importDocument(this.messageXMLBlocks);
        return xml.end({ pretty: true });
    }
    /**  */
    static get messageID() {
        // increments and returns a signed 32-bit int counting from 1, resetting to 1 when wrapping
        return MosMessage._messageID = MosMessage._messageID >= MosMessage.MAX_MESSAGE_ID ? 1 : MosMessage._messageID + 1;
    }
}
MosMessage.MAX_MESSAGE_ID = Math.pow(2, 31) - 2;
MosMessage._messageID = 1;
exports.MosMessage = MosMessage;
//# sourceMappingURL=MosMessage.js.map