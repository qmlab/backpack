var express = require('express')
, bodyParser = require('body-parser')
, nconf = require('nconf')
, compress = require('compression')
, path = require('path')
, mailer = require('nodemailer')


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

var port = nconf.get('port')
backpack.listen(port, function () {
  console.log('Server listening at port %d', port);
})
