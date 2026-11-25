import { directProvider } from "./direct";
import { videaProvider } from "./videa";
import type { ResolvedPlayback, VideoProviderModule } from "./types";

/** Register new providers here; nothing else in the app needs to know about them. */
export const providers: Record<VideoProviderModule["id"], VideoProviderModule> = {
  VIDEA: videaProvider,
  DIRECT: directProvider,
};

export function getProvider(id: string): VideoProviderModule {
  const p = providers[id as VideoProviderModule["id"]];
  if (!p) throw new Error(`Unknown video provider: ${id}`);
  return p;
}

export function resolveSource(source: { provider: string; ref: string }): ResolvedPlayback {
  return getProvider(source.provider).resolve(source.ref);
}

export const providerList = Object.values(providers).map(({ id, name, adminHint }) => ({ id, name, adminHint }));
export type { ResolvedPlayback, VideoProviderModule };
