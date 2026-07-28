const discoveryLinks = [
  '</llms.txt>; rel="describedby"; type="text/markdown"',
  '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
  '</feed.xml>; rel="alternate"; type="application/rss+xml"',
].join(', ');

const contentSignal = 'ai-train=yes, search=yes, ai-input=yes';

const unsupportedDiscoveryPaths = new Set([
  '/.well-known/api-catalog',
  '/.well-known/http-message-signatures-directory',
  '/.well-known/openid-configuration',
  '/.well-known/oauth-authorization-server',
  '/.well-known/oauth-protected-resource',
  '/.well-known/ucp',
  '/.well-known/acp.json',
  '/api',
  '/api/v1',
  '/auth.md',
  '/openapi.json',
]);

const appendVary = (headers, value) => {
  const current = headers.get('vary');
  const values = new Set((current ? current.split(',') : []).map((item) => item.trim()).filter(Boolean));
  values.add(value);
  headers.set('vary', [...values].join(', '));
};

const isPagePath = (pathname) => pathname === '/'
  || pathname.endsWith('/')
  || !pathname.split('/').at(-1).includes('.');

const markdownSourcePath = (pathname) => {
  const normalized = pathname === '/' ? '' : `/${pathname.replace(/^\/+|\/+$/g, '')}`;
  return `/.well-known/markdown${normalized}/index.md`;
};

export default async (request, context) => {
  if (request.headers.get('x-agent-markdown-source') === '1') return context.next();

  const url = new URL(request.url);
  const discoveryPath = url.pathname.endsWith('.html') ? url.pathname.slice(0, -5) : url.pathname;

  if (unsupportedDiscoveryPaths.has(discoveryPath) || discoveryPath.startsWith('/.well-known/mcp')) {
    return new Response(request.method === 'HEAD' ? null : 'Not Found\n', {
      status: 404,
      headers: {
        'cache-control': 'public, max-age=300',
        'content-type': 'text/plain; charset=utf-8',
      },
    });
  }

  const acceptsMarkdown = request.headers.get('accept')?.split(',')
    .some((type) => type.trim().split(';')[0] === 'text/markdown');

  if ((request.method === 'GET' || request.method === 'HEAD') && acceptsMarkdown && isPagePath(url.pathname)) {
    const sourceUrl = new URL(markdownSourcePath(url.pathname), url.origin);
    const sourceResponse = await fetch(sourceUrl, {
      headers: {
        accept: 'text/plain',
        'x-agent-markdown-source': '1',
      },
    });

    if (sourceResponse.ok) {
      const markdown = request.method === 'HEAD' ? '' : await sourceResponse.text();
      const headers = new Headers(sourceResponse.headers);
      headers.set('content-type', 'text/markdown; charset=utf-8');
      headers.set('content-signal', contentSignal);
      headers.set('link', discoveryLinks);
      headers.set('x-markdown-tokens', String(Math.ceil(markdown.length / 4)));
      headers.delete('content-length');
      appendVary(headers, 'Accept');
      return new Response(request.method === 'HEAD' ? null : markdown, { status: 200, headers });
    }
  }

  const response = await context.next();
  const headers = new Headers(response.headers);

  if (headers.get('content-type')?.includes('text/html')) {
    headers.set('content-signal', contentSignal);
    headers.set('link', discoveryLinks);
    appendVary(headers, 'Accept');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export const config = {
  path: '/*',
  onError: 'bypass',
};
