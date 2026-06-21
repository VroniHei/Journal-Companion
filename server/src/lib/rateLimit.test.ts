import { describe, it, expect, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { rateLimit, __resetRateLimit } from "./rateLimit";

// Minimaler Fake für req/res, gerade genug für die Middleware.
function makeReq(ip: string): Request {
  return {
    headers: { "x-forwarded-for": ip },
    socket: { remoteAddress: ip },
  } as unknown as Request;
}

function makeRes() {
  const headers: Record<string, string> = {};
  let statusCode = 0;
  let body: unknown = null;
  const res = {
    setHeader: (k: string, v: string) => {
      headers[k] = v;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  };
  return {
    res: res as unknown as Response,
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    headers,
  };
}

describe("rateLimit", () => {
  beforeEach(() => __resetRateLimit());

  it("lässt Anfragen bis zum Limit durch", () => {
    const mw = rateLimit({ max: 3, windowMs: 60_000 });
    let passed = 0;
    for (let i = 0; i < 3; i++) {
      const { res } = makeRes();
      mw(makeReq("1.1.1.1"), res, () => passed++);
    }
    expect(passed).toBe(3);
  });

  it("blockt die (max+1)-te Anfrage mit 429 und Retry-After", () => {
    const mw = rateLimit({ max: 2, windowMs: 60_000 });
    const ip = "2.2.2.2";
    mw(makeReq(ip), makeRes().res, () => {});
    mw(makeReq(ip), makeRes().res, () => {});

    const blocked = makeRes();
    let calledNext = false;
    mw(makeReq(ip), blocked.res, () => {
      calledNext = true;
    });

    expect(calledNext).toBe(false);
    expect(blocked.statusCode).toBe(429);
    expect(blocked.headers["Retry-After"]).toBeDefined();
    expect((blocked.body as { error: string }).error).toMatch(/warten/i);
  });

  it("zählt verschiedene IPs getrennt", () => {
    const mw = rateLimit({ max: 1, windowMs: 60_000 });
    let passed = 0;
    mw(makeReq("3.3.3.3"), makeRes().res, () => passed++);
    mw(makeReq("4.4.4.4"), makeRes().res, () => passed++);
    expect(passed).toBe(2);
  });

  it("ist bei max=0 deaktiviert (lässt alles durch)", () => {
    const mw = rateLimit({ max: 0 });
    let passed = 0;
    for (let i = 0; i < 50; i++) {
      mw(makeReq("5.5.5.5"), makeRes().res, () => passed++);
    }
    expect(passed).toBe(50);
  });

  it("setzt die Zählung nach Ablauf des Fensters zurück", () => {
    const mw = rateLimit({ max: 1, windowMs: 1 });
    const ip = "6.6.6.6";
    let passed = 0;
    mw(makeReq(ip), makeRes().res, () => passed++);
    // windowMs=1 ms: ein winziger Spin, dann ist das Fenster vorbei.
    const until = Date.now() + 5;
    while (Date.now() < until) {
      /* warten, bis das 1-ms-Fenster sicher abgelaufen ist */
    }
    mw(makeReq(ip), makeRes().res, () => passed++);
    expect(passed).toBe(2);
  });
});
