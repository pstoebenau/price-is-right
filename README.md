# The Price Is Right

Family game night: the TV shows the board, the host runs the game from a phone, players bid on their phones.
Closest bid without going over wins the round (1 point; ties share; all over = nobody).

| Screen | URL |
|---|---|
| TV (laptop on HDMI) | `/` |
| Host phone | `/host` |
| Player phones | `/play` |

The host never sees the price before the reveal, so the host can play too (e.g. `/host` and `/play` in two tabs).

## Items

Edit `items.json` (`name`, `price` in whole dollars, optional `description` and `image`). Images can be a URL or a file
in `static/` (e.g. `static/items/mixer.jpg` → `"image": "/items/mixer.jpg"`). The file is re-read at the start of each game.
The bundled Thanksgiving set uses Amazon prices from Nov 26, 2026 (rounded to whole dollars) and links to Amazon's product images rather than copying them into this repo.

## Develop

```sh
npm install
npm run dev     # also listens on your LAN; open the TV page via http://<laptop-ip>:5173 so the join QR code works on phones
npm test
```

## Deploy on Dokploy

Create an Application → Build type **Dockerfile** → point at this repo. Set the domain's container port to **3000**.
WebSockets work through Dokploy's Traefik with no extra config.

Game state lives in memory: redeploying or restarting clears scores (players rejoin automatically).
