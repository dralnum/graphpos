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

  type User {
    id: ID!
    name: String!
    email: String!
    password: String!
    role: RoleEnum
    RegisteredTime: [RegisteredTime]
  }
  type RegisteredTime {
    id: ID!
    user: User!
    registered_time: String!
  }
  type Query {
    allUsers: [User]
    user(id: ID!): User
    allRegisteredTime: [RegisteredTime]
  }
  type Mutation {
    createUser(data: CreateUserInput): User
    updateUser(id: ID!, data: UpdateUserInput): User
    deleteUser(id: ID!): Boolean @auth(role: ADMIN)
    createRegisteredTime(data: CreateRegisteredTimeInput): RegisteredTime
      @auth(role: USER)

    signin(email: String!, password: String!): PayloadAuth
  }

  type PayloadAuth {
    token: String!
    user: User!
  }

  type Subscription {
    onCreatedRT: RegisteredTime
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    role: RoleEnum!
  }
  input UpdateUserInput {
    name: String!
    email: String!
    password: String
    role: RoleEnum
  }
  input CreateRegisteredTimeInput {
    user: ID!
  }
`;

const resolver = {
  Query: {
    allUsers() {
      return User.findAll({ include: [RegisteredTime] });
    }
  },
  Mutation: {
    async createUser(parent, body, context, info) {
      body.data.password = await bcrypt.hash(body.data.password, 10);
      const user = await User.create(body.data);
      return user;
    },
    async updateUser(parent, body, context, info) {
      if (body.data.password) {
        body.data.password = await bcrypt.hash(body.data.password, 10);
      }
      const user = await User.findOne({
        where: { id: body.id }
      });
      if (!user) {
        throw new Error("Usuário não encontrado");
      }
      const updatedUser = await user.update(body.data);
      return updatedUser;
    },
    async deleteUser(parent, body, context, info) {
      const user = await User.findOne({
        where: { id: body.id }
      });
      await user.destroy();
      return true;
    },
    async createRegisteredTime(parent, body, context, info) {
      const user = await User.findOne({
        where: { id: body.user }
      });
      const registered_time = await RegisteredTime.create({
        registered_time: "2019-11-09 11:00:00"
      });
      await registered_time.setUser(body.user);
      const newRT = await registered_time.reload({ include: [User] });
      pubSub.publish("createdRT", {
        onCreatedRT: newRT
      });
      return newBook;
    },

    async signin(parent, body, context, info) {
      const user = await User.findOne({
        where: { email: body.email }
      });

      if (user) {
        const isCorrect = await bcrypt.compare(body.password, user.password);
        if (!isCorrect) {
          throw new Error("Senha inválida");
        }

        const token = jwt.sign({ id: user.id }, "secret");

        return {
          token,
          user
        };
      }
    }
  },
  Subscription: {
    onCreatedRT: {
      subscribe: () => pubSub.asyncIterator("createdRT")
    }
  }
};

const server = new ApolloServer({
  typeDefs: typeDefs,
  resolvers: resolver,
  schemaDirectives: {
    auth: AuthDirective
  },
  context({ req, connection }) {
    if (connection) {
      return connection.context;
    }
    // const token = req.headers.authorization;
    // console.log(token);
    // const jwtData = jwt.decode(token.replace("Bearer ", ""));

    // const { id } = jwtData;
    // return {
    //   headers: req.headers,
    //   user_id: id
    // };
  }
});

Sequelize.sync().then(() => {
  server.listen().then(() => {
    console.log("Servidor rodando");
  });
});
