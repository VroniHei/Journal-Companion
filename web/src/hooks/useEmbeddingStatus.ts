import { useEffect, useState } from "react";
import {
  getEmbeddingStatus,
  subscribeEmbeddingStatus,
  type EmbeddingStatus,
} from "../lib/embeddings";

/** Live-Status des semantischen Rückblicks (Modell laden / Indexieren / bereit). */
export function useEmbeddingStatus(): EmbeddingStatus {
  const [status, setStatus] = useState<EmbeddingStatus>(getEmbeddingStatus);
  useEffect(() => subscribeEmbeddingStatus(setStatus), []);
  return status;
}
