"use client";

import { useEffect, useRef } from "react";

async function detectMiniApp(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const mod = await import("@farcaster/miniapp-sdk");
    const detected = await mod.sdk?.isInMiniApp?.();
    if (typeof detected !== "undefined") {
      return Boolean(detected);
    }
    const legacyDetected = mod.sdk?.isMiniApp?.();
    if (typeof legacyDetected !== "undefined") {
      return Boolean(legacyDetected);
    }
    const contextValue = mod.sdk?.context;
    if (contextValue) {
      if (
        typeof (contextValue as Promise<unknown>).then === "function"
      ) {
        const context = await (contextValue as Promise<{ isMiniApp?: boolean }>);
        return Boolean(context?.isMiniApp);
      }
      if (typeof contextValue === "object") {
        return Boolean(
          (contextValue as { isMiniApp?: boolean }).isMiniApp,
        );
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function MiniAppReady({
  onDetected,
  onEnvironment,
}: {
  onDetected?: () => void;
  onEnvironment?: (isMiniApp: boolean) => void;
}) {
  const hasCalled = useRef(false);

  useEffect(() => {
    if (hasCalled.current) return;
    let active = true;
    detectMiniApp()
      .then(async (isMiniApp) => {
        if (!active) return;
        onEnvironment?.(isMiniApp);
        if (!isMiniApp) return;
        const mod = await import("@farcaster/miniapp-sdk").catch(() => null);
        const sdk = mod?.sdk;
        const provider =
          (await sdk?.wallet?.getEthereumProvider?.()) ??
          sdk?.wallet?.ethProvider;
        if (
          typeof window !== "undefined" &&
          !(window as unknown as { ethereum?: unknown }).ethereum &&
          provider
        ) {
          (window as unknown as { ethereum?: unknown }).ethereum = provider;
        }
        if (sdk?.actions?.ready && !hasCalled.current) {
          hasCalled.current = true;
          sdk.actions.ready();
          onDetected?.();
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [onDetected, onEnvironment]);

  return null;
}
