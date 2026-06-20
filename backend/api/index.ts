import { createApp } from '../src/app';

// Vercel Serverless Functions require the Express app to be exported directly
// without calling app.listen() since Vercel handles the underlying HTTP server.

const app = createApp();

export default app;
