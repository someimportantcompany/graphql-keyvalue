function assert(value, err) {
  if (Boolean(value) === false) {
    throw err;
  }
}

module.exports = {
  assert,
};
