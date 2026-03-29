import { NextRequest } from "next/server";

import { getBackendApiBaseUrl } from "@/lib/api/base-url";

export const runtime = "nodejs";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const buildUpstreamUrl = (
  pathSegments: string[],
  searchParams: URLSearchParams,
) => {
  const upstreamUrl = new URL(
    `${getBackendApiBaseUrl()}/${pathSegments.join("/")}`,
  );
  upstreamUrl.search = searchParams.toString();
  return upstreamUrl;
};

const createProxyHeaders = (request: NextRequest) => {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("x-forwarded-host", request.headers.get("host") ?? "");
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  return headers;
};

const createResponseHeaders = (upstreamResponse: Response) => {
  const headers = new Headers();

  upstreamResponse.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.append(key, value);
    }
  });

  return headers;
};

const proxyRequest = async (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) => {
  const { path } = await context.params;
  const upstreamRequestInit: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers: createProxyHeaders(request),
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : request.body,
    redirect: "manual",
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    upstreamRequestInit.duplex = "half";
  }

  const upstreamResponse = await fetch(
    buildUpstreamUrl(path, request.nextUrl.searchParams),
    upstreamRequestInit,
  );

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: createResponseHeaders(upstreamResponse),
  });
};

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
