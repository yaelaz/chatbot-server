const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const math = require('mathjs');
const cors = require('cors');
const uuidv1 = require('uuid/v1');
const content = require('./content');

const API_PORT = 3001;
const MESSAGE_TIMEOUT = 1000;

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }))

const server = http.Server(app);
const io = socketIo(server);

// In-memory replacement for an actual db based session storage (like redis)
const sessionStorage = {};

app.get('/generate-token', (req, res) => {
  const token = uuidv1();
  sessionStorage[token] = {};

  res.send({ token });
});


io.on('connection', socket => {
  socket.on('HandshakeFromUser', data => {
    if (!data.token) {
      // todo: return error - client tried to send a request without a token!
    }

    // this can only happen if the session storage is lost due to a server restart
    if (!sessionStorage[data.token]) {
      sessionStorage[data.token] = {};
    }

    const session = sessionStorage[data.token];
    if (session.userName) {
      send(socket, [
        content.nice_to_see_you_again(session.userName),
        content.list_math_expression
      ]);
    } else {
      send(socket, [content.hi_im_maya, content.tell_me_your_name]);
    }
  });

  socket.on('MessageFromUser', data => {
    if (!data.token) {
      // return error - client tried to send a request without a token!
      return;
    }

    var session = sessionStorage[data.token];
    if (!session) {
      //return error - client tried to open socket, but can't find their session!
      return;
    }

    if (session.userName) {
      try {
        const num = math.eval(data.content.toLowerCase());
        send(socket, [num.toString(), content.that_was_easy]);
      } catch(e) {
        send(socket, [content.sorry]);
      }
    } else {
      const firstName = data.content.split(' ')[0];
      session.userName = firstName;
      send(socket, [
        content.nice_to_meet_you(firstName),
        content.this_is_how,
        content.list_math_expression
      ]);
    }
  });
});

function send(socket, messages) {
  let i = 0;
  const interval = setInterval(() => {
    if (i < messages.length) {
      socket.emit('MessageFromBot', { typing: true });
      setTimeout(() => {
        socket.emit('MessageFromBot', { text: messages[i] });
        i++;
      }, MESSAGE_TIMEOUT);
    } else {
      clearInterval(interval);
    }
  }, MESSAGE_TIMEOUT);
}

server.listen(API_PORT, () => console.log(`Listening on port ${API_PORT}`));
