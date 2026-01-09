import { env } from "../config/env";
import { captureError } from "../telemetry/telemetry";

export class HttpError extends Error {
  status: number;
  method: string;
  path: string;
  url: string;
  bodyText?: string;

  constructor(opts: {
    message: string;
    status: number;
    method: string;
    path: string;
    url: string;
    bodyText?: string;
  }) {
    super(opts.message);
    this.status = opts.status;
    this.method = opts.method;
    this.path = opts.path;
    this.url = opts.url;
    this.bodyText = opts.bodyText;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${env.apiUrl}${path}`;
  const method = (init?.method ?? "GET").toUpperCase();

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (e) {
    const err = new HttpError({
      message: "NETWORK_ERROR",
      status: 0,
      method,
      path,
      url,
    });
    captureError(e, { where: "http.fetch", method, path, url });
    captureError(err, { where: "http.fetch", method, path, url });
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new HttpError({
      message: `HTTP_${res.status}`,
      status: res.status,
      method,
      path,
      url,
      bodyText: text || undefined,
    });
    captureError(err, {
      where: "http.response",
      method,
      path,
      url,
      status: res.status,
    });
    throw err;
  }

  return (await res.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
