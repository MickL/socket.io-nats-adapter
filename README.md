# socket.io-adapter-nats

Socket.IO NATS adapter for:

- [Socket.IO](https://github.com/socketio/socket.io) 4.x, but should also work with 2.x and 3.x
- [NATS.js](https://github.com/nats-io/nats.js/) 1.4.x, not compatible to 2.x

For just emitting there is also [socket.io-nats-emitter](https://github.com/MickL/socket.io-nats-emitter)

## Status

- ✅ Emit
- ✅ Room(s)
- ✅ Namespace
- ✅ Local flag
- ❌ Get all rooms across several nodes
- ❌ Get all sockets in the same room across several nodes

If you have any issues or feature requests please create a pull request.

This project has used [socket.io-redis-adapter](https://github.com/socketio/socket.io-redis) as a reference but modernized most of the code (e.g. using async and promises and wrote test's in TypeScript, too).

## How to use

```bash
yarn add socket.io nats @mickl/socket.io-nats-adapter@^1.0.0
```

```ts
import { Server } from 'socket.io';
import { connect } from 'nats';
import { createAdapter } from '@mickl/socket.io-nats-adapter';

const io     = new Server(3000);
const client = connect('localhost');
io.adapter(createAdapter(connect));
```

## License

MIT
