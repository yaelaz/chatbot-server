const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const math = require('mathjs');

const API_PORT = 3001;
const app = express();
const sessionStorage = {waitForName: false, ids: {}};
let index = 0;

app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('PORT 3001');
});

app.get('/welcome', (req, res) => {
  const sessionId = req.cookies['chatbot_id'];
  if(!sessionId || !sessionStorage[sessionId]){
    sessionStorage.waitForName = true;
    send(res, [{text: `Hi, I'm Maya! Today you’re going to help me to ace my game`},
    {text: `Let's start by telling me your name`}]);
  } else {
    const name = sessionStorage[sessionId].name;
    send(res, [{text: `Nice to see you again ${name}. Let's pick this up from where we left off`},
    {text: `List any mathematical expression you can think of - I'll crunch it in no time`}]);
  }
});

app.get('/answer/:param', (req, res) => {
  let param = req.params.param;
  if(sessionStorage.waitForName){
      sessionStorage.waitForName = false;
      const sessionId = index++;
      param = param.split(' ')[0];
      sessionStorage[sessionId] = { name: param };
      res.cookie('chatbot_id', sessionId);
      send(res, [{text: `Nice to meet you ${param}!`},
      {text: `Alright, this is how it's going to work`},
      {text: `List any mathematical expression you can think of - I'll crunch it in no time`}]);
  } else {
    try {
      const num = math.eval(param.toLowerCase());
      send(res, [{text: num.toString()}, {text: 'This was easy, give me something harder 🤓'}]);
    } catch(e) {
      send(res, [{text: `Sorry, can't help you with that 🤷`}]);
    }
  }
});

function send(res, data) {
  setTimeout(() => {
    res.send(data);
  }, 1000);
}

app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
