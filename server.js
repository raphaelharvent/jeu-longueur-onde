import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;  // Render fournit PORT automatiquement
const wss = new WebSocketServer({ port: PORT });

const rooms = {};
const genCode = () => Math.random().toString(36).substring(2, 7).toUpperCase();

wss.on("connection", ws => {
  let room, pseudo;

  ws.on("message", msg => {
    const data = JSON.parse(msg);

    if (data.type === "createRoom") {
      room = genCode();
      pseudo = data.pseudo;
      rooms[room] = { players: [], target: 0, master: 0, themes: data.themes || [] };
      rooms[room].players.push({ ws, pseudo, score: 0 });
      ws.send(JSON.stringify({ type: "joined", room }));
    }

    if (data.type === "joinRoom") {
      room = data.room;
      pseudo = data.pseudo;
      rooms[room].players.push({ ws, pseudo, score: 0 });
      ws.send(JSON.stringify({ type: "joined", room }));
    }

    if (data.type === "newRound") {
      const r = rooms[room];
      r.target = Math.floor(Math.random() * 101);
      r.master = (r.master + 1) % r.players.length;

      r.players.forEach((p, i) => {
        p.ws.send(JSON.stringify({
          type: "role",
          role: i === r.master ? "Maître" : "Joueur"
        }));
      });

      const angle = r.target * 1.8 - 90;
      r.players.forEach(p => p.ws.send(JSON.stringify({ type: "round", angle })));
    }

    if (data.type === "guess") {
      const r = rooms[room];
      const player = r.players.find(p => p.ws === ws);
      const diff = Math.abs(data.value - r.target);

      let points = 0;
      if (diff <= 5) points = 3;
      else if (diff <= 15) points = 2;
      else if (diff <= 30) points = 1;

      player.score += points;

      r.players.forEach(p =>
        p.ws.send(JSON.stringify({
          type: "scores",
          scores: r.players.map(x => ({ pseudo: x.pseudo, score: x.score }))
        }))
      );

      r.players.forEach(p =>
        p.ws.send(JSON.stringify({
          type: "history",
          text: `${player.pseudo} a marqué ${points} point(s) (écart: ${diff})`
        }))
      );
    }
  });
});

console.log("WebSocket server lancé sur le port", PORT);
