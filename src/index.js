const { ApolloServer, gql, PubSub } = require("apollo-server");
const Sequelize = require("./database");
const User = require("./models/user");
const RegisteredTime = require("./models/registered_time");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AuthDirective = require("./directives/auth");

const pubSub = new PubSub();

const typeDefs = gql`
  enum RoleEnum {
    USER
    ADMIN
  }

  directive @auth(role: RoleEnum) on OBJECT | FIELD_DEFINITION
`;

const server = new ApolloServer({
  typeDefs: typeDefs,
  resolvers: resolver,
  schemaDirectives: {
    auth: AuthDirective
  },
  context({ req }) {
    return {
      headers: req.headers
    };
  }
});

Sequelize.sync().then(() => {
  server.listen().then(() => {
    console.log("Servidor rodando");
  });
});
