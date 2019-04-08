const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const math = require("mathjs");
const cors = require("cors");
const uuidv1 = require("uuid/v1");
const content = require("./content");

const API_PORT = 3001;
const MESSAGE_TIMEOUT = 1000;

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));

const server = http.Server(app);
const io = socketIo(server);

// In-memory replacement for an actual db based session storage (like redis)
const sessionStorage = {};

/*
  Generates a unique token to identify sessions
*/
app.get("/generate-token", (req, res) => {
  const token = uuidv1();
  sessionStorage[token] = {};

  res.send({ token });
});

io.on("connection", socket => {
  socket.on("HandshakeFromUser", data => {
    if (!data.token) {
      return error(`Missing token`);
    }

    // this can only happen if the session storage is lost due to a server restart
    if (!sessionStorage[data.token]) {
      sessionStorage[data.token] = {};
    }

    const session = sessionStorage[data.token];
    if (session.userName) {
      send(socket, [
        content.repeat_greeting(session.userName),
        content.list_math_expression
      ]);
    } else {
      send(socket, [content.introduction, content.name_prompt]);
    }
  });

  socket.on("MessageFromUser", data => {
    if (!data.token) {
      return error(`Missing token`);
    }

    var session = sessionStorage[data.token];
    if (!session) {
      return error(`Session not found`);
    }

    if (session.userName) {
      try {
        const num = math.eval(data.content.toLowerCase());
        send(socket, [num.toString(), content.success_response]);
      } catch (e) {
        send(socket, [content.failure_response]);
      }
    } else {
      const firstName = data.content.split(" ")[0];
      session.userName = firstName;
      send(socket, [
        content.first_greeting(firstName),
        content.explanation_prompt,
        content.list_math_expression
      ]);
    }
  });
});

/*
  Sends a list of messages one by one, simulates typing
*/
function send(socket, messages) {
  let i = 0;
  const interval = setInterval(() => {
    if (i < messages.length) {
      socket.emit("MessageFromBot", { isTyping: true });
      setTimeout(() => {
        socket.emit("MessageFromBot", { text: messages[i] });
        i++;
      }, MESSAGE_TIMEOUT);
    } else {
      clearInterval(interval);
    }
  }, MESSAGE_TIMEOUT);
}

function error(message) {
  socket.emit("Error", { message });
}

server.listen(API_PORT, () => console.log(`Listening on port ${API_PORT}`));
