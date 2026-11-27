import { createServer } from 'node:http';
import { handler } from './build/handler.js';
import { attach } from './server/game.js';

const server = createServer(handler);
attach(server);
server.on('upgrade', (req, socket) => req.url !== '/ws' && socket.destroy());
server.listen(Number(process.env.PORT) || 3000, () => console.log(`Listening on ${process.env.PORT || 3000}`));
// Node as PID 1 in Docker ignores SIGTERM by default; game state is in memory only.
process.on('SIGTERM', () => process.exit(0));
