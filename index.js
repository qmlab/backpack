var express = require('express')
, bodyParser = require('body-parser')
, nconf = require('nconf')
, compress = require('compression')
, path = require('path')

var app = express()

// For rendering views
app.set('views', __dirname + '/public')
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

// For static html
app.use(express.static(path.join(__dirname, 'public')));

// First consider commandline arguments and environment variables, respectively.
nconf.argv().env();

nconf.file({ file: 'config.json' });

// Init body-parser
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json({
}))

// Init compression management
if (nconf.get('server:compress')) {
  app.use(compress())
}


app.get('/', function(req, res) {
  res.redirect(301, '/home')
})

app.get('/home', function(req, res) {
  res.render('home.html')
})

app.get('/tutorial', function(req, res) {
  res.render('tutorial.html')
})

app.get('/documentation', function(req, res) {
  res.render('documentation.html')
})

app.get('/contact', function(req, res) {
  res.render('contact.html')
})

app.listen(nconf.get('port'))
