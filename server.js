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
  let sessionId = req.cookies['chatbot_id'];
  if(!sessionId || !sessionStorage[sessionId]){
    console.log('no session id');
    sessionStorage.waitForName = true;
    res.send([{text: `Hi, I'm Maya! Today you’re going to help me to ace my game`, type: 'bot'},
    {text: `Let's start by telling me your name`, type: 'bot'}]);
  } else {
    console.log('there is session id');
    const name = sessionStorage[sessionId].name;
    res.send([{text: `Nice to see you again ${name}. Let's pick this up from where we left off`, type: 'bot'},
    {text: `List any mathematical expression you can think of - I'll crunch it in no time`, type: 'bot'}]);
  }
});

app.get('/answer/:param', (req, res) => {
  if(sessionStorage.waitForName){
      console.log('name is provided');
      sessionStorage.waitForName = false;
      sessionId = index++;
      sessionStorage[sessionId] = { name: req.params.param };
      res.cookie('chatbot_id', sessionId, { maxAge: 900000, httpOnly: true });
      res.send([{text: `Nice to meet you ${req.params.param}!`, type: 'bot'},
      {text: `Alright, this is how it's going to work`, type: 'bot'},
      {text: `List any mathematical expression you can think of - I'll crunch it in no time`, type: 'bot'}]);
  } else {
    try {
      const num = math.eval(req.params.param);
      if(num){
        res.send([{text: num.toString(), type: 'bot'}]);
      }
    } catch(e) {
      res.send([{text: `Sorry, can't help you with that`, type: 'bot'}]);
    }
  }
});

app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
