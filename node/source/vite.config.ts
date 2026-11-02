import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-client-diagnostics',
      configureServer(server) {
        server.middlewares.use('/__client-error', (request, response) => {
          let body = '';
          const readable = request as unknown as {
            on(event: 'data', handler: (chunk: Uint8Array) => void): void;
            on(event: 'end', handler: () => void): void;
          };
          readable.on('data', (chunk) => { body += new TextDecoder().decode(chunk); });
          readable.on('end', () => {
            console.error(`\n[LOCAL BROWSER ERROR]\n${body}\n`);
            response.statusCode = 204;
            response.end();
          });
        });
      },
    },
  ],
  server: { host: '127.0.0.1', port: 4173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
