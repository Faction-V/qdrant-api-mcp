import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';

interface RecordedRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: IncomingMessage['headers'];
  body?: unknown;
  rawUrl: string;
}

interface HandlerContext {
  res: ServerResponse;
  record: RecordedRequest;
}

type RouteHandler = (ctx: HandlerContext) => void;

export class MockQdrantServer {
  private server = createServer(this.requestListener.bind(this));
  private handlers = new Map<string, RouteHandler>();
  private records: RecordedRequest[] = [];
  private baseUrl?: string;

  get url(): string {
    if (!this.baseUrl) {
      throw new Error('Mock server not started');
    }
    return this.baseUrl;
  }

  get lastRequest(): RecordedRequest | undefined {
    return this.records.at(-1);
  }

  register(method: string, path: string, handler: RouteHandler) {
    this.handlers.set(this.key(method, path), handler);
  }

  reset() {
    this.records = [];
    this.handlers.clear();
  }

  async start() {
    await new Promise<void>((resolve, reject) => {
      this.server.once('error', reject);
      this.server.listen(0, () => {
        const address = this.server.address() as AddressInfo | null;
        if (!address) {
          reject(new Error('Failed to determine mock server address'));
          return;
        }
        this.baseUrl = `http://127.0.0.1:${address.port}`;
        this.server.off('error', reject);
        resolve();
      });
    });
  }

  async stop() {
    await new Promise<void>((resolve, reject) => {
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  private key(method: string, path: string) {
    return `${method.toUpperCase()} ${path}`;
  }

  private requestListener(req: IncomingMessage, res: ServerResponse) {
    const method = (req.method ?? 'GET').toUpperCase();
    const requestUrl = new URL(req.url ?? '/', `http://localhost`);
    const key = this.key(method, requestUrl.pathname);
    const handler = this.handlers.get(key);

    if (!handler) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'not found' }));
      return;
    }

    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      let parsedBody: unknown;
      if (raw.length > 0) {
        try {
          parsedBody = JSON.parse(raw);
        } catch {
          parsedBody = raw;
        }
      }

      const record: RecordedRequest = {
        method,
        path: requestUrl.pathname,
        query: Object.fromEntries(requestUrl.searchParams.entries()),
        headers: req.headers,
        body: parsedBody,
        rawUrl: requestUrl.toString(),
      };

      this.records.push(record);
      handler({ res, record });
    });
  }
}
