import * as uid2 from "uid2";
import { Adapter, BroadcastOptions } from "socket.io-adapter";
import { Client } from "nats";
import * as _debug from "debug";

const debug = _debug("socket.io-nats-adapter");

export interface NatsAdapterOptions {
  key: string;
  requestsTimeout: number;
}

export interface Dto {
  fromUid: string;
  packet: any;
  opts: any;
}

/**
 * Returns a NATS Adapter function
 */
export const createNatsAdapter = (
  client: Client,
  opts?: Partial<NatsAdapterOptions>
) => {
  return function (nsp: any) {
    return new NatsAdapter(nsp, client, opts);
  };
};

export class NatsAdapter extends Adapter {
  private uid = uid2(6);
  private requestsTimeout: number;
  private channel: string;
  // private readonly requestChannel: string;
  // private readonly responseChannel: string;
  // private requests: Map<string, Request> = new Map();

  /**
   * Adapter constructor
   */
  constructor(
    public readonly nsp: any,
    private client: Client,
    private opts: Partial<NatsAdapterOptions> = {}
  ) {
    super(nsp);

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

    this.client.subscribe(this.channel, this.onMessage.bind(this));

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

  broadcast(packet: any, opts: BroadcastOptions): void {
    packet.nsp = this.nsp.name;

    const onlyLocal = opts && opts.flags && opts.flags.local;

    if (!onlyLocal) {
      const dto: Dto = {
        fromUid: this.uid,
        packet,
        opts,
      };

      let subject = this.channel;

      if (opts.rooms && opts.rooms.size === 1) {
        subject += opts.rooms.keys().next().value + "#";
      }

      const msg = JSON.stringify(dto);

      debug("publishing message to channel %s", subject);

      this.client.publish(subject, msg);
    }

    super.broadcast(packet, opts);
  }

  onMessage(msg: string | Dto, reply: any, subject: string) {
    console.log(subject);

    // TODO
    // channel = channel.toString();
    //
    // const channelMatches = channel.startsWith(this.channel);
    // if (!channelMatches) {
    //   return debug("ignore different channel");
    // }
    //
    // const room = channel.slice(this.channel.length, -1);
    // if (room !== "" && !this.rooms.has(room)) {
    //   return debug("ignore unknown room %s", room);
    // }

    const dto = typeof msg === "string" ? (JSON.parse(msg) as Dto) : msg;

    if (dto.fromUid === this.uid) {
      return debug("Ignore own message");
    }

    if (dto.packet && dto.packet.nsp === undefined) {
      dto.packet.nsp = "/";
    }

    if (!dto.packet || dto.packet.nsp !== this.nsp.name) {
      return debug("Ignore different namespace");
    }

    super.broadcast(dto.packet, dto.opts);
  }
}
