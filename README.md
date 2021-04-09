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

From your codebase, you can either use predefined type definitions & resolvers directly in your project, for example using [`makeExecutableSchema`](https://npm.im/graphql-tools):

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

Or define the `scalar` yourself & include this resolver in your big list of resolvers, for example using `apollo-server`:

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

Once the type definition & resolver is configured, you can send & receive simple key-value objects in GraphQL.

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

## FAQs

### Why only one-level deep?

One of the benefits of GraphQL is the strictly typed schema that is produced. This isn't trying to defy the GraphQL schema, merely extend it to cover more use-cases. For example: API credentials - which can vary in fields greatly. This scalar would allow you to expose these credentials without actually requiring you to define each field of the credentials object.

### Common Errors

- Trying to send/receive a JSON object/array will throw an error.

Alternatives:

- [graphql-type-json](https://npmjs.im/graphql-type-json)
