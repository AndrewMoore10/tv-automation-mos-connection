/** */
export interface IConnectionConfig {
    mosID: string;
    acceptsConnections: boolean;
    accepsConnectionsFrom?: string[];
    profiles: IProfiles;
}
/** */
export interface IProfiles {
    '0': boolean;
    '1'?: boolean;
    '2'?: boolean;
    '3'?: boolean;
    '4'?: boolean;
    '5'?: boolean;
    '6'?: boolean;
    '7'?: boolean;
}
export declare class ConnectionConfig {
    mosID: string;
    acceptsConnections: boolean;
    accepsConnectionsFrom: string[];
    private _profiles;
    constructor(init: IConnectionConfig);
    /** */
    /** */
    profiles: IProfiles;
}
