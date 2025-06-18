import { useState } from "react";
import { Account, Contact } from "../types";
import toast from "react-hot-toast";
import { deployAccount } from "@/lib/webClient";
import {
  AccountBuilder,
  AccountComponent,
  AccountStorageMode,
  Felt,
  // RpoDigest,
  // SecretKey,
  StorageMap,
  StorageSlot,
  TransactionKernel,
  Word,
} from "@demox-labs/miden-sdk";

interface AccountManagementProps {
  deployedAccounts: Account[];
  setDeployedAccounts: (accounts: Account[]) => void;
  selectedAccount: string | null;
  setSelectedAccount: (account: string | null) => void;
  setAddressBook: (
    contacts: Contact[] | ((prev: Contact[]) => Contact[])
  ) => void;
}

export default function AccountManagement({
  deployedAccounts,
  setDeployedAccounts,
  selectedAccount,
  setSelectedAccount,
  setAddressBook,
}: AccountManagementProps) {
  const [newAccount, setNewAccount] = useState({
    name: "",
    isPublic: true,
  });
  const [isDeployingAccount, setIsDeployingAccount] = useState(false);

  const handleDeployAccount = async () => {
    try {
      setIsDeployingAccount(true);
      toast.loading("Deploying account...");
      const account = await deployAccount(newAccount.isPublic);

      setDeployedAccounts([
        ...deployedAccounts,
        {
          id: account.id().toString(),
          name: newAccount.name || `Account ${deployedAccounts.length + 1}`,
          isPublic: newAccount.isPublic,
        },
      ]);

      setAddressBook((prev) => [
        ...prev,
        {
          name: newAccount.name || `Account ${deployedAccounts.length + 1}`,
          address: account.id().toString(),
        },
      ]);

      toast.dismiss();
      toast.success(`Account deployed: ${account.id().toString()}`);

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
    // try {
    //   // const client = await WebClient.createClient(nodeEndpoint);
    //   // await client.syncState();
    //   const walletSeed = new Uint8Array(32);
    //   crypto.getRandomValues(walletSeed);
    //   // Custom component
    //   // --------------------------------------------------------------------------
    //   let felt1 = new Felt(BigInt(15));
    //   let felt2 = new Felt(BigInt(15));
    //   let felt3 = new Felt(BigInt(15));
    //   let felt4 = new Felt(BigInt(15));
    //   const MAP_KEY = new RpoDigest([felt1, felt2, felt3, felt4]);
    //   const FPI_STORAGE_VALUE = Word.newFromU64s(
    //     new BigUint64Array([BigInt(9), BigInt(12), BigInt(18), BigInt(30)])
    //   );
    //   let storageMap = new StorageMap();
    //   storageMap.insert(MAP_KEY, FPI_STORAGE_VALUE);
    //   const code = `
    //         export.get_fpi_map_item
    //             # map key
    //             push.15.15.15.15
    //             # item index
    //             push.0
    //             exec.::miden::account::get_map_item
    //             swapw dropw
    //         end
    //     `;
    //   let myComponent = AccountComponent.compile(
    //     code,
    //     TransactionKernel.assembler(),
    //     [StorageSlot.map(storageMap)]
    //   ).withSupportsAllTypes();
    //   // Auth component
    //   let secretKey = SecretKey.withRng(walletSeed);
    //   let authComponent = AccountComponent.createAuthComponent(secretKey);
    //   // Building account
    //   let normalAccount = new AccountBuilder(walletSeed)
    //     .withComponent(authComponent)
    //     .storageMode(AccountStorageMode.public())
    //     .build();
    //   console.log(
    //     "CREATED ACCOUNT !!!!",
    //     normalAccount.account.id().toString()
    //   );
    // } catch {}
  };

  return (
    <section className="w-full  bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-8">
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
                    <h4 className="font-semibold text-lg">{account.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {account.isPublic ? "Public Account" : "Private Account"}
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
                  <p className="font-mono text-sm break-all">{account.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
