import { app } from '../server/index';

// Vercel serverless function handler for catch-all API routes
// Vercel passes the request as a Web API Request in Node.js 18+ runtime
export default async function handler(request: Request): Promise<Response> {
  // The request URL already includes the full path
  // Just pass it directly to Hono
  return app.fetch(request);
}
