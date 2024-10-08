'use client';

import { useState, useCallback, useEffect } from "react";
import { Connection, PublicKey, clusterApiUrl, Transaction, SystemProgram } from "@solana/web3.js";
import {
  useWallet,
  WalletProvider,
  ConnectionProvider
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import '@solana/wallet-adapter-react-ui/styles.css';

const network = clusterApiUrl('devnet'); // Use 'mainnet-beta' for real transactions
const connection = new Connection(network);

const Home = () => {
  const [solAmount, setSolAmount] = useState<number>(0);
  const wallet = useWallet(); // Automatically handles wallet connection

  // Track when the component has mounted
  const [mounted, setMounted] = useState(false);

  // Only set mounted to true after the component has mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  const sendSol = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      alert('Please connect your wallet!');
      return;
    }

    const recipientPublicKey = new PublicKey("5e1g9YW3XpsXddudcTiu5XdXN6uYstb3fnpJJrRUZ33t");

    const lamports = solAmount * 1e9; // Convert SOL to lamports (1 SOL = 1e9 lamports)

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: recipientPublicKey,
        lamports,
      })
    );

    transaction.feePayer = wallet.publicKey;

    // Use getLatestBlockhash() instead of the deprecated getRecentBlockhash()
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    try {
      const signedTransaction = await wallet.signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(txid);
      alert('Transaction Approved! TXID: ' + txid);
    } catch (error) {
      console.error("Error sending transaction:", error);
      alert('Transaction Canceled!');
    }
  }, [wallet, solAmount]);

  if (!mounted) {
    // Prevent rendering server-side
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-6">Connect to Phantom Wallet</h1>

      {/* Wallet Connection Button */}
      <WalletMultiButton className="bg-purple-600 text-white px-4 py-2 rounded-md mb-4">
        {wallet.connected ? 'Wallet Connected' : 'Connect Wallet'}
      </WalletMultiButton>

      {/* Input for SOL Amount */}
      <div className="mb-4">
        <label htmlFor="solAmount" className="block text-lg mb-2">Enter SOL Amount:</label>
        <input
          id="solAmount"
          type="number"
          value={solAmount}
          onChange={(e) => setSolAmount(parseFloat(e.target.value))}
          className="border border-gray-300 rounded-md p-2 w-full"
          placeholder="Amount in SOL"
        />
      </div>

      {/* Send SOL Button */}
      <div>
      <button
        onClick={sendSol}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:cursor-pointer"
        disabled={!wallet.connected || solAmount <= 0}
      >
        Send SOL
      </button>
      </div>
    </div>
  );
};

const App = () => {
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={network}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Home />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
