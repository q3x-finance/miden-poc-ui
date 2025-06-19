"use client";

import { ReactNode, useMemo } from "react";
import { WalletProvider } from "@demox-labs/miden-wallet-adapter-react";
import { WalletModalProvider } from "@demox-labs/miden-wallet-adapter-reactui";
import { TridentWalletAdapter } from "@demox-labs/miden-wallet-adapter-trident";
import { useWallet } from "@demox-labs/miden-wallet-adapter-react";
import "@demox-labs/miden-wallet-adapter-reactui/styles.css";
import { Toaster } from "react-hot-toast";

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const wallets = useMemo(
    () => [
      new TridentWalletAdapter({
        appName: "Miden Wallet",
      }),
    ],
    []
  );

  return (
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <Toaster />
        <PublicKeyDisplay />
        {children}
      </WalletModalProvider>
    </WalletProvider>
  );
}

function PublicKeyDisplay() {
  const { publicKey } = useWallet();
  return publicKey ? (
    <div
      style={{
        position: "fixed",
        bottom: 8,
        right: 8,
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        padding: "0.5rem 1rem",
        borderRadius: 4,
        fontSize: "0.875rem",
        fontFamily: "monospace",
        zIndex: 1000,
      }}
    >
      Connected: {publicKey}
    </div>
  ) : null;
}
