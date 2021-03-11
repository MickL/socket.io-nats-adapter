import uid2 = require("uid2");
import { Adapter } from "socket.io-adapter";
import { NatsConnection } from 'nats';

const debug = require("debug")("socket.io-nats-adapter");

export interface NatsAdapterOptions {
  /**
   * the name of the key to pub/sub events on as prefix
   * @default socket.io
   */
  key: string;
  /**
   * after this timeout the adapter will stop waiting from responses to request
   * @default 5000
   */
  requestsTimeout: number;
}

/**
 * Returns a NATS Adapter function
 */
export const createNatsAdapter = (connection: NatsConnection, opts?: Partial<NatsAdapterOptions>) => {
  return function (nsp: any) {
    return new NatsAdapter(nsp, connection, opts);
  };
}

export class NatsAdapter extends Adapter {
  public readonly uid;
  public readonly connection: NatsConnection;
  public readonly requestsTimeout: number;
  private readonly channel: string;
  // private readonly requestChannel: string;
  // private readonly responseChannel: string;
  // private requests: Map<string, Request> = new Map();

  /**
   * Adapter constructor
   */
  constructor(
    nsp: any,
    connection: NatsConnection,
    opts: Partial<NatsAdapterOptions> = {}
  ) {
    super(nsp);

    this.uid             = uid2(6);
    this.connection      = connection;
    this.requestsTimeout = opts.requestsTimeout || 5000;

    const prefix = opts.key || "socket.io";

    this.channel = prefix + "#" + nsp.name + "#";
    // this.requestChannel  = prefix + "-request#" + this.nsp.name + "#";
    // this.responseChannel = prefix + "-response#" + this.nsp.name + "#";

    const onError = (err) => {
      if (err) {
        this.emit("error", err);
      }
    };

    debug(`Test :)`);

    // this.subClient.psubscribe(this.channel + "*", onError);
    // this.subClient.on("pmessageBuffer", this.onmessage.bind(this));
    //
    // this.subClient.subscribe(
    //     [this.requestChannel, this.responseChannel],
    //     onError
    // );
    // this.subClient.on("messageBuffer", this.onrequest.bind(this));
    //
    // this.pubClient.on("error", onError);
    // this.subClient.on("error", onError);
  }
}

module.exports = createNatsAdapter;
