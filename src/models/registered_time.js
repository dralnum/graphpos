const { Model, DataTypes } = require("sequelize");
const Sequelize = require("../database");
const Writer = require("./writer");

class RegisteredTime extends Model {}

RegisteredTime.init(
  {
    registered_time: DataTypes.DATETIME
  },
  { sequelize: Sequelize, modelName: "registered_time" }
);

module.exports = RegisteredTime;
