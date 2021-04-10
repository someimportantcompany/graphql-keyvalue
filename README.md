# graphql-keyvalue

[![NPM](https://badge.fury.io/js/graphql-keyvalue.svg)](https://npm.im/graphql-keyvalue)
[![CI](https://github.com/someimportantcompany/graphql-keyvalue/actions/workflows/ci.yml/badge.svg)](https://github.com/someimportantcompany/graphql-keyvalue/actions/workflows/ci.yml)
<!-- [![Coverage](https://coveralls.io/repos/github/someimportantcompany/graphql-keyvalue/badge.svg?branch=master)](https://coveralls.io/github/someimportantcompany/graphql-keyvalue?branch=master) -->

Standalone GraphQL Scalar type for Key-Value hashes in JavaScript.

```graphql
type User {
  id: ID!
  name: String!
  state: KeyValue!
}

extend type Query {
  user: User!
}

extend type Mutation {
  updateUserState(id: ID!, state: KeyValue!) KeyValue!
}
```

## Install

```
$ npm install --save graphql-keyvalue
```

From your codebase, you can either use predefined items (type definition & resolver) directly in your project or define the scalar yourself & include the scalar instance in your resolvers.

The following example uses [`graphql-tools`](https://npm.im/graphql-tools) & the predefined items:

```javascript
const assert = require('assert');
const { typeDefs: keyValueTypeDefs, resolvers: keyValueResolvers } = require('graphql-keyvalue');

const typeDefs = /* GraphQL */`
  type User {
    id: ID!
    name: String!
    email: String!
    state: KeyValue!
  }

  type Query {
    user(id: ID!): User!
  }

  type Mutation {
    updateUserState(id: ID!, state: KeyValue!) KeyValue!
  }
`;

const resolvers = {
  Query: {
    async user(_, { id }) {
      const user = await getUser(id);
      return user && user.id ? user : null;
    },
  },
  Mutation: {
    async updateUserState(_, { id, state }) {
      const user = await getUser(id);
      assert(user && user.id, 'User not found');

      user.state = { ...user.state, ...state };
      await setUser(id, user);
      return user.state;
    },
  },
};

const schema = makeExecutableSchema({
  typeDefs: [ typeDefs, keyValueTypeDefs ],
  resolvers: [ resolvers, keyValueResolvers ],
});
```

Whereas this example uses [`apollo-server`](https://npm.im/apollo-server) & includes the scalar instance `KeyValue` in its resolvers:

```javascript
const { ApolloServer, gql } = require('apollo-server');
const { KeyValue } = require('graphql-keyvalue');

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    state: KeyValue!
  }

  type Query {
    user(id: ID!): User!
  }

  type Mutation {
    updateUserState(id: ID!, state: KeyValue!) KeyValue!
  }

  scalar KeyValue
`;

const resolvers = {
  Query: {
    async user(_, { id }) {
      const user = await getUser(id);
      return user && user.id ? user : null;
    },
  },
  Mutation: {
    async updateUserState(_, { id, state }) {
      const user = await getUser(id);
      assert(user && user.id, 'User not found');

      user.state = { ...user.state, ...state };
      await setUser(id, user);
      return user.state;
    },
  },
  KeyValue,
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});
```

## Usage

Once the type definition & resolver is configured, you can send & receive simple key-value objects in GraphQL in both queries & mutations.

### Query

```graphql
query {
  user(id: "1") {
    id
    name
    state
  }
}
```
```json
{
  "data": {
    "user": {
      "id": "1",
      "name": "jdrydn",
      "state": {
        "signedInWith": "APPLE",
        "finishedOnboarding": true
      }
    }
  }
}
```

### Mutation

```graphql
mutation {
  updateUserState(id: "1", state: { "finishedOnboarding": true })
}
```
```json
{
  "data": {
    "updateUserState": {
      "signedInWith": "APPLE",
      "finishedOnboarding": true
    }
  }
}
```

## Notes

- The scalar will pass an object for input values & expects an object to be passed for output values.
- Trying to send/receive a JSON object/array will throw an error.
- **Why only one-level deep?** One of the benefits of GraphQL is the strictly typed schema that is produced. This isn't trying to defy the GraphQL schema, merely extend it to cover more use-cases.
- After more than one level? Check out [graphql-type-json](https://npmjs.im/graphql-type-json).
