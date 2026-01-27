import { app } from '../server/index';

// Vercel serverless function handler for catch-all API routes
// Vercel passes the request as a Web API Request in Node.js 18+ runtime
export default async function handler(request: Request): Promise<Response> {
  try {
    // The request URL already includes the full path
    // Just pass it directly to Hono
    return await app.fetch(request);
  } catch (error: any) {
    console.error('[Vercel Handler] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
