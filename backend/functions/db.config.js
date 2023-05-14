const mysql = require("mysql");

const credential = require("./credentials.json");

const config = {
  host: credential.SQL_HOST,
  user: credential.SQL_USER,
  password: credential.SQL_PASSWORD,
  database: credential.SQL_DATABASE,
  port: 3306,
};

if (
  credential.INSTANCE_CONNECTION_NAME &&
  credential.NODE_ENV === "production"
) {
  config.socketPath = `/cloudsql/${credential.INSTANCE_CONNECTION_NAME}`;
}

const connection = mysql.createConnection(config);

connection.connect((err) => {
  if (err) {
    console.error("Error connecting: " + err.stack);
    return;
  }
  console.log("Connected as thread id: " + connection.threadId);
});

module.exports = connection;
