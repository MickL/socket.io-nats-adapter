import * as uid2 from "uid2";
import {
  Adapter,
  BroadcastFlags,
  BroadcastOptions,
  Room,
  SocketId,
} from "socket.io-adapter";
import { Client } from "nats";
import * as _debug from "debug";
import { Namespace } from "socket.io";

const debug = _debug("socket.io-nats-adapter");

export const SUBJECT_KEY = "socketIO";

export interface NatsAdapterOptions {
  subjectKey?: string;
  requestsTimeout?: number;
}

export interface NatsAdapterDto {
  fromUid: string;
  packet: any;
  opts: {
    rooms: Room[];
    except?: SocketId[];
    flags?: BroadcastFlags;
  };
}

/**
 * Returns a NATS Adapter function
 *
 * TODO: Add return type https://github.com/socketio/socket.io/issues/3796
 */
export const createAdapter = (client: Client, opts?: NatsAdapterOptions) => {
  return function (nsp: any) {
    return new NatsAdapter(nsp, client, opts);
  };
};

export class NatsAdapter extends Adapter {
  private uid = uid2(6);
  private requestsTimeout: number;
  private subject: string;
  // private readonly requestChannel: string;
  // private readonly responseChannel: string;
  // private requests: Map<string, Request> = new Map();

  /**
   * Adapter constructor
   */
  constructor(
    public readonly nsp: Namespace,
    private client: Client,
    private opts: Partial<NatsAdapterOptions> = {}
  ) {
    super(nsp);

    this.requestsTimeout = opts.requestsTimeout || 5000;

    const prefix = opts.subjectKey || SUBJECT_KEY;

    this.subject = prefix + "." + nsp.name;

    const onError = (err) => {
      if (err) {
        this.emit("error", err);
      }
    };

    this.client.subscribe(this.subject, this.onMessage.bind(this));
  }

  broadcast(packet: any, opts: BroadcastOptions): void {
    packet.nsp = this.nsp.name;

    const onlyLocal = opts && opts.flags && opts.flags.local;

    if (!onlyLocal) {
      const dto: NatsAdapterDto = {
        fromUid: this.uid,
        packet,
        opts: {
          rooms: Array.from(opts.rooms),
          except: Array.from(opts.except),
          flags: opts.flags,
        },
      };

      const msg = JSON.stringify(dto);

      debug("Publishing message to subject '%s'", this.subject);
      this.client.publish(this.subject, msg);
    }

    super.broadcast(packet, opts);
  }

  onMessage(msg: string | NatsAdapterDto, reply: any, subject: string) {
    debug("onMessage for subject '%s'", subject);

    const dto =
      typeof msg === "string" ? (JSON.parse(msg) as NatsAdapterDto) : msg;

    if (dto.fromUid === this.uid) {
      return debug("Ignore own message");
    }

    if (dto.packet && dto.packet.nsp === undefined) {
      dto.packet.nsp = "/";
    }

    if (!dto.packet || dto.packet.nsp !== this.nsp.name) {
      return debug("Ignore different namespace");
    }

    const opts: BroadcastOptions = {
      rooms: new Set(dto.opts.rooms),
      except: new Set(dto.opts.except),
      flags: dto.opts.flags,
    };

    super.broadcast(dto.packet, opts);
  }
}
