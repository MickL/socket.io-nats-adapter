const http = require("http").Server;
const socketIo = require("socket.io");
const socketIoClient = require("socket.io-client");
const expect = require("expect.js");
const createNatsAdapter = require("..");
const {connect} = require("nats");

console.log(createNatsAdapter);

const natsUrl = 'localhost';

let namespace1, namespace2, namespace3;
let client1, client2, client3;
let socket1, socket2, socket3;

describe('socket.io-nats-adapter', () => {
  beforeEach(async () => {
    const connection = await connect(natsUrl);
    await init(connection);
  });
  afterEach(cleanup);

  it("broadcasts", (done) => {
    client1.on("test", () => {
      done();
    });

    socket1.emit("test");

    // client1.on("woot", (a, b, c, d) => {
    //   expect(a).to.eql([]);
    //   expect(b).to.eql({a: "b"});
    //   expect(Buffer.isBuffer(c) && c.equals(buf)).to.be(true);
    //   expect(Buffer.isBuffer(d) && d.equals(Buffer.from(array))).to.be(true); // converted to Buffer on the client-side
    //   done();
    // });
    //
    // var buf = Buffer.from("asdfasdf", "utf8");
    // var array = Uint8Array.of(1, 2, 3, 4);
    // socket2.broadcast.emit("woot", [], {a: "b"}, buf, array);
  });
});

async function create(connection, options, nsp) {
  return new Promise(resolve => {
    const httpServer = http();
    const io = socketIo(httpServer);
    io.adapter(createNatsAdapter(connection, options));

    httpServer.listen((err) => {
      if (err) {
        throw err;
      } // abort tests
      nsp = nsp || "/";
      const addr = httpServer.address();
      const url = "http://localhost:" + addr.port + nsp;

      const namespace = io.of(nsp);
      const client = socketIoClient(url, {reconnect: false});

      namespace.on("connection", (socket) => {
        resolve({namespace, client, socket});
      });
    });
  })
}

async function init(connection, options) {
  const created1 = await create();
  const created2 = await create();
  const created3 = await create();

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
