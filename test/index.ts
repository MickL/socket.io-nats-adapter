import { Client, ClientOpts } from 'nats';
import { createServer } from 'http';
import { Namespace, Server } from 'socket.io';
import { io } from "socket.io-client";
import { Socket } from 'socket.io-client/build/socket';
import { AddressInfo } from 'net';

const expect            = require("expect.js");
const createNatsAdapter = require("..");
const {connect}         = require("nats");

const natsUrl                    = "localhost";
const connectOptions: ClientOpts = {
    // json: true,
    // preserveBuffers: true,
};

let namespace1, namespace2, namespace3;
let client1, client2, client3;
let socket1, socket2, socket3;

describe("socket.io-nats-adapter", () => {
    beforeEach(async () => {
        const natsClient = connect(natsUrl, connectOptions);
        await init(natsClient);
    });
    afterEach(cleanup);

    it("broadcasts", (done) => {
        client2.on("hello", (a, b, c, d) => {
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

        namespace1.emit("hello", [], {a: "b"}, buffer, uint8Array);
    });

    it("doesn't broadcast when using the local flag", (done) => {
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
});

async function create(natsClient: Client, options?: ClientOpts, nsp = '/'): Promise<{ namespace: Namespace, client: Socket, socket: any}> {
    return new Promise((resolve) => {
        const httpServer = createServer();
        const ioServer   = new Server(httpServer);

        ioServer.adapter(createNatsAdapter(natsClient, options));

        httpServer.listen(a => {
            const port = (<AddressInfo>httpServer.address()).port;
            const url = "http://localhost:" + port;

            const namespace = ioServer.of(nsp);
            const client    = io(url, {reconnection: false});

            namespace.on("connection", socket => {
                resolve({namespace, client, socket});
            });
        });
    });
}

async function init(natsClient: Client, options?: ClientOpts) {
    const created1 = await create(natsClient, options);
    const created2 = await create(natsClient, options);
    const created3 = await create(natsClient, options);

    namespace1 = created1.namespace;
    namespace2 = created2.namespace;
    namespace3 = created3.namespace;

    client1 = created1.client;
    client2 = created2.client;
    client3 = created3.client;

    socket1 = created1.socket;
    socket2 = created2.socket;
    socket3 = created3.socket;
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