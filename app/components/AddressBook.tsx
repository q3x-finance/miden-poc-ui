import { useState } from "react";
import { Contact } from "../types";
import toast from "react-hot-toast";

interface AddressBookProps {
  addressBook: Contact[];
  setAddressBook: (contacts: Contact[]) => void;
}

export default function AddressBook({
  addressBook,
  setAddressBook,
}: AddressBookProps) {
  const [newContact, setNewContact] = useState<Contact>({
    name: "",
    address: "",
  });

  const addToAddressBook = () => {
    if (newContact.name && newContact.address) {
      setAddressBook([...addressBook, newContact]);
      setNewContact({ name: "", address: "" });
    }
  };

  const removeFromAddressBook = (index: number) => {
    setAddressBook(addressBook.filter((_, i) => i !== index));
  };

  return (
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
  );
}
