# socket.io-adapter-nats

Socket.IO NATS adapter for:

- [Socket.IO](https://github.com/socketio/socket.io) 4.x, but should also work with 2.x and 3.x
- [NATS.js](https://github.com/nats-io/nats.js/) 1.4.x, not compatible to 2.x

## Status

I have used [socket.io-redis-adapter](https://github.com/socketio/socket.io-redis) as a reference but modernized most of the code (e.g. using async and promises and wrote test's in TypeScript, too).

- ✅ Emit
- ✅ Room(s)
- ✅ Namespace
- ✅ Local flag
- Get all rooms across several nodes
- Get all sockets in the same room across several nodes


If you have any issues or feature requests please create a pull request.

## How to use

```bash
yarn add socket.io nats socket.io-nats-adapter
```

```ts
import { Server } from 'socket.io';
import { connect } from 'nats';
import { createNatsAdapter } from 'socket.io-nats-adapter';

const io     = new Server(3000);
const client = await connect('localhost');
io.adapter(createNatsAdapter(connect));
```

## License

MIT
