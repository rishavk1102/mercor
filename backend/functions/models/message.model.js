const sql = require("../db.config");

const tableName = "message";

const Message = function(message) {
  this.to_user = message.to;
  this.from_user = message.from;
  this.body = message.body;
};

// Store new message
Message.new = (newMessage, result) => {
  sql.query(`INSERT INTO ${tableName} SET ?`, newMessage, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    result(null, {id: res.insertId, ...newMessage});
  });
};

// Get all message between 2 users
Message.getChat = (email1, email2, result) => {
  sql.query(
      `SELECT * FROM ${tableName} WHERE to_user = ?`,
      email1,
      (err, res) => {
        if (err) {
          console.log("error: ", err);
          result(err, null);
          return;
        }

        sql.query(
            `SELECT * FROM ${tableName} WHERE to_user = ?`,
            email2,
            (err, res1) => {
              if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
              }

              console.log(res);
              console.log(res1);

              const d = res;
              res1.forEach((x) => {
                d.push(x);
              });
              result(null, d);
            },
        );
      },
  );
};

module.exports = Message;
