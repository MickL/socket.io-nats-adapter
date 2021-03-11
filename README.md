# socket.io-adapter-nats

**-- This is a work in progress --**

Socket.IO NATS adapter for [Socket.IO](https://github.com/socketio/socket.io) 2.x and 3.x and [NATS.js](https://github.com/nats-io/nats.js/) 2.x

## How to use

```bash
yarn add socket.io nats@rc socket.io-nats-adapter
```

```ts
import { Server } from 'socket.io';
import { connect } from 'nats';
import { createNatsAdapter } from 'socket.io-nats-adapter';

const io         = new Server(3000);
const connection = await connect('localhost');
io.adapter(createNatsAdapter(connect));
```

## Contribution
If you have any issues or feature requests please create a pull request. I will not have time to maintain this project.

## License

MIT
