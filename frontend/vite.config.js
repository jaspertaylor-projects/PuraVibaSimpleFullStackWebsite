// frontend/vite.config.js
// Purpose: Configure Vite dev server for React, force full browser reload when backend Python files change, and mirror server-side errors into /logs/frontend-error.log.
// Imports From: None
// Exported To: The 'pnpm run dev' command executed by the frontend container.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Globs for backend files mounted inside the frontend container at /app/backend
const BACKEND_WATCH_GLOBS = ['backend/**/*.py'];

function createErrorFileLoggerPlugin() {
  const LOG_DIR = '/logs';
  const LOG_FILE = path.join(LOG_DIR, 'frontend-error.log');

  const ensureLogDir = () => {
    try {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    } catch {
      // ignore
    }
  };

  const stamp = () => new Date().toISOString();

  const serialize = (args) => {
    return args
      .map((a) => {
        if (a instanceof Error) return `${a.name}: ${a.message}\n${a.stack || ''}`;
        try {
          return typeof a === 'string' ? a : JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(' ');
  };

  const writeLine = (prefix, args) => {
    try {
      ensureLogDir();
      fs.appendFileSync(LOG_FILE, `[${stamp()}] ${prefix} ${serialize(args)}\n`);
    } catch {
      // ignore
    }
  };

  return {
    name: 'error-file-logger',
    apply: 'serve',
    configureServer(server) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        writeLine('console.error', args);
        originalConsoleError(...args);
      };

      const originalLoggerError = server.config.logger.error.bind(server.config.logger);
      server.config.logger.error = (...args) => {
        writeLine('vite.logger.error', args);
        originalLoggerError(...args);
      };

      process.on('uncaughtException', (err) => {
        writeLine('uncaughtException', [err]);
      });
      process.on('unhandledRejection', (reason) => {
        writeLine('unhandledRejection', [reason]);
      });

      if (server.httpServer) {
        server.httpServer.on('clientError', (err) => writeLine('http.clientError', [err]));
        server.httpServer.on('error', (err) => writeLine('http.error', [err]));
      }
    },
  };
}

export default defineConfig({
  plugins: [
    createErrorFileLoggerPlugin(),
    react(),
    {
      name: 'full-reload-backend-python',
      apply: 'serve',
      configureServer(server) {
        for (const pattern of BACKEND_WATCH_GLOBS) {
          server.watcher.add(pattern);
        }

        let debounce;
        const scheduleReload = () => {
          clearTimeout(debounce);
          debounce = setTimeout(() => {
            server.ws.send({ type: 'full-reload' });
          }, 120);
        };

        const onFsEvent = (file) => {
          if (file && file.endsWith('.py')) {
            scheduleReload();
          }
        };

        server.watcher.on('add', onFsEvent);
        server.watcher.on('change', onFsEvent);
        server.watcher.on('unlink', onFsEvent);
      },
    },
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
      interval: 100,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
    },
  },
});
