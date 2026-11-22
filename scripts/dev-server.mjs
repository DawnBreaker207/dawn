import { dev } from 'astro';

try {
  const server = await dev({
    root: '.',
    server: {
      port: 4321,
      host: true,
    },
  });
  console.log('DEV_SERVER_READY on http://localhost:4321');
} catch (err) {
  console.error('Failed to start dev server:', err);
  process.exit(1);
}
