const sql = require("../db.config");

const tableName = "users";

const User = function(user) {
  this.name = user.name;
  this.email = user.email;
  this.image = user.image;
  this.token = user.token;
};

// Register a new user
User.register = (newUser, result) => {
  sql.query(
      `SELECT * FROM ${tableName} WHERE email = ?`,
      newUser.email,
      (err, res1) => {
        if (err) {
          console.log("error: ", err);
          result(err, null);
          return;
        } else {
          if (res1.length > 0) {
            result({kind: "email_exists"}, null);
            return;
          }

          sql.query(`INSERT INTO ${tableName} SET ?`, newUser, (err, res) => {
            if (err) {
              console.log("error: ", err);
              result(err, null);
              return;
            }

            console.log("user registered: ", {id: res.insertId, ...newUser});
            result(null, {id: res.insertId, ...newUser});
          });
        }
      },
  );
};

// Check if user exists
User.checkIfEmailExists = (email, result) => {
  sql.query(`SELECT * FROM ${tableName} WHERE email = ?`, email, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    result(null, res[0]);
  });
};

// Get all users
User.getAll = (result) => {
  sql.query(`SELECT * FROM ${tableName}`, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    result(null, res);
  });
};

module.exports = User;
