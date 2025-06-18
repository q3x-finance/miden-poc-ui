"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";

import { useWallet } from "@demox-labs/miden-wallet-adapter-react";

import { TridentWalletAdapter } from "@demox-labs/miden-wallet-adapter-trident";
import {
  AccountId,
  NoteType,
  FungibleAsset,
  Felt,
  StorageMap,
  StorageSlot,
} from "@demox-labs/miden-sdk";
import "@demox-labs/miden-wallet-adapter-reactui/styles.css";
import { getAccountAssets, Asset, batchTransfer } from "@/lib/webClient";
import toast from "react-hot-toast";
import {
  WebClient,
  AccountStorageMode,
  AccountHeader,
  AccountBuilder,
  AccountComponent,
  Assembler,
  Library,
  RpoDigest,
  Word,
  TransactionKernel,
  AuthSecretKey,
  SecretKey,
} from "@demox-labs/miden-sdk";

const nodeEndpoint = "https://rpc.testnet.miden.io:443";
// const nodeEndpoint = "http://0.0.0.0:57291";

// Mock data for address book - replace with actual data fetching
const mockAddressBook = [
  { name: "Account 2", address: "0x137dd7f3944e5b1000005d11e6b2f8" },
];

// Mock data for consumable notes - replace with actual data fetching
const mockNotes = [
  {
    id: "1",
    sender: "0x1234...5678",
    asset: { address: "0x1234...5678", amount: "10.00" },
    timestamp: "2024-03-20T10:00:00Z",
    status: "pending",
  },
  {
    id: "2",
    sender: "0x8765...4321",
    asset: { address: "0x8765...4321", amount: "5.00" },
    timestamp: "2024-03-20T09:30:00Z",
    status: "pending",
  },
];

type Tab = "send" | "addressbook" | "notes" | "faucet";

type Faucet = {
  id: string;
  symbol: string;
  decimals: number;
  maxSupply: string;
};

export default function Home() {
  const [isPrivate, setIsPrivate] = useState(false);
  const [recipients, setRecipients] = useState([{ address: "", amount: "" }]);
  const [portfolio, setPortfolio] = useState<Asset[]>([]);
  const [addressBook, setAddressBook] = useState(mockAddressBook);
  const [notes, setNotes] = useState(mockNotes);
  const [activeTab, setActiveTab] = useState<Tab>("send");
  const [newContact, setNewContact] = useState({ name: "", address: "" });
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isConsuming, setIsConsuming] = useState(false);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const { publicKey, wallet } = useWallet();
  const [isSending, setIsSending] = useState(false);
  const [newFaucet, setNewFaucet] = useState({
    symbol: "MID",
    decimals: "8",
    maxSupply: "1000000",
  });
  const [mintRequest, setMintRequest] = useState({
    recipient: "",
    amount: "",
  });
  const [newAccount, setNewAccount] = useState({
    name: "",
    isPublic: true,
  });
  const [batchFaucetId, setBatchFaucetId] = useState<string>("");
  const [deployedFaucets, setDeployedFaucets] = useState<Faucet[]>([]);
  const [isDeployingFaucet, setIsDeployingFaucet] = useState(false);
  const [isDeployingAccount, setIsDeployingAccount] = useState(false);
  const [deployedAccounts, setDeployedAccounts] = useState<
    Array<{ id: string; name: string; isPublic: boolean }>
  >([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedFaucet, setSelectedFaucet] = useState<string | null>(null);
  const [mintAmount, setMintAmount] = useState("");
  const [consumableNotes, setConsumableNotes] = useState<any[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  const addRecipient = () => {
    setRecipients([...recipients, { address: "", amount: "" }]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (
    index: number,
    field: "address" | "amount",
    value: string
  ) => {
    const newRecipients = [...recipients];
    newRecipients[index][field] = value;
    setRecipients(newRecipients);
  };

  const handleSend = async () => {
    if (!selectedAccount) return toast.error("Please select an account");

    // Validate inputs
    const validRecipients = recipients.filter((r) => r.address && r.amount);
    if (validRecipients.length === 0) {
      toast.error("No valid recipients");
      return;
    }

    if (!batchFaucetId) {
      toast.error("Please enter a faucet ID");
      return;
    }

    setIsSending(true);
    try {
      const transferRequests = validRecipients.map((r) => ({
        recipient: AccountId.fromHex(r.address),
        amount: Number(r.amount),
        faucet: AccountId.fromHex(batchFaucetId),
      }));

      const txId = await batchTransfer(
        AccountId.fromHex(selectedAccount),
        transferRequests,
        isPrivate
      );
      console.log("Transaction successful:", txId);
      const txUrl = `https://testnet.midenscan.com/tx/${txId}`;
      const toastId = toast.loading("Sending transactions...");
      toast.success(
        <div>
          <p>Notes consumed successfully</p>
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:text-indigo-600 underline mt-1 inline-block"
          >
            View on MidenScan
          </a>
        </div>,
        { id: toastId }
      );

      // Clear the form after successful transfer
      setRecipients([{ address: "", amount: "" }]);
    } catch (error) {
      console.error("Error sending transactions:", error);
      toast.error("Error sending transactions");
    } finally {
      setIsSending(false);
    }
  };

  const addToAddressBook = () => {
    if (newContact.name && newContact.address) {
      setAddressBook([...addressBook, newContact]);
      setNewContact({ name: "", address: "" });
    }
  };

  const removeFromAddressBook = (index: number) => {
    setAddressBook(addressBook.filter((_, i) => i !== index));
  };

  const selectFromAddressBook = (address: string) => {
    const lastRecipient = recipients[recipients.length - 1];
    if (lastRecipient && !lastRecipient.address) {
      updateRecipient(recipients.length - 1, "address", address);
    } else {
      addRecipient();
      updateRecipient(recipients.length, "address", address);
    }
    setShowAddressBook(false);
  };

  const getConsumableNotes = async () => {
    if (!selectedAccount) return;

    setIsLoadingNotes(true);
    try {
      const client = await WebClient.createClient(nodeEndpoint);
      await client.syncState();

      const notes = await client.getConsumableNotes(
        AccountId.fromHex(selectedAccount)
      );
      console.log(notes);
      setConsumableNotes(notes);
    } catch (error) {
      console.error("Error fetching consumable notes:", error);
      toast.error("Failed to fetch consumable notes");
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleConsumeAll = async () => {
    if (!selectedAccount) {
      toast.error("Please select an account first");
      return;
    }

    if (consumableNotes.length === 0) {
      toast.error("No notes to consume");
      return;
    }

    const toastId = toast.loading("Consuming notes...");
    try {
      const client = await WebClient.createClient(nodeEndpoint);
      await client.syncState();

      const noteIds = consumableNotes.map((note) =>
        note.inputNoteRecord().id().toString()
      );
      console.log(noteIds);
      // Create consume transaction request
      const consumeTxRequest = client.newConsumeTransactionRequest(noteIds);

      // Submit the transaction
      const txResult = await client.newTransaction(
        AccountId.fromHex(selectedAccount),
        consumeTxRequest
      );
      await client.submitTransaction(txResult);

      const txId = txResult.executedTransaction().id().toHex();
      const txUrl = `https://testnet.midenscan.com/tx/${txId}`;

      toast.success(
        <div>
          <p>Notes consumed successfully</p>
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:text-indigo-600 underline mt-1 inline-block"
          >
            View on MidenScan
          </a>
        </div>,
        { id: toastId }
      );

      // Refresh portfolio and consumable notes
      await fetchPortfolio();
      await getConsumableNotes();
    } catch (error) {
      console.error("Error consuming notes:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to consume notes",
        { id: toastId }
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowAddressBook(false);
        setActiveInputIndex(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function fetchPortfolio() {
    if (!selectedAccount) return;

    setIsLoadingPortfolio(true);
    try {
      const accountId = AccountId.fromHex(selectedAccount);
      const assets = await getAccountAssets(accountId);
      setPortfolio(assets);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setIsLoadingPortfolio(false);
    }
  }

  useEffect(() => {
    if (selectedAccount) {
      fetchPortfolio();
    }
  }, [selectedAccount]);

  const handleDeployFaucet = async () => {
    try {
      setIsDeployingFaucet(true);
      toast.loading("Deploying faucet...");
      const client = await WebClient.createClient(nodeEndpoint);
      await client.syncState();

      const faucet = await client.newFaucet(
        AccountStorageMode.public(),
        false,
        newFaucet.symbol,
        parseInt(newFaucet.decimals),
        BigInt(newFaucet.maxSupply)
      );

      // Add the new faucet to the state
      setDeployedFaucets([
        ...deployedFaucets,
        {
          id: faucet.id().toString(),
          symbol: newFaucet.symbol,
          decimals: parseInt(newFaucet.decimals),
          maxSupply: newFaucet.maxSupply,
        },
      ]);

      toast.dismiss();
      toast.success(`Faucet deployed: ${faucet.id().toString()}`);

      // Clear the form
      setNewFaucet({
        symbol: "MID",
        decimals: "8",
        maxSupply: "1000000",
      });
    } catch (error) {
      toast.dismiss();
      console.error("Error deploying faucet:", error);
      toast.error("Error deploying faucet");
    } finally {
      setIsDeployingFaucet(false);
    }
  };

  const handleMintToken = async () => {
    if (!selectedAccount) {
      toast.error("Please select an account first");
      return;
    }

    if (!selectedFaucet) {
      toast.error("Please select a faucet first");
      return;
    }

    if (!mintAmount || isNaN(Number(mintAmount)) || Number(mintAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const toastId = toast.loading("Minting token...");
    try {
      const client = await WebClient.createClient(nodeEndpoint);
      await client.syncState();

      const faucet = deployedFaucets.find((f) => f.id === selectedFaucet);
      if (!faucet) {
        throw new Error("Selected faucet not found");
      }

      // Create mint transaction request
      const mintTxRequest = client.newMintTransactionRequest(
        AccountId.fromHex(selectedAccount),
        AccountId.fromHex(selectedFaucet),
        NoteType.Public,
        BigInt(mintAmount)
      );

      // Submit the transaction
      const txResult = await client.newTransaction(
        AccountId.fromHex(selectedFaucet),
        mintTxRequest
      );
      await client.submitTransaction(txResult);

      const txId = txResult.executedTransaction().id().toHex();
      const txUrl = `https://testnet.midenscan.com/tx/${txId}`;

      toast.success(
        <div>
          <p>Token minted successfully</p>
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:text-indigo-600 underline mt-1 inline-block"
          >
            View on MidenScan
          </a>
        </div>,
        { id: toastId }
      );
      setMintAmount("");
      // Refresh the portfolio to show updated balances
      await fetchPortfolio();
    } catch (error) {
      console.error("Error minting token:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to mint token",
        { id: toastId }
      );
    }
  };

  const handleDeployAccount = async () => {
    try {
      setIsDeployingAccount(true);
      toast.loading("Deploying account...");
      const client = await WebClient.createClient(nodeEndpoint);
      await client.syncState();

      const account = await client.newWallet(
        newAccount.isPublic
          ? AccountStorageMode.public()
          : AccountStorageMode.private(),
        true
      );
      await client.syncState();
      // Add the new account to the state
      setDeployedAccounts([
        ...deployedAccounts,
        {
          id: account.id().toString(),
          name: newAccount.name || `Account ${deployedAccounts.length + 1}`,
          isPublic: newAccount.isPublic,
        },
      ]);

      // Add to address book
      setAddressBook([
        ...addressBook,
        {
          name: newAccount.name || `Account ${addressBook.length + 1}`,
          address: account.id().toString(),
        },
      ]);

      toast.dismiss();
      toast.success(`Account deployed: ${account.id().toString()}`);

      // Clear the form
      setNewAccount({ name: "", isPublic: true });
    } catch (error) {
      toast.dismiss();
      console.error("Error deploying account:", error);
      toast.error("Error deploying account");
    } finally {
      setIsDeployingAccount(false);
    }
  };

  const handleCreateModularAccount = async () => {
    try {
      // const client = await WebClient.createClient(nodeEndpoint);
      // await client.syncState();

      const walletSeed = new Uint8Array(32);
      crypto.getRandomValues(walletSeed);

      // Custom component
      // --------------------------------------------------------------------------

      let felt1 = new Felt(BigInt(15));
      let felt2 = new Felt(BigInt(15));
      let felt3 = new Felt(BigInt(15));
      let felt4 = new Felt(BigInt(15));
      const MAP_KEY = new RpoDigest([felt1, felt2, felt3, felt4]);
      const FPI_STORAGE_VALUE = Word.newFromU64s(
        new BigUint64Array([BigInt(9), BigInt(12), BigInt(18), BigInt(30)])
      );

      let storageMap = new StorageMap();
      storageMap.insert(MAP_KEY, FPI_STORAGE_VALUE);

      const code = `
            export.get_fpi_map_item
                # map key
                push.15.15.15.15
                # item index
                push.0  
                exec.::miden::account::get_map_item
                swapw dropw
            end
        `;

      let myComponent = AccountComponent.compile(
        code,
        TransactionKernel.assembler(),
        [StorageSlot.map(storageMap)]
      ).withSupportsAllTypes();

      // Auth component

      let secretKey = SecretKey.withRng(walletSeed);
      let authComponent = AccountComponent.createAuthComponent(secretKey);

      // Building account

      let normalAccount = new AccountBuilder(walletSeed)
        .withComponent(authComponent)
        .storageMode(AccountStorageMode.public())
        .build();

      console.log(
        "CREATED ACCOUNT !!!!",
        normalAccount.account.id().toString()
      );
    } catch {}
  };

  return (
    // <WalletProvider wallets={wallets} autoConnect>
    //   <WalletModalProvider>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 text-slate-800 dark:text-slate-100 flex flex-col">
      <div className="px-10 bg-red-300" onClick={handleCreateModularAccount}>
        create account
      </div>
      <header className="w-full px-4 sm:px-8 py-4 flex justify-end">
        {/* <CustomWalletButton /> */}
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-8 py-8 gap-8">
        {/* Account Management Section */}
        <section className="w-full max-w-4xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              Account Management
            </h2>
          </div>

          {/* Account Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Active Account
            </label>
            <select
              value={selectedAccount || ""}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select an account</option>
              {deployedAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.isPublic ? "Public" : "Private"})
                </option>
              ))}
            </select>
          </div>

          {/* Deploy New Account */}
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Deploy New Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Account Name (Optional)
                </label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Account name"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAccount.isPublic}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        isPublic: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Public Account
                  </span>
                </label>
              </div>
            </div>
            <button
              onClick={handleDeployAccount}
              disabled={isDeployingAccount}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeployingAccount ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Deploying...
                </>
              ) : (
                "Deploy Account"
              )}
            </button>
          </div>

          {/* Deployed Accounts List */}
          {deployedAccounts.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Deployed Accounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deployedAccounts.map((account, index) => (
                  <div
                    key={index}
                    className={`bg-white dark:bg-slate-800 rounded-lg p-4 border ${
                      selectedAccount === account.id
                        ? "border-indigo-500 dark:border-indigo-400"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">
                          {account.name}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {account.isPublic
                            ? "Public Account"
                            : "Private Account"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(account.id);
                          toast.success("Account ID copied to clipboard");
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      </button>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Account ID
                      </p>
                      <p className="font-mono text-sm break-all">
                        {account.id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Portfolio Dashboard */}
        <section className="w-full max-w-4xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              Portfolio
            </h2>
            {isLoadingPortfolio && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading...
              </div>
            )}
          </div>
          {portfolio.length === 0 ? (
            <div className="text-center py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-4 text-slate-500 dark:text-slate-400">
                {isLoadingPortfolio
                  ? "Loading portfolio..."
                  : "No assets found"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.map((asset, index) => (
                <div
                  key={index}
                  className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg"
                >
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Token Address
                  </p>
                  <p className="font-mono text-sm mb-2">{asset.tokenAddress}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Amount
                  </p>
                  <p className="font-mono text-lg font-semibold">
                    {asset.amount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tabs */}
        <div className="w-full max-w-4xl">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setActiveTab("send")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "send"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
            >
              Send
            </button>
            <button
              onClick={() => setActiveTab("addressbook")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "addressbook"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
            >
              Address Book
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "notes"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
            >
              Consumable Notes
            </button>
            <button
              onClick={() => setActiveTab("faucet")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "faucet"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
            >
              Faucet Management
            </button>
          </div>

          {/* Send Tab */}
          {activeTab === "send" && (
            <section className="w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  Multisender
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Privacy Mode</span>
                  <button
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      isPrivate
                        ? "bg-indigo-600"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isPrivate ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Faucet ID Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Faucet
                </label>
                <select
                  value={batchFaucetId}
                  onChange={(e) => setBatchFaucetId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select a faucet</option>
                  {deployedFaucets.map((faucet) => (
                    <option key={faucet.id} value={faucet.id}>
                      {faucet.symbol} ({faucet.decimals} decimals)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                {recipients.map((recipient, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Recipient Address"
                        value={recipient.address}
                        onChange={(e) =>
                          updateRecipient(index, "address", e.target.value)
                        }
                        onFocus={() => {
                          setShowAddressBook(true);
                          setActiveInputIndex(index);
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      {showAddressBook && activeInputIndex === index && (
                        <div
                          ref={dropdownRef}
                          className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600"
                        >
                          {addressBook.map((contact, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                selectFromAddressBook(contact.address);
                                setShowAddressBook(false);
                                setActiveInputIndex(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600 flex justify-between items-center"
                            >
                              <span>{contact.name}</span>
                              <span className="text-sm text-slate-500">
                                {contact.address}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={recipient.amount}
                        onChange={(e) =>
                          updateRecipient(index, "amount", e.target.value)
                        }
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    {recipients.length > 1 && (
                      <button
                        onClick={() => removeRecipient(index)}
                        className="p-2 text-red-500 hover:text-red-600"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={addRecipient}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Add Recipient
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending || !selectedAccount}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send {recipients.length} Transaction
                      {recipients.length !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          {/* Address Book Tab */}
          {activeTab === "addressbook" && (
            <section className="w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">
                Address Book
              </h2>

              {/* Add New Contact Form */}
              <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Add New Contact</h3>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={newContact.name}
                    onChange={(e) =>
                      setNewContact({ ...newContact, name: e.target.value })
                    }
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newContact.address}
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        address: e.target.value,
                      })
                    }
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={addToAddressBook}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Add Contact
                  </button>
                </div>
              </div>

              {/* Contact List */}
              <div className="space-y-4">
                {addressBook.map((contact, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{contact.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                        {contact.address}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromAddressBook(index)}
                      className="p-2 text-red-500 hover:text-red-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Consumable Notes Tab */}
          {activeTab === "notes" && (
            <section className="w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-8">
              <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Consumable Notes</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={getConsumableNotes}
                      disabled={!selectedAccount || isLoadingNotes}
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoadingNotes ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Refresh Notes
                        </>
                      )}
                    </button>
                    {consumableNotes.length > 0 && (
                      <button
                        onClick={handleConsumeAll}
                        disabled={isLoadingNotes}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isLoadingNotes ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Loading...
                          </>
                        ) : (
                          "Consume All Notes"
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {isLoadingNotes ? (
                  <div className="text-center py-8">
                    <svg
                      className="animate-spin h-8 w-8 mx-auto text-indigo-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p className="mt-4 text-slate-500 dark:text-slate-400">
                      Loading consumable notes...
                    </p>
                  </div>
                ) : consumableNotes.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="mt-4 text-slate-500 dark:text-slate-400">
                      {selectedAccount
                        ? "No consumable notes found"
                        : "Select an account to view notes"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {consumableNotes.map((note, index) => {
                      const noteDetails = note.inputNoteRecord().details();
                      const assets = noteDetails.assets().fungibleAssets();
                      const recipient = noteDetails.recipient();

                      return (
                        <div
                          key={index}
                          className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-lg">
                                Note {index + 1}
                              </h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                ID: {note.inputNoteRecord().id().toString()}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  note.inputNoteRecord().id().toString()
                                );
                                toast.success("Note ID copied to clipboard");
                              }}
                              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                              </svg>
                            </button>
                          </div>

                          {/* Recipient Information */}
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Recipient
                            </h5>
                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded p-2">
                              <p className="text-sm text-slate-600 dark:text-slate-400 break-all">
                                {recipient.digest().toHex()}
                              </p>
                            </div>
                          </div>

                          {/* Assets Information */}
                          <div>
                            <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Assets
                            </h5>
                            <div className="space-y-2">
                              {assets.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                                  No fungible assets
                                </p>
                              ) : (
                                assets.map(
                                  (
                                    asset: FungibleAsset,
                                    assetIndex: number
                                  ) => (
                                    <div
                                      key={assetIndex}
                                      className="bg-slate-50 dark:bg-slate-700/50 rounded p-2 flex justify-between items-center"
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                          Faucet ID:{" "}
                                          {asset.faucetId().toString()}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                          Amount: {asset.amount().toString()}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            asset.faucetId().toString()
                                          );
                                          toast.success(
                                            "Faucet ID copied to clipboard"
                                          );
                                        }}
                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                        </svg>
                                      </button>
                                    </div>
                                  )
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Add Testing Tab */}
          {activeTab === "faucet" && (
            <section className="w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">
                Faucet Management
              </h2>

              {/* Deploy Faucet Section */}
              <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Deploy Faucet</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Symbol
                    </label>
                    <input
                      type="text"
                      value={newFaucet.symbol}
                      onChange={(e) =>
                        setNewFaucet({
                          ...newFaucet,
                          symbol: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g. MID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Decimals
                    </label>
                    <input
                      type="number"
                      value={newFaucet.decimals}
                      onChange={(e) =>
                        setNewFaucet({
                          ...newFaucet,
                          decimals: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g. 8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Max Supply
                    </label>
                    <input
                      type="text"
                      value={newFaucet.maxSupply}
                      onChange={(e) =>
                        setNewFaucet({
                          ...newFaucet,
                          maxSupply: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g. 1000000"
                    />
                  </div>
                </div>
                <button
                  onClick={handleDeployFaucet}
                  disabled={isDeployingFaucet}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeployingFaucet ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Deploying...
                    </>
                  ) : (
                    "Deploy Faucet"
                  )}
                </button>
              </div>

              {/* Deployed Faucets Section */}
              <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Deployed Faucets</h3>
                {deployedFaucets.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <p className="mt-4 text-slate-500 dark:text-slate-400">
                      No faucets deployed yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deployedFaucets.map((faucet, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {faucet.symbol}
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Decimals: {faucet.decimals}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(faucet.id);
                              toast.success("Faucet ID copied to clipboard");
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Max Supply
                            </p>
                            <p className="font-mono">{faucet.maxSupply}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Faucet ID
                            </p>
                            <p className="font-mono text-sm break-all">
                              {faucet.id}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mint Token Section */}
              <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Mint Token</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Select Faucet
                    </label>
                    <select
                      value={selectedFaucet || ""}
                      onChange={(e) => setSelectedFaucet(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={isDeployingFaucet}
                    >
                      <option value="">Select a faucet</option>
                      {deployedFaucets.map((faucet) => (
                        <option key={faucet.id} value={faucet.id}>
                          {faucet.symbol} ({faucet.decimals} decimals)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter amount"
                      min="0"
                      step="any"
                      disabled={isDeployingFaucet}
                    />
                  </div>
                </div>
                <button
                  onClick={handleMintToken}
                  disabled={
                    !selectedAccount ||
                    !selectedFaucet ||
                    !mintAmount ||
                    isDeployingFaucet
                  }
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeployingFaucet ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Minting...
                    </>
                  ) : (
                    "Mint Token"
                  )}
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="w-full px-4 sm:px-8 py-6 flex flex-wrap items-center justify-center gap-6 text-sm opacity-80">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://0xMiden.github.io/miden-docs/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Miden Docs
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://0xMiden.github.io/miden-docs/imported/miden-tutorials/src/index.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Tutorials
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com/0xMiden"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/github.svg"
            alt="GitHub icon"
            width={16}
            height={16}
          />
          GitHub
        </a>
      </footer>
    </div>
    // </WalletModalProvider>
    // </WalletProvider>
  );
}

// Comment out the CustomWalletButton component since we're not using it
/*
function CustomWalletButton() {
  // ... existing code ...
}
*/
