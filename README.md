# graphql-keyvalue

[![NPM](https://badge.fury.io/js/graphql-keyvalue.svg)](https://npm.im/graphql-keyvalue)
[![CI](https://github.com/someimportantcompany/graphql-keyvalue/actions/workflows/ci.yml/badge.svg)](https://github.com/someimportantcompany/graphql-keyvalue/actions/workflows/ci.yml)
<!-- [![Coverage](https://coveralls.io/repos/github/someimportantcompany/graphql-keyvalue/badge.svg?branch=master)](https://coveralls.io/github/someimportantcompany/graphql-keyvalue?branch=master) -->

Standalone GraphQL Scalar type for Key-Value hashes in JavaScript.

```gql
type User {
  id: ID!
  name: String!
  email: String!
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

## API

```js
const { typeDefs: keyValueTypeDefs, resolvers: keyValueResolvers } = require('graphql-keyvalue');;
```
