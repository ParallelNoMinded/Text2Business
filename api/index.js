let application = null;
let initialization = null;

async function loadApplication() {
  if (application) return application;

  const imported = await import('../dist/server.mjs');
  const serverModule = imported.default ?? imported;
  const app = serverModule.default ?? serverModule.app ?? serverModule;
  const ensureInitialAdmin = serverModule.ensureInitialAdmin ?? imported.ensureInitialAdmin;

  if (typeof app !== 'function' || typeof ensureInitialAdmin !== 'function') {
    throw new TypeError('Server bundle does not expose the Express app and initializer.');
  }

  application = { app, ensureInitialAdmin };
  return application;
}

export default async function handler(req, res) {
  try {
    const { app, ensureInitialAdmin } = await loadApplication();
    initialization ??= ensureInitialAdmin();
    await initialization;

    const originalPath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    if (originalPath) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(req.query)) {
        if (key === 'path') continue;
        for (const item of Array.isArray(value) ? value : [value]) {
          if (item !== undefined) query.append(key, String(item));
        }
      }
      req.url = `/api/${originalPath}${query.size ? `?${query}` : ''}`;
    }

    return app(req, res);
  } catch (error) {
    console.error('[v0] Serverless API initialization failed:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Не удалось запустить серверный API.' });
    }
  }
}
