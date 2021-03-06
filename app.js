require("dotenv").config();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const favicon = require("serve-favicon");
const hbs = require("hbs");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const passport = require("./helpers/passport");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;


//acceso con google//

passport.use(new GoogleStrategy({
  clientID: process.env.CUSTOMERID,
  clientSecret: process.env.CLIENTSECRET,
  callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  User.findOne({ googleID: profile.id })
  .then(user => {
    console.log(user)
    if (err) {
      return done(err);
    }
    if (user) {
      return done(null, user);
    }

    const newUser = new User({
      googleID: profile.id
    });

    newUser.save()
    .then(user => {
      done(null, newUser);
    })
  })
  .catch(error => {
    next(error)
  })

}));

mongoose
  .connect(process.env.DB || "mongodb://localhost/scool-management", {
    useNewUrlParser: true
  })
  .then(x => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch(err => {
    console.error("Error connecting to mongo", err);
  });

const app_name = require("./package.json").name;
const debug = require("debug")(
  `${app_name}:${path.basename(__filename).split(".")[0]}`
);

const app = express();

hbs.registerPartials(__dirname + "/views/partials");

// Middleware Setup
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 },
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 24 * 60 * 60 // 1 day
    })
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Express View engine setup

app.use(
  require("node-sass-middleware")({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    sourceMap: true
  })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

// default value for title local
app.locals.title = "School Management";

const index = require("./routes/index");
const auth = require("./routes/auth");
const googleSign = require("./routes/authRoutes")
const main = require("./routes/main");
const profile = require("./routes/profile");
const manager = require("./routes/manager");
const teacher = require("./routes/teacher");
app.use("/", index);
app.use("/", auth);
app.use("/main", main);
app.use("/profile", profile);
app.use("/manager", manager);
app.use("/teacher", teacher);
app.use("/routes/authRoutes", googleSign);


module.exports = app;
