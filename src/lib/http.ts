export async function json(data: any, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(data), {
    headers,
    status: init?.status || 200,
  });
}

export async function badRequest(message: string, status = 400) {
  return json({ error: message }, { status });
}
