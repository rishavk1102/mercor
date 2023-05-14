const {spawn} = require("child_process");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

const serviceAccount = require("./perm.json");
const credential = require("./credentials.json");

const User = require("./models/user.model");
const Message = require("./models/message.model");

const app = express();
app.use(cors({origin: true}));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const messaging = admin.messaging();

/**
 *Starting proxy
 */
function startProxy() {
  const proxy = spawn("./functions/cloud_sql_proxy", [
    `-instances=${credential.INSTANCE_CONNECTION_NAME}=tcp:3306`,
    `-credential_file=./perm.json`,
    `-dir=/cloudsql`,
  ]);

  proxy.on("error", (err) => {
    console.error(err);
  });

  proxy.stderr.on("data", (data) => {
    console.error(`Cloud SQL proxy stderr: ${data}`);
  });

  proxy.stdout.on("data", (data) => {
    console.log(`Cloud SQL proxy stdout: ${data}`);
  });
}

startProxy();

// Boilerplate
app.get("/hello-world", (req, res) => {
  return res.status(200).send("Hello World");
});

// Register new user
app.post("/user/new", (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    image: req.body.image,
    token: req.body.token,
  });

  User.register(user, (err, data) => {
    if (err) {
      if (err.kind === "email_exists") {
        res.status(200).send({
          message: "Email already in use",
        });
      } else {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the User.",
        });
      }
      return;
    }

    res.status(200).send(data);
  });
});

// Get all users
app.get("/user/all", (req, res) => {
  User.getAll((err, data) => {
    if (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      });
      return;
    }

    res.status(200).send(data);
  });
});

// Send message
app.post("/message/send", (req, res) => {
  const message = new Message({
    to: req.body.to,
    from: req.body.from,
    body: req.body.message,
  });

  Message.new(message, (err, data) => {
    if (err) {
      res.status(500).send({
        message: err.message || "Some error occurred",
      });
      return;
    }

    // Getting user details
    User.checkIfEmailExists(req.body.to, (err, data1) => {
      if (err) {
        res.status(500).send({
          message: err.message || "Some error occurred",
        });
        return;
      }

      const message = {
        data: {
          title: req.body.from.toString(),
          message: req.body.message.toString(),
        },
        token: data1["token"],
      };

      messaging.send(message).then((response) => {
        res.status(200).send({"message": "Success!"});
      }).catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred",
        });
      });
    });
  });
});

// get a chat
app.get("/chat/get", (req, res) => {
  Message.getChat(req.query.from, req.query.to, (err, data) => {
    if (err) {
      res.status(500).send({
        message: err.message || "Some error occurred",
      });
      return;
    }

    res.status(200).send(data);
  });
});

exports.app = functions.https.onRequest(app);
