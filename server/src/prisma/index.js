const { PrismaClient } = require('@prisma/client');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000; // start at 2s, doubles each retry (exponential backoff)

let prisma;

function createClient() {
  return new PrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn',  emit: 'event' },
    ],
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
  });
}

async function connectWithRetry(client, attempt = 1) {
  try {
    await client.$connect();
    if (attempt > 1) {
      console.log(`[Prisma] ✅ Reconnected to database on attempt ${attempt}`);
    } else {
      console.log('[Prisma] ✅ Connected to database');
    }
    return true;
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      console.error(`[Prisma] ❌ Failed to connect after ${MAX_RETRIES} attempts:`, err.message);
      return false;
    }
    const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // exponential backoff
    console.warn(`[Prisma] ⚠️  Attempt ${attempt} failed. Retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return connectWithRetry(client, attempt + 1);
  }
}

const isConnectionError = (err) => {
  if (!err) return false;
  const code = err.code || '';
  const msg  = (err.message || '').toLowerCase();
  return (
    code === 'P1001' ||         // Can't reach database server
    code === 'P1002' ||         // Database server timeout
    code === 'P1017' ||         // Server has closed the connection
    msg.includes("can't reach database") ||
    msg.includes('connection refused') ||
    msg.includes('connection reset') ||
    msg.includes('connection closed') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('socket hang up')
  );
};

function wrapModel(client, modelName) {
  const model = client[modelName];
  return new Proxy(model, {
    get(target, prop) {
      const original = target[prop];
      if (typeof original !== 'function') return original;

      return async function (...args) {
        try {
          return await original.apply(target, args);
        } catch (err) {
          if (isConnectionError(err)) {
            console.warn(`[Prisma] 🔄 Connection lost on ${modelName}.${String(prop)}. Reconnecting...`);
            try { await client.$disconnect(); } catch (_) { /* ignore */ }

            // Create and connect a fresh client
            const fresh = createClient();
            const connected = await connectWithRetry(fresh);
            if (!connected) throw err;

            // Swap global reference so future calls use fresh client
            prisma = buildPrismaProxy(fresh);

            // Retry the original operation on the fresh client
            return await fresh[modelName][prop](...args);
          }
          throw err;
        }
      };
    },
  });
}

function buildPrismaProxy(client) {
  return new Proxy(client, {
    get(target, prop) {
      const val = target[prop];
      // Wrap model objects (not $-prefixed methods)
      if (val && typeof val === 'object' && typeof prop === 'string' && !prop.startsWith('$')) {
        return wrapModel(target, prop);
      }
      return typeof val === 'function' ? val.bind(target) : val;
    },
  });
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
const rawClient = createClient();

rawClient.$on('error', (e) => console.error('[Prisma] Error event:', e.message));
rawClient.$on('warn',  (e) => console.warn('[Prisma] Warning:', e.message));

// Non-blocking initial connect — server starts immediately, retries in background
connectWithRetry(rawClient).catch(() => {
  console.error('[Prisma] Initial connection failed. Will retry on first request.');
});

prisma = buildPrismaProxy(rawClient);

// Live proxy so the module export always points to the current client
module.exports = new Proxy({}, {
  get(_, prop) { return prisma[prop]; },
  set(_, prop, value) { prisma[prop] = value; return true; },
});