const { Model, DataTypes } = require("sequelize");
const Sequelize = require("../database");

class RegisteredTime extends Model {}

RegisteredTime.init(
  {
    registered_time: DataTypes.STRING
  },
  { sequelize: Sequelize, modelName: "registered_time" }
);

module.exports = RegisteredTime;
