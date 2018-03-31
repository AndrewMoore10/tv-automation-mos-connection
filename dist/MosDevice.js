"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XMLBuilder = require("xmlbuilder");
const mosString128_1 = require("./dataTypes/mosString128");
const mosTime_1 = require("./dataTypes/mosTime");
class MosDevice {
    constructor(connectionOptions) {
        //this.socket = socket
        this.manufacturer = new mosString128_1.MosString128('RadioVision, Ltd.');
        this.model = new mosString128_1.MosString128('TCS6000');
        this.hwRev = new mosString128_1.MosString128('0.1'); // empty string returnes <hwRev/>
        this.swRev = new mosString128_1.MosString128('0.1');
        this.DOM = new mosTime_1.MosTime();
        this.SN = new mosString128_1.MosString128('927748927');
        this.ID = new mosString128_1.MosString128('airchache.newscenter.com');
        this.time = new mosTime_1.MosTime();
        this.opTime = new mosTime_1.MosTime();
        this.mosRev = new mosString128_1.MosString128("2.8.5");
        this.supportedProfiles = {
            deviceType: 'MOS',
            profile0: true,
            profile1: true,
            profile2: false,
            profile3: false,
            profile4: false,
            profile5: false,
            profile6: false,
            profile7: false
        };
        console.log(connectionOptions);
    }
    getMachineInfo() {
        // @todo: implement this
        return new Promise((resolve) => {
            let list = {
                manufacturer: this.manufacturer,
                model: this.model,
                hwRev: this.hwRev,
                swRev: this.swRev,
                DOM: this.DOM,
                SN: this.SN,
                ID: this.ID,
                time: this.time,
                opTime: this.opTime,
                mosRev: this.mosRev,
                supportedProfiles: this.supportedProfiles,
                defaultActiveX: this.defaultActiveX,
                mosExternalMetaData: this.mosExternalMetaData
            };
            resolve(list);
        });
    }
    get messageXMLBlocks() {
        let root = XMLBuilder.create('listMachInfo'); // config headless 
        root.ele('manufacturer', this.manufacturer.toString());
        root.ele('model', this.model.toString());
        root.ele('hwRev', this.hwRev.toString());
        root.ele('swRev', this.swRev.toString());
        root.ele('DOM', this.DOM.toString());
        root.ele('SN', this.SN.toString());
        root.ele('ID', this.ID.toString());
        root.ele('time', this.time.toString());
        root.ele('opTime', this.opTime.toString());
        root.ele('mosRev', this.mosRev.toString());
        let p = root.ele('supportedProfiles').att('deviceType', this.supportedProfiles.deviceType);
        for (let i = 0; i < 8; i++) { // constant for # av profiles?
            p.ele('mosProfile', (this.supportedProfiles['profile' + i] ? 'YES' : 'NO')).att('number', i);
        }
        // root.ele('defaultActiveX', this.manufacturer)
        // root.ele('mosExternalMetaData', this.manufacturer) import from IMOSExternalMetaData
        return root;
    }
}
exports.MosDevice = MosDevice;
//# sourceMappingURL=MosDevice.js.map