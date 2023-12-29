import express from 'express'
import morgan from 'morgan'
import { engine, create } from 'express-handlebars'
import path from 'node:path';
import cookieParser from 'cookie-parser'
import session from 'express-session'
import jwt from 'jsonwebtoken'
const app = express()
const port = 3000

import dotenv from 'dotenv';
dotenv.config({ path: "./src/.env" });
// console.log(process.env)


//connect DB
import db from './config/db/index.js'
db.connect();

let showHeaderAndFooter = false;

app.use((req, res, next) => {
  res.locals.showHeaderAndFooter = showHeaderAndFooter;
  next();
});

//connect routes
import route from './routes/index.js';

//express-session
app.use(session({
  secret: 'mk',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))

//cookie-parser
app.use(cookieParser())

// MW
app.use(express.urlencoded({
  extended: true,
}));
app.use(express.json());

// Static file
app.use(express.static('./src/public'))

//jquery
app.use('/jquery', express.static('./node_modules/jquery/dist/'));
// HTTP logger
app.use(morgan('combined'))


// Template engine
app.engine(
  'hbs',
  engine({
    extname: '.hbs',   // rút gọn tên file
    helpers: {
      sum: function (a, b) {
        return parseInt(a) + parseInt(b);
      },
      isNotNull: function (a) {
        if (a === null) {
          return false;
        }
        return true;
      },
      or: function (a, b) {
        if (a || b) return true;
        else return false;
      },
      or3: function (a, b, c) {
        return a || b || c;
      },
      eq: function (a, b) {
        return (a === b);
      },

      check: function(a) {
        return a != '';
      }

    }
  }));
app.set('view engine', 'hbs');
app.set('views', './src/resources/views');

// Routes init
route(app);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})