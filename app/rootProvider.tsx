"use client";
import { ReactNode, useEffect, useMemo } from "react";
import { base } from "wagmi/chains";
import { WagmiProvider, createConfig, createStorage, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";
import { safeLocalStorage } from "./lib/safeStorage";

export function RootProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const hasStorage =
        typeof window !== "undefined" &&
        !!window.localStorage &&
        typeof window.localStorage.getItem === "function";
      console.log(`[crossword] localStorage available: ${hasStorage}`);
    }
  }, []);

  const wagmiConfig = useMemo(
    () =>
      createConfig({
        chains: [base],
        transports: { [base.id]: http() },
        connectors: [injected()],
        storage: createStorage({
          storage: {
            getItem: (key) => safeLocalStorage.getItem(key),
            setItem: (key, value) => safeLocalStorage.setItem(key, value),
            removeItem: (key) => safeLocalStorage.removeItem(key),
          },
        }),
      }),
    [],
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
