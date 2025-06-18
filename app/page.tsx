"use client";

import { useState, useEffect } from "react";
import { AccountId } from "@demox-labs/miden-sdk";
import { getAccountAssets } from "@/lib/webClient";
import type { Tab, Faucet, Contact, Account } from "./types";
import AccountManagement from "./components/AccountManagement";
import Portfolio from "./components/Portfolio";
import Send from "./components/Send";
import AddressBook from "./components/AddressBook";
import Notes from "./components/Notes";
import FaucetComponent from "./components/Faucet";

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<Tab>("send");
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [deployedAccounts, setDeployedAccounts] = useState<Account[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deployedAccounts");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [deployedFaucets, setDeployedFaucets] = useState<Faucet[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deployedFaucets");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [addressBook, setAddressBook] = useState<Contact[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("addressBook");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [consumableNotes, setConsumableNotes] = useState<any[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);

  // Save to localStorage whenever deployedAccounts changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "deployedAccounts",
        JSON.stringify(deployedAccounts)
      );
    }
  }, [deployedAccounts]);

  // Save to localStorage whenever deployedFaucets changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("deployedFaucets", JSON.stringify(deployedFaucets));
    }
  }, [deployedFaucets]);

  // Save to localStorage whenever addressBook changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("addressBook", JSON.stringify(addressBook));
    }
  }, [addressBook]);

  const fetchPortfolio = async () => {
    if (!selectedAccount) return;

    setIsLoadingPortfolio(true);
    try {
      const assets = await getAccountAssets(AccountId.fromHex(selectedAccount));
      setPortfolio(assets);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  useEffect(() => {
    if (selectedAccount) {
      fetchPortfolio();
    }
  }, [selectedAccount]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-slate-800 dark:text-white">
          Miden Wallet
        </h1>

        <AccountManagement
          selectedAccount={selectedAccount}
          setSelectedAccount={setSelectedAccount}
          deployedAccounts={deployedAccounts}
          setDeployedAccounts={setDeployedAccounts}
          setAddressBook={setAddressBook}
        />

        <div className="mt-8">
          <Portfolio
            portfolio={portfolio}
            isLoadingPortfolio={isLoadingPortfolio}
          />
        </div>

        <div className="mt-8">
          <div className="grid grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => setSelectedTab("send")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedTab === "send"
                  ? "bg-indigo-600 text-white"
                  : "bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80"
              }`}
            >
              Send
            </button>
            <button
              onClick={() => setSelectedTab("addressbook")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedTab === "addressbook"
                  ? "bg-indigo-600 text-white"
                  : "bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80"
              }`}
            >
              Address Book
            </button>
            <button
              onClick={() => setSelectedTab("notes")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedTab === "notes"
                  ? "bg-indigo-600 text-white"
                  : "bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80"
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => setSelectedTab("faucet")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedTab === "faucet"
                  ? "bg-indigo-600 text-white"
                  : "bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80"
              }`}
            >
              Faucet
            </button>
          </div>

          <div>
            {selectedTab === "send" && (
              <Send
                selectedAccount={selectedAccount}
                deployedFaucets={deployedFaucets}
                addressBook={addressBook}
              />
            )}
            {selectedTab === "addressbook" && (
              <AddressBook
                addressBook={addressBook}
                setAddressBook={setAddressBook}
              />
            )}
            {selectedTab === "notes" && (
              <Notes
                selectedAccount={selectedAccount}
                consumableNotes={consumableNotes}
                setConsumableNotes={setConsumableNotes}
                fetchPortfolio={fetchPortfolio}
              />
            )}
            {selectedTab === "faucet" && (
              <FaucetComponent
                selectedAccount={selectedAccount}
                deployedFaucets={deployedFaucets}
                setDeployedFaucets={setDeployedFaucets}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
