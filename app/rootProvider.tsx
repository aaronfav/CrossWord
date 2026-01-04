"use client";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { base } from "wagmi/chains";
import { WagmiProvider, createConfig, createStorage, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { sdk } from "@farcaster/miniapp-sdk";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";
import { safeLocalStorage } from "./lib/safeStorage";

export function RootProvider({ children }: { children: ReactNode }) {
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const hasStorage =
        typeof window !== "undefined" &&
        !!window.localStorage &&
        typeof window.localStorage.getItem === "function";
      console.log(`[crossword] localStorage available: ${hasStorage}`);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const detectMiniApp = async () => {
      try {
        const detected = await sdk?.isInMiniApp?.();
        if (active && typeof detected !== "undefined") {
          setIsMiniApp(Boolean(detected));
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[crossword] miniapp detection failed", err);
        }
      }
    };

    detectMiniApp();
    return () => {
      active = false;
    };
  }, []);

  const wagmiConfig = useMemo(
    () =>
      createConfig({
        chains: [base],
        transports: { [base.id]: http() },
        connectors: [isMiniApp ? farcasterMiniApp() : injected()],
        storage: createStorage({
          storage: {
            getItem: (key) => safeLocalStorage.getItem(key),
            setItem: (key, value) => safeLocalStorage.setItem(key, value),
            removeItem: (key) => safeLocalStorage.removeItem(key),
          },
        }),
      }),
    [isMiniApp],
  );

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        chain={base}
        config={{
          appearance: {
            mode: "auto",
          },
          wallet: {
            display: "modal",
            preference: "all",
          },
        }}
      >
        {children}
      </OnchainKitProvider>
    </WagmiProvider>
  );
}
