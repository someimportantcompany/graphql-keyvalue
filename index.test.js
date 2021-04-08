const assert = require('assert');

describe('graphql-keyvalue', () => {
  const graphqlKeyValue = require('./');

  describe('scalar', () => {
    const { graphql } = require('graphql');
    const { makeExecutableSchema } = require('graphql-tools');
    const { typeDefs: keyValueTypeDefs, resolvers: keyValueResolvers } = graphqlKeyValue;

    const createdAt = new Date();

    const typeDefs = /* GraphQL */`
      type Query {
        ping: String
        data(data: KeyValue): KeyValue
      }

      type Mutation {
        ping: String
        data(data: KeyValue): KeyValue
      }
    `;

    const resolvers = {
      Query: {
        ping: () => 'pong',
        data: (result, { data }) => ({
          data: JSON.stringify(data),
          quote: 'Wait a minute Doc, are you telling me you built a time machine... out of a Delorean? 🚗',
          answerToLifeUniverseEtc: 42,
          'this statement is false': true,
          createdAt,
        }),
      },
      Mutation: {
        ping: () => 'pong',
        data: (result, { data }) => ({
          data: JSON.stringify(data),
          quote: 'These are not the droids you are looking for, move along 👋',
          answerToLifeUniverseEtc: 42,
          'this statement is false': true,
          createdAt,
        }),
      },
    };

    const schema = makeExecutableSchema({
      typeDefs: [ typeDefs, keyValueTypeDefs ],
      resolvers: [ resolvers, keyValueResolvers ],
    });

    async function query({ query: source, variables: variableValues }) {
      const { data, errors } = await graphql({
        schema,
        source,
        variableValues,
      });

      if (Array.isArray(errors) && errors.length) {
        errors.forEach(err => console.error(err));
        throw new Error('GraphQL error');
      }

      return JSON.parse(JSON.stringify(data));
    }

    before(async () => {
      assert(typeof keyValueTypeDefs === 'string', 'Expected keyValueTypeDefs to be a string');

      const data1 = await query({ query: /* GraphQL */`query { ping }` });
      assert.deepStrictEqual(data1, { ping: 'pong' }, 'Failed to hit the { ping } query');

      const data2 = await query({ query: /* GraphQL */`mutation { ping }` });
      assert.deepStrictEqual(data2, { ping: 'pong' }, 'Failed to hit the { ping } mutation');
    });

    it('should hit the { data } query', async () => {
      const result = await query({
        query: /* GraphQL */`
          query {
            data(data: { hello: "world" })
          }
        `,
      });
      assert.deepStrictEqual(result, {
        data: {
          data: '{"hello":"world"}',
          quote: 'Wait a minute Doc, are you telling me you built a time machine... out of a Delorean? 🚗',
          answerToLifeUniverseEtc: 42,
          'this statement is false': true,
          createdAt: createdAt.toISOString(),
        },
      });
    });

    it('should hit the { data } mutation', async () => {
      const result = await query({
        query: /* GraphQL */`
          mutation {
            data(data: { hello: "world" })
          }
        `,
      });
      assert.deepStrictEqual(result, {
        data: {
          data: '{"hello":"world"}',
          quote: 'These are not the droids you are looking for, move along 👋',
          answerToLifeUniverseEtc: 42,
          'this statement is false': true,
          createdAt: createdAt.toISOString(),
        },
      });
    });

    it('should hit the { data } mutation with more types', async () => {
      const result = await query({
        query: /* GraphQL */`
          mutation thing($key: String!) {
            data(data: {
              somethingString: "Words win wars",
              somethingNumber: 42,
              somethingBool: false,
              somethingNull: null,
              somethingVar: $key,
            })
          }
        `,
        variables: {
          key: 'somethingValue',
        },
      });
      assert.deepStrictEqual(result, {
        data: {
          data: JSON.stringify({
            somethingString: 'Words win wars',
            somethingNumber: 42,
            somethingBool: false,
            somethingNull: null,
            somethingVar: 'somethingValue',
          }),
          quote: 'These are not the droids you are looking for, move along 👋',
          answerToLifeUniverseEtc: 42,
          'this statement is false': true,
          createdAt: createdAt.toISOString(),
        },
      });
    });

    it('should hit the { data } mutation with a variable', async () => {
      const variable = {
        quote: 'These are not the droids you are looking for, move along 👋',
        answerToLifeUniverseEtc: 42,
        'this statement is false': true,
        'something something null': null,
      };

      const result = await query({
        query: /* GraphQL */`
          mutation action($data: KeyValue!) {
            data(data: $data)
          }
        `,
        variables: {
          data: variable,
        },
      });
      assert.deepStrictEqual(result, {
        data: {
          data: JSON.stringify(variable),
          quote: 'These are not the droids you are looking for, move along 👋',
          answerToLifeUniverseEtc: 42,
          'this statement is false': true,
          createdAt: createdAt.toISOString(),
        },
      });
    });
  });

  describe('flatten/unflatten', () => {
    const { flatten, unflatten } = graphqlKeyValue;

    it('should flatten an object', () => {
      const result = flatten({
        quote: 'Wait a minute Doc, are you telling me you built a time machine... out of a Delorean? 🚗',
        answerToLifeUniverseEtc: 42,
        'this statement is false': true,
        user: { id: '1', name: 'jdrydn', url: 'https://jdrydn.com' },
        posts: [
          { id: '101', title: 'Hello, world!' },
          { id: '102', title: 'This is the way!' },
        ],
      });
      assert.deepStrictEqual(result, {
        quote: 'Wait a minute Doc, are you telling me you built a time machine... out of a Delorean? 🚗',
        answerToLifeUniverseEtc: 42,
        'this statement is false': true,
        user: '{"id":"1","name":"jdrydn","url":"https://jdrydn.com"}',
        posts: '[{"id":"101","title":"Hello, world!"},{"id":"102","title":"This is the way!"}]',
      });
    });

    it('should throw an error if a non-object is passed to flatten', () => {
      try {
        flatten('HELLO-WORLD');
        assert.fail('Should have thrown an error');
      } catch (err) {
        assert(err instanceof TypeError);
        assert.strictEqual(err.message, 'Expected argument to be an object');
      }
    });

    it('should unflatten an object', () => {
      const result = unflatten({
        quote: 'Wait a minute Doc, are you telling me you built a time machine... out of a Delorean? 🚗',
        answerToLifeUniverseEtc: 42,
        'this statement is false': true,
        user: '{"id":"1","name":"jdrydn","url":"https://jdrydn.com"}',
        posts: '[{"id":"101","title":"Hello, world!"},{"id":"102","title":"This is the way!"}]',
      });
      assert.deepStrictEqual(result, {
        quote: 'Wait a minute Doc, are you telling me you built a time machine... out of a Delorean? 🚗',
        answerToLifeUniverseEtc: 42,
        'this statement is false': true,
        user: { id: '1', name: 'jdrydn', url: 'https://jdrydn.com' },
        posts: [
          { id: '101', title: 'Hello, world!' },
          { id: '102', title: 'This is the way!' },
        ],
      });
    });

    it('should throw an error if a non-object is passed to unflatten', () => {
      try {
        unflatten('HELLO-WORLD');
        assert.fail('Should have thrown an error');
      } catch (err) {
        assert(err instanceof TypeError);
        assert.strictEqual(err.message, 'Expected argument to be an object');
      }
    });
  });

});
