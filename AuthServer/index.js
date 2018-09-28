  var express = require('express');
    var bodyParser = require('body-parser');
    var Pusher = require('pusher');

    var app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    var pusher = new Pusher({ // connect to pusher
      appId: PUSHER_APPID, 
      key: PUSHER_KEY, 
      secret:  PUSHER_SECRET,
      cluster: PUSHER_CLUSTER, 
    });

    app.get('/', function(req, res){ // for testing if the server is running
      res.send('all is well...');
    });

    app.post('/pusher/auth', function(req, res) {
      var socketId = req.body.socket_id;
      var channel = req.body.channel_name;
      var auth = pusher.authenticate(socketId, channel);
      res.send(auth);
    });

    var port = process.env.PORT || 5000;
    app.listen(port);