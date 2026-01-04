"use client";

import { useEffect, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

async function detectMiniApp(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const detected = await sdk?.isInMiniApp?.();
    if (typeof detected !== "undefined") {
      return Boolean(detected);
    }
    const contextValue = sdk?.context;
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
