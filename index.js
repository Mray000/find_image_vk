const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const _dirname = path.resolve();
const server = http.createServer(app);
const PORT = 5000;
const corsOptions = {
  origin: "http://localhost:5000",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
const rooms = {};
app.use(bodyParser.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(_dirname, "index.html"));
});

app.get("/game", (req, res) => {
  if (req.query.type == 1)
    rooms[req.ip] = { type: req.query.type, open: 0, current: -1 };
  else
    rooms[req.ip] = {
      type: req.query.type,
      players: [
        { open: 0, current: -1 },
        { open: 0, current: -1 },
      ],
      current_player: 0,
    };
  res.sendFile(path.resolve(_dirname, "game.html"));
});

app.post("/open_card", (req, res) => {
  const room = rooms[req.ip];
  if (room.type == 1) {
    if (room.current < 0) {
      room.current = req.body.id;
      res.send({ ok: 1 });
    } else {
      if (room.current == req.body.id) {
        room.open++;
        if (room.open == 8) {
          res.send({ win: 1 });
          delete room;
        } else {
          res.send({
            coincided: 1,
            card: room.current,
          });
          room.current = -1;
        }
      } else {
        res.send({ coincided: 0, card: room.current });
        room.current = -1;
      }
    }
  } else {
    let player_room = room.players[room.current_player];
    if (player_room.current < 0) {
      player_room.current = req.body.id;
      res.send({ ok: 1 });
    } else {
      if (player_room.current == req.body.id) {
        player_room.open++;
        if (room.players[0].open + room.players[1].open == 8) {
          let rez = room.players[0].open - room.players[1].open;
          res.send({ win: rez == 0 ? "draw" : rez > 0 ? "Red" : "Blue" });
          delete room;
        } else {
          res.send({
            coincided: 1,
            card: player_room.current,
            player: room.current_player,
          });
          player_room.current = -1;
          room.current_player = room.current_player == 0 ? 1 : 0;
        }
      } else {
        res.send({ coincided: 0, card: player_room.current });
        player_room.current = -1;
        room.current_player = room.current_player == 0 ? 1 : 0;
      }
    }
  }
});

app.post("/lose", (req, res) => {
  let room = rooms[req.ip];
  res.send({ scrore: room.open.length });
  delete room;
});

server.listen(PORT, () => console.log("Start..."));
