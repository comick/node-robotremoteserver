export declare interface RobotKeyword {
    (...any): any;

    doc?: string;
    tags?: string[];
    args?: string[];
}

export declare interface KeywordLibrary {
    [index: string]: RobotKeyword;
}

export declare interface RemoteServerOptions {
    host?: string;
    port?: number;
    allowStop?: boolean;
    timeout?: string;
    cookies?: boolean; // if true then cookies returned by server will be stored and sent back on the next calls.
}

/**
 * A Robot Framework remote server implementation
 * @param Array of libraries containing Robot Framework keyword implementations
 * @param options: Options for setting up the xmlrpc server
 * @param listeningCallback Callback function that will be passed to the httpServer.listen method (from https module)
 */
export declare class Server {
    constructor(libraries:KeywordLibrary[], options:RemoteServerOptions, listeningCallback?:Function);
    stopRemoteServer():boolean | Error;
}
