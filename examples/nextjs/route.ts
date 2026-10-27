import { createIntelligenceHandler } from '@krishiai/weather-intelligence/api';

const handle = createIntelligenceHandler({ cacheTtlSeconds: 600 });

export async function POST(request: Request) {
  const response = await handle({ method: 'POST', body: await request.json() });
  return Response.json(response.body, { status: response.status, headers: response.headers });
}
