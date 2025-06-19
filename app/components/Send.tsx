import { useState, useRef, useEffect } from "react";
import { Recipient, Faucet } from "../types";
import toast from "react-hot-toast";
import {
  batchTransfer,
  getAccountAssets,
  getAccountId,
} from "@/lib/midenClient";

interface SendProps {
  selectedAccount: string | null;
  deployedFaucets: Faucet[];
  addressBook: { name: string; address: string }[];
  fetchPortfolio?: () => Promise<void>;
}

export default function Send({
  selectedAccount,
  deployedFaucets,
  addressBook,
  fetchPortfolio,
}: SendProps) {
  const [isPrivate, setIsPrivate] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: "", amount: "" },
  ]);
  const [batchFaucetId, setBatchFaucetId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async () => {
    if (!selectedAccount) return toast.error("Please select an account");

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
      const AccountId = await getAccountId();
      const transferRequests = validRecipients.map((r) => ({
        recipient: AccountId.fromHex(r.address),
        amount: Number(r.amount),
        faucet: AccountId.fromHex(batchFaucetId),
      }));
      toast.loading("Sending transactions...");

      const txId = await batchTransfer(
        AccountId.fromHex(selectedAccount),
        transferRequests,
        isPrivate
      );
      toast.dismiss();
      toast.success(
        <div>
          <p>Notes consumed successfully</p>
          <a
            href={`https://testnet.midenscan.com/tx/${txId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:text-indigo-600 underline mt-1 inline-block"
          >
            View on MidenScan
          </a>
        </div>
      );
      setRecipients([{ address: "", amount: "" }]);

      // update balance
      if (fetchPortfolio) {
        await fetchPortfolio();
      }
    } catch (error) {
      console.error("Error sending transactions:", error);
      toast.error("Error sending transactions");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowAddressBook(false);
        setActiveInputIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
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
              isPrivate ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
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
  );
}
