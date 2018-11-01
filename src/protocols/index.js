const HttpProtocol = require('./http');

const initProtocol = (protocol) => {
  if (!protocol) {
    throw Error('protocol cannot be undefined.');
  }

  // URL was passed to create an HttpProtocol instance
  if (typeof protocol === 'string') {
    return new HttpProtocol(protocol);
  }

  // Check for rawCall() in protocol object
  if (!protocol.rawCall || typeof protocol.rawCall !== 'function') {
    throw Error('protocol is not a compatible Web3 Provider.');
  }

  return protocol;
};

module.exports = { initProtocol };
