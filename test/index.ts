import { Client, ClientOpts } from "nats";
import { createServer } from "http";
import { Namespace, Server } from "socket.io";
import { io } from "socket.io-client";
import { Socket } from "socket.io-client/build/socket";
import { AddressInfo } from "net";
import * as expect from "expect.js";
import { connect } from "nats";
import { createAdapter } from "../lib";

const natsUrl                    = "localhost";
const connectOptions: ClientOpts = {
    // json: true,
    // preserveBuffers: true,
};

let namespace1, namespace2, namespace3, namespace4;
let client1, client2, client3, client4;
let socket1, socket2, socket3, socket4;

describe("socket.io-nats-adapter", () => {
    beforeEach(async () => {
        const natsClient = connect(natsUrl, connectOptions);
        await init(natsClient);
    });
    afterEach(cleanup);

    it("broadcasts", done => {
        client2.on("someEvent", (a, b, c, d) => {
            expect(a).to.eql([]);
            expect(b).to.eql({a: "b"});

            // TODO: Buffer is not equal
            // expect(Buffer.isBuffer(c) && c.equals(buffer)).to.be(true);

            // TODO: Uint8Array is not equal
            // expect(Buffer.isBuffer(d) && d.equals(Buffer.from(uint8Array))).to.be(true); // converted to Buffer on the client-side

            done();
        });

        const buffer     = Buffer.from("abcd1234", "utf8");
        const uint8Array = Uint8Array.of(1, 2, 3, 4);

        namespace1.emit("someEvent", [], {a: "b"}, buffer, uint8Array);
    });

    it("broadcasts to a room", done => {
        const event = "someEvent";
        const room  = "someRoom";
        const room2 = "someOtherRoom";

        socket1.join(room);

        client1.on(event, () => {
            setTimeout(done, 100);
        });

        client2.on(event, () => {
            throw new Error(`Received event '${event}', but client is not in room '${room}'`);
        });

        client3.on(event, () => {
            throw new Error(`Received event '${event}', but client is not in room '${room}'`);
        });

        socket4.to(room).emit(event);
    });

    it("broadcasts to multiple rooms", done => {
        const event = "someEvent";
        const room1 = "someRoom";
        const room2 = "someOtherRoom";

        socket1.join(room1);
        socket2.join(room2);

        let gotEvent1: boolean;
        let gotEvent2: boolean;
        let isDone: boolean;

        client1.on(event, () => {
            gotEvent1 = true;

            setTimeout(() => {
                if (gotEvent2 && !isDone) {
                    isDone = true;
                    done();
                }
            }, 100);
        });

        client2.on(event, () => {
            gotEvent2 = true;

            setTimeout(() => {
                if (gotEvent1 && !isDone) {
                    isDone = true;
                    done();
                }
            }, 100);
        });

        client3.on(event, () => {
            throw new Error(`Received event '${event}', but client is not in room '${room1}' or '${room2}'`);
        });

        socket4.to(room1).to(room2).emit(event);
    })

    it("uses a namespace to broadcast to rooms", done => {
        socket1.join("woot");
        client2.emit("do broadcast");
        socket2.on("do broadcast", () => {
            namespace2.to("woot").emit("broadcast");
        });

        client1.on("broadcast", () => {
            setTimeout(done, 100);
        });

        client2.on("broadcast", () => {
            throw new Error("Not in room");
        });

        client3.on("broadcast", () => {
            throw new Error("Not in room");
        });
    });

    it("doesn't broadcast when using the local flag", done => {
        socket1.join("woot");
        socket2.join("woot");
        client2.emit("do broadcast");

        socket2.on("do broadcast", () => {
            namespace2.local.to("woot").emit("local broadcast");
        });

        client1.on("local broadcast", () => {
            throw new Error("Not in local server");
        });

        client2.on("local broadcast", () => {
            setTimeout(done, 100);
        });

        client3.on("local broadcast", () => {
            throw new Error("Not in local server");
        });
    });

    it("doesn't broadcast to left rooms", done => {
        socket1.join("woot");
        socket1.leave("woot");

        socket2.on("do broadcast", () => {
            socket2.broadcast.to("woot").emit("broadcast");

            setTimeout(done, 100);
        });

        client2.emit("do broadcast");

        client1.on("broadcast", () => {
            throw new Error("Not in room");
        });
    });
});

async function create(
    natsClient: Client,
    options?: ClientOpts,
    nsp = "/"
): Promise<{ namespace: Namespace; client: Socket; socket: any }> {
    return new Promise((resolve) => {
        const httpServer = createServer();
        const ioServer   = new Server(httpServer);

        // @ts-ignore
        ioServer.adapter(createAdapter(natsClient, options));

        httpServer.listen((a) => {
            const port = (<AddressInfo>httpServer.address()).port;
            const url  = "http://localhost:" + port;

            const namespace = ioServer.of(nsp);
            const client    = io(url, {reconnection: false});

            namespace.on("connection", (socket) => {
                resolve({namespace, client, socket});
            });
        });
    });
}

async function init(natsClient: Client, options?: ClientOpts) {
    const created1 = await create(natsClient, options);
    const created2 = await create(natsClient, options);
    const created3 = await create(natsClient, options);
    const created4 = await create(natsClient, options);

    namespace1 = created1.namespace;
    namespace2 = created2.namespace;
    namespace3 = created3.namespace;
    namespace4 = created4.namespace;

    client1 = created1.client;
    client2 = created2.client;
    client3 = created3.client;
    client4 = created4.client;

    socket1 = created1.socket;
    socket2 = created2.socket;
    socket3 = created3.socket;
    socket4 = created4.socket;
}

function noop() {
}

async function cleanup() {
    namespace1.server.close();
    namespace2.server.close();
    namespace3.server.close();
    // handle 'Connection is closed' errors
    namespace1.adapter.on("error", noop);
    namespace2.adapter.on("error", noop);
    namespace3.adapter.on("error", noop);
    // TODO: Need this for Nats?
    // namespace1.adapter.subClient.quit();
    // namespace2.adapter.subClient.quit();
    // namespace3.adapter.subClient.quit();
}
