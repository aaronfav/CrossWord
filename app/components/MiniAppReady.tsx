"use client";

import { useEffect, useRef } from "react";

async function detectMiniApp(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const imported = await import("@farcaster/miniapp-sdk");
    const sdk = (imported as { default?: unknown }).default ?? imported;
    if (
      typeof (sdk as { isInMiniApp?: () => Promise<boolean> })?.isInMiniApp ===
      "function"
    ) {
      return Boolean(
        await (sdk as { isInMiniApp: () => Promise<boolean> }).isInMiniApp(),
      );
    }
    if (
      typeof (sdk as { isMiniApp?: () => boolean })?.isMiniApp === "function"
    ) {
      return Boolean((sdk as { isMiniApp: () => boolean }).isMiniApp());
    }
    const contextValue = (sdk as { context?: unknown })?.context;
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
        const imported = await import("@farcaster/miniapp-sdk").catch(() => null);
        const sdk = imported
          ? ((imported as { default?: unknown }).default ?? imported)
          : null;
        if (
          typeof window !== "undefined" &&
          !(window as unknown as { ethereum?: unknown }).ethereum &&
          (sdk as { wallet?: { ethProvider?: unknown } })?.wallet?.ethProvider
        ) {
          (window as unknown as { ethereum?: unknown }).ethereum = (
            sdk as { wallet: { ethProvider: unknown } }
          ).wallet.ethProvider;
        }
        if (
          (sdk as { actions?: { ready?: () => void } })?.actions?.ready &&
          !hasCalled.current
        ) {
          hasCalled.current = true;
          (sdk as { actions: { ready: () => void } }).actions.ready();
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
