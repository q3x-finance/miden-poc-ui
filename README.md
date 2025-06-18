# Miden Wallet

A modern web-based wallet interface for the Miden blockchain, built with Next.js and TypeScript. This wallet provides a user-friendly interface for managing accounts, sending transactions, and interacting with faucets on the Miden testnet.

## Features

- **Account Management**

  - Deploy new accounts (public and private)
  - View and manage deployed accounts
  - Persistent storage of account information

- **Portfolio View**

  - Real-time display of account assets
  - Token balances and addresses
  - Automatic portfolio updates

- **Transaction Management**

  - Send tokens to multiple recipients
  - Batch transfer support
  - Privacy mode for transactions
  - Transaction history tracking

- **Address Book**

  - Save and manage recipient addresses
  - Quick selection for transactions
  - Persistent storage of contacts

- **Notes Management**

  - View and manage consumable notes
  - Note consumption functionality
  - Real-time updates

- **Faucet Integration**
  - Deploy new token faucets
  - Mint tokens from existing faucets
  - Configure token parameters (symbol, decimals, max supply)

## Tech Stack

- **Frontend Framework**: Next.js 14
- **Language**: TypeScript
- **UI Library**: React
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Blockchain Integration**: Miden SDK
- **Storage**: LocalStorage for persistence

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn package manager

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/miden-wallet.git
   cd miden-wallet
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
miden-wallet/
├── app/
│   ├── components/     # React components
│   ├── types/         # TypeScript type definitions
│   ├── page.tsx       # Main application page
│   └── layout.tsx     # Root layout component
├── lib/
│   ├── webClient.ts   # Miden blockchain client
│   └── utils.ts       # Utility functions
└── public/            # Static assets
```

## Usage

1. **Account Management**

   - Click "Deploy New Account" to create a new account
   - Select between public and private accounts
   - View your deployed accounts in the list

2. **Sending Transactions**

   - Select a recipient from your address book or enter a new address
   - Choose the token and amount
   - Toggle privacy mode if needed
   - Confirm the transaction

3. **Managing Faucets**

   - Deploy new faucets with custom parameters
   - Mint tokens from existing faucets
   - View faucet details and balances

4. **Address Book**
   - Add new contacts with names and addresses
   - Use saved addresses for quick transactions
   - Manage your contact list

## Development

### Building for Production

```bash
npm run build
# or
yarn build
```

### Running Tests

```bash
npm run test
# or
yarn test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Miden SDK](https://github.com/0xPolygonMiden/miden-vm)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
