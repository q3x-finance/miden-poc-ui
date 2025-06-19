"use client";

import { useState, useEffect } from "react";
import type { Tab, Faucet, Contact, Account } from "./types";
import AccountManagement from "./components/AccountManagement";
import Portfolio from "./components/Portfolio";
import Send from "./components/Send";
import AddressBook from "./components/AddressBook";
import Notes from "./components/Notes";
import FaucetComponent from "./components/Faucet";
import Logo from "./components/Logo";

// Disable static generation for this page
export const dynamic = "force-dynamic";

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<Tab>("send");
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [deployedAccounts, setDeployedAccounts] = useState<Account[]>([]);
  const [deployedFaucets, setDeployedFaucets] = useState<Faucet[]>([]);
  const [addressBook, setAddressBook] = useState<Contact[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [consumableNotes, setConsumableNotes] = useState<any[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Initialize state from localStorage only on client side
  useEffect(() => {
    setIsClient(true);
    const savedAccounts = localStorage.getItem("deployedAccounts");
    const savedFaucets = localStorage.getItem("deployedFaucets");
    const savedAddressBook = localStorage.getItem("addressBook");

    if (savedAccounts) setDeployedAccounts(JSON.parse(savedAccounts));
    if (savedFaucets) setDeployedFaucets(JSON.parse(savedFaucets));
    if (savedAddressBook) setAddressBook(JSON.parse(savedAddressBook));
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(
        "deployedAccounts",
        JSON.stringify(deployedAccounts)
      );
    }
  }, [deployedAccounts, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("deployedFaucets", JSON.stringify(deployedFaucets));
    }
  }, [deployedFaucets, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("addressBook", JSON.stringify(addressBook));
    }
  }, [addressBook, isClient]);

  const fetchPortfolio = async () => {
    if (!selectedAccount || !isClient) return;

    setIsLoadingPortfolio(true);
    try {
      const { getAccountAssets, getAccountId } = await import(
        "@/lib/midenClient"
      );
      const AccountId = await getAccountId();
      const assets = await getAccountAssets(AccountId.fromHex(selectedAccount));
      setPortfolio(assets);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  useEffect(() => {
    if (selectedAccount && isClient) {
      fetchPortfolio();
    }
  }, [selectedAccount, isClient]);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Logo />
        </div>

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
                fetchPortfolio={fetchPortfolio}
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
