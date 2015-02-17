var express = require('express')
, bodyParser = require('body-parser')
, nconf = require('nconf')
, compress = require('compression')
, path = require('path')
, mailer = require('nodemailer')
, vhost = require('vhost')
, chatserver = require('./chatserver.js')
, i18n = require('i18next')
, fs = require('fs')
, https = require('https')


// First consider commandline arguments and environment variables, respectively.
nconf.argv().env();

nconf.file({ file: 'config.json' });

// Init compression management
if (nconf.get('server:compress')) {
  backpack.use(compress())
}

// backpack web app
var backpack = express()

// For rendering views
backpack.set('views', __dirname + '/backpack')
backpack.engine('html', require('ejs').renderFile);
backpack.set('view engine', 'ejs');

// For static html
backpack.use(express.static(path.join(__dirname, 'backpack')));

// Init body-parser
backpack.use(bodyParser.urlencoded({
  extended: true
}))
backpack.use(bodyParser.json({
}))

backpack.get('/', function(req, res) {
  res.redirect(301, '/home')
})

backpack.get('/home', function(req, res) {
  res.render('home.html')
})

backpack.get('/tutorial', function(req, res) {
  res.render('tutorial.html')
})

backpack.get('/documentation', function(req, res) {
  res.render('documentation.html')
})

backpack.get('/contact', function(req, res) {
  res.render('contact.html')
})

backpack.post('/feedback', function(req, res) {
  var username = nconf.get('gmail_user')
  var passwd = nconf.get('gmail_password')
  // Use Smtp Protocol to send Email
  var smtpTransport = mailer.createTransport({
    service: 'Gmail',
    auth: {
      user: username + '@gmail.com',
      pass: passwd
    }
  });

  var mail = {
    from: req.body.from,
    to: username + '@gmail.com',
    subject: req.body.subject,
    text: 'from: ' + req.body.from + '\r\nmessage: ' + req.body.email,
    html: ''
  }

  smtpTransport.sendMail(mail, function(error, response){
    if(error){
      res.send(error);
    }else{
      res.send('Message sent!');
    }

    smtpTransport.close();
  });
})

var app = module.exports = express()

//Register Handler
app.use(i18n.handle)

//Register AppHelper so you can use the translate function inside template
i18n.registerAppHelper(app)

//Init i18n
i18n.init(function(t) {
  // chat web app
  var chat = express()

  // For rendering views
  chat.set('views', __dirname + '/talkyet')
  chat.engine('html', require('ejs').renderFile);
  chat.set('view engine', 'ejs');

  // For static html
  chat.use(express.static(path.join(__dirname, 'talkyet')));

  // Init body-parser
  chat.use(bodyParser.urlencoded({
    extended: true
  }))
  chat.use(bodyParser.json({
  }))

  chat.get('/', function(req, res) {
    res.render('chat.ejs')
  })

  //Vhost app
  app.use(vhost('backpack.ddns.net', backpack))
  app.use(vhost('talkyet.com', chat))

  if (!module.parent) {
    var privateKey  = fs.readFileSync('certs/talkyet.key', 'utf8')
    var certificate = fs.readFileSync('certs/talkyet.cer', 'utf8')
    var credentials = {key: privateKey, cert: certificate}
    var server = https.createServer(credentials, app)
    var port = nconf.get('port')
    server.listen(port, function () {
      console.log('Server listening at port %d', port);
    })

    chatserver.start(server)
  }
})
