export declare interface RobotKeyword {
  (source: string, subString: string): boolean;

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
  timeout?: number;
  cookies?: boolean; // if true then cookies returned by server will be stored and sent back on the next calls.
}

/**
 * An Robot Framework remote server implementation
 * @param Array of libraries containing Robot Framework keyword implementations
 * @param options: Options for setting up the xmlrpc server
 * @param listeningCallback Callback function that will be passed to the httpServer.listen method (from https module)
 */
export declare class Server {
  constructor(libraries: KeywordLibrary[], options: RemoteServerOptions, listeningCallback?: Function);
  stopRemoteServer(): boolean | Error;
}
