import { healthCheck } from '@/lib/postgres';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const dbHealthy = await healthCheck();
    
    return new Response(
      JSON.stringify({
        status: dbHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        service: 'Ferdii-AI-Asissten API',
        database: dbHealthy ? 'connected' : 'disconnected',
        version: '1.0.0',
      }),
      {
        status: dbHealthy ? 200 : 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'Ferdii-AI-Asissten API',
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
