const { Model, DataTypes } = require("sequelize");
const Sequelize = require("../database");
const RegisteredTime = require("./registered_time");

class User extends Model {
  static associate() {
    User.hasMany(RegisteredTime);
    RegisteredTime.belongsTo(User);
  }
}

User.init(
  {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING
  },
  { sequelize: Sequelize, modelName: "user" }
);

RegisteredTime.associate();

module.exports = User;
