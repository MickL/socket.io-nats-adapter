# socket.io-adapter-nats

Socket.IO NATS adapter for:

- [Socket.IO](https://github.com/socketio/socket.io) 4.x, but should also work with 2.x and 3.x
- [NATS.js](https://github.com/nats-io/nats.js/) 1.4.x, not compatible to 2.x

## Status

**This is a work in progress**

- ✅ Emit
- ❌ Rooms
- ❌ Namespace
- ✅ Local flag
- ❌ .sockets() - Gets a list of sockets by sid
- ❌ .socketRooms() - Gets the list of rooms a given socket has joined.

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

## Contribution

This is a community driven project. If you have any issues or feature requests please create a pull request.

## License

MIT
