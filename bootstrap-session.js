// Bootstraps a Chrome session inside selenium/standalone-chrome so that
// Chrome actually launches and CDP becomes available.
//
// It keeps the session alive by periodically sending a WebDriver command.

const SELENIUM_BASE = process.env.SELENIUM_BASE || 'http://chrome:4444';
const KEEPALIVE_INTERVAL_MS = Number(process.env.KEEPALIVE_INTERVAL_MS || 60_000);

const caps = {
  capabilities: {
    firstMatch: [
      {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: ['--user-data-dir=/tmp/chrome-profile-bootstrap', '--disable-dev-shm-usage', '--no-sandbox'],
        },
      },
    ],
  },
};

async function wdRequest(method, path, body) {
  const res = await fetch(`${SELENIUM_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, text, json };
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForSeleniumReady() {
  for (;;) {
    try {
      const res = await wdRequest('GET', '/status');
      if (res.status === 200) return;
    } catch {
      // ignore
    }
    await sleep(1000);
  }
}

async function createSession() {
  const res = await wdRequest('POST', '/session', caps);
  if (res.status !== 200 || !res.json?.value?.sessionId) {
    throw new Error(`Failed to create session: HTTP ${res.status} ${res.text.slice(0, 500)}`);
  }
  const sessionId = res.json.value.sessionId;
  console.log('Bootstrapped WebDriver sessionId:', sessionId);
  return sessionId;
}

async function keepAlive(sessionId) {
  // A simple, cheap WebDriver command that still counts as activity.
  const res = await wdRequest('GET', `/session/${sessionId}/title`);
  if (res.status !== 200) {
    throw new Error(`Keepalive failed: HTTP ${res.status} ${res.text.slice(0, 200)}`);
  }
}

(async () => {
  await waitForSeleniumReady();

  let sessionId;
  for (;;) {
    try {
      if (!sessionId) {
        sessionId = await createSession();
      }
      await keepAlive(sessionId);
      await sleep(KEEPALIVE_INTERVAL_MS);
    } catch (err) {
      console.error(String(err));
      sessionId = undefined;
      await sleep(2000);
    }
  }
})();
