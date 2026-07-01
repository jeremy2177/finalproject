const test = require('node:test');
const assert = require('node:assert/strict');

const { startServer } = require('../server');

test('health endpoint responds', async () => {
  const server = await startServer({ port: 0 });
  try {
    const response = await fetch(`http://127.0.0.1:${server.port}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
