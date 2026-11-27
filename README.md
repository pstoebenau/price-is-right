# The Price Is Right

Family game night: the TV shows the board, the host runs the game from a phone, players bid on their phones.
Closest bid without going over wins the round (1 point; ties share; all over = nobody).

| Screen | URL |
|---|---|
| TV (laptop on HDMI) | `/` |
| Host phone | `/host` |
| Player phones | `/play` |

## Items

Edit `items.json` (`name`, `price` in whole dollars, optional `description` and `image`). Images can be a URL or a file
in `static/` (e.g. `static/items/mixer.jpg` → `"image": "/items/mixer.jpg"`). The file is re-read at the start of each game.

## Develop

```sh
npm install
npm run dev     # also listens on your LAN so phones can join via http://<laptop-ip>:5173/play
npm test
```

## Deploy on Dokploy

Create an Application → Build type **Dockerfile** → point at this repo. Set the domain's container port to **3000**.
WebSockets work through Dokploy's Traefik with no extra config.

Game state lives in memory: redeploying or restarting clears scores (players rejoin automatically).
