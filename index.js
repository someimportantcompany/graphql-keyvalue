const { GraphQLScalarType } = require('graphql');
const { Kind, print } = require('graphql/language');

const { hasOwnProperty, toString } = Object.prototype;

function assert(value, err) {
  if (Boolean(value) === false) {
    throw err;
  }
}

const KeyValueScalar = new GraphQLScalarType({
  name: 'KeyValue',
  description: 'Represents a collection of key-values, supporting String/Number/Boolean/Date/Null types',
  ...(ensure => ({ serialize: ensure, parseValue: ensure }))(object => {
    assert(toString.call(object) === '[object Object]', new TypeError('Expected argument to be an object'));

    const validTypes = [
      '[object String]',
      '[object Number]',
      '[object Boolean]',
      '[object Date]',
      '[object Array]',
      '[object Object]',
      '[object Null]',
    ];

    for (const prop in object) {
      /* istanbul ignore else */
      if (hasOwnProperty.call(object, prop)) {
        const type = toString.call(object[prop]);
        assert(validTypes.includes(type), new Error(`Expected value to be a valid type, found "${type}"`), {
          prop,
          type,
          value: JSON.stringify(object[prop]),
        });
      }
    }

    return object;
  }),
  parseLiteral(ast, variables) {
    const { STRING, INT, FLOAT, BOOLEAN, NULL, VARIABLE, OBJECT } = Kind;
    assert(ast.kind === OBJECT, new TypeError(`KeyValue cannot represent non-object value: ${print(ast)}`));

    const value = Object.create(null);

    ast.fields.forEach(field => {
      switch (field.value.kind) {
        case STRING: case BOOLEAN: value[field.name.value] = field.value.value; break;
        case INT: case FLOAT: value[field.name.value] = parseFloat(field.value.value); break;
        case NULL: value[field.name.value] = null; break;
        case VARIABLE: value[field.name.value] = variables ? variables[field.value.name.value] : undefined; break;
        /* istanbul ignore next */
        default: throw new TypeError(`KeyValue cannot represent value: ${print(field.value)}`);
      }
    });

    return value;
  },
});

function flatten(input) {
  assert(toString.call(input) === '[object Object]', new TypeError('Expected argument to be an object'));

  const output = {};

  for (const key in input) {
    /* istanbul ignore else */
    if (hasOwnProperty.call(input, key)) {
      const { [key]: value } = input;
      output[key] = [ '[object Array]', '[object Object]' ].includes(toString.call(value))
        ? JSON.stringify(value)
        : value;
    }
  }

  return output;
}

function unflatten(input) {
  assert(toString.call(input) === '[object Object]', new TypeError('Expected argument to be an object'));

  const hasJsonStructure = value => typeof value === 'string' &&
    ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']')));

  const output = {};

  for (const key in input) {
    /* istanbul ignore else */
    if (hasOwnProperty.call(input, key)) {
      const { [key]: value } = input;
      output[key] = hasJsonStructure(value) ? JSON.parse(value) : value;
    }
  }

  return output;
}

module.exports = {
  KeyValueScalar,
  // eslint-disable-next-line quotes
  typeDefs: /* GraphQL */`scalar KeyValue`,
  resolvers: { KeyValue: KeyValueScalar },
  flatten,
  unflatten,
};
