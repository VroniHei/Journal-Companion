import { describe, it, expect } from "vitest";
import type { VoiceDraft } from "@journal/shared";
import {
  isOfferableVoiceDraft,
  isStaleVoiceDraft,
  VOICE_DRAFT_OFFER_MAX_AGE_MS,
  VOICE_DRAFT_CLEANUP_AGE_MS,
} from "./voiceDraft";

const NOW = 1_700_000_000_000;

function draft(partial: Partial<VoiceDraft> = {}): VoiceDraft {
  const at = new Date(NOW).toISOString();
  return {
    id: "v1",
    createdAt: at,
    updatedAt: at,
    transcript: "halber Satz",
    status: "aktiv",
    ...partial,
  };
}

function ago(ms: number): string {
  return new Date(NOW - ms).toISOString();
}

describe("isOfferableVoiceDraft", () => {
  it("bietet aktive, nicht-leere, frische Entwürfe an", () => {
    expect(isOfferableVoiceDraft(draft(), NOW)).toBe(true);
  });

  it("bietet verworfene Entwürfe nicht an", () => {
    expect(isOfferableVoiceDraft(draft({ status: "verworfen" }), NOW)).toBe(false);
  });

  it("bietet leere Entwürfe nicht an", () => {
    expect(isOfferableVoiceDraft(draft({ transcript: "   " }), NOW)).toBe(false);
  });

  it("bietet Entwürfe älter als 24 h nicht an", () => {
    const old = draft({ updatedAt: ago(VOICE_DRAFT_OFFER_MAX_AGE_MS + 1000) });
    expect(isOfferableVoiceDraft(old, NOW)).toBe(false);
  });
});

describe("isStaleVoiceDraft", () => {
  it("räumt verworfene Entwürfe auf", () => {
    expect(isStaleVoiceDraft(draft({ status: "verworfen" }), NOW)).toBe(true);
  });

  it("lässt frische aktive Entwürfe stehen", () => {
    expect(isStaleVoiceDraft(draft(), NOW)).toBe(false);
  });

  it("räumt aktive Entwürfe älter als die Cleanup-Grenze auf", () => {
    const old = draft({ updatedAt: ago(VOICE_DRAFT_CLEANUP_AGE_MS + 1000) });
    expect(isStaleVoiceDraft(old, NOW)).toBe(true);
  });
});
