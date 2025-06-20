"use client";

import {
  WebClient,
  AccountId,
  TransactionRequestBuilder,
  FungibleAsset,
  OutputNotesArray,
  NoteType,
  AccountStorageMode,
} from "@demox-labs/miden-sdk";
import { buildP2IDNote } from "./utils";

const nodeEndpoint = "https://rpc.testnet.miden.io:443";

export interface Asset {
  tokenAddress: string;
  amount: string;
}

export interface TransferRequest {
  recipient: any;
  amount: number;
  faucet: any;
}

let client: any = null;

async function getClient() {
  if (!client) {
    const { WebClient } = await import("@demox-labs/miden-sdk");
    client = await WebClient.createClient(nodeEndpoint);
    await client.syncState();
  }
  return client;
}

export async function getAccountAssets(accountId: any): Promise<Asset[]> {
  const client = await getClient();

  let account = await client.getAccount(accountId);

  if (!account) {
    await client.importAccountById(accountId);
    await client.syncState();
    account = await client.getAccount(accountId);
    if (!account) {
      throw new Error(`Account not found after import: ${accountId}`);
    }
  }

  // read account assets
  const assets: any[] = account.vault().fungibleAssets();
  return assets.map((asset: any) => ({
    tokenAddress: asset.faucetId().toString(),
    amount: asset.amount().toString(),
  }));
}

export async function batchTransfer(
  sender: any,
  request: TransferRequest[],
  isPrivate: boolean = false
) {
  const client = await getClient();
  const { OutputNotesArray, TransactionRequestBuilder, NoteType } =
    await import("@demox-labs/miden-sdk");

  // build a list of  output notes array
  const outputNotes = new OutputNotesArray(
    await Promise.all(
      request.map(async (r) => {
        return await buildP2IDNote(
          sender,
          r.recipient,
          r.faucet,
          r.amount,
          isPrivate ? NoteType.Private : NoteType.Public
        );
      })
    )
  );

  const transactionRequest = new TransactionRequestBuilder()
    .withOwnOutputNotes(outputNotes)
    .build();

  console.log("Transactions:", outputNotes, transactionRequest);

  let txResult = await client.newTransaction(sender, transactionRequest);

  await client.submitTransaction(txResult);

  return txResult.executedTransaction().id().toHex();
}

export async function consumeAllNotes(noteIds: string[], accountId: string) {
  const client = await getClient();

  const consumeTxRequest = client.newConsumeTransactionRequest(noteIds);

  const txResult = await client.newTransaction(
    await getAccountId(accountId),
    consumeTxRequest
  );
  await client.submitTransaction(txResult);

  const txId = txResult.executedTransaction().id().toHex();
  return txId;
}

export async function mintToken(
  accountId: string,
  faucetId: string,
  amount: number
) {
  const client = await getClient();
  const { AccountId, NoteType } = await import("@demox-labs/miden-sdk");

  // Create mint transaction request
  const mintTxRequest = client.newMintTransactionRequest(
    AccountId.fromHex(accountId),
    AccountId.fromHex(faucetId),
    NoteType.Public,
    BigInt(amount)
  );

  // Submit the transaction
  const txResult = await client.newTransaction(
    AccountId.fromHex(faucetId),
    mintTxRequest
  );
  await client.submitTransaction(txResult);
  const txId = txResult.executedTransaction().id().toHex();
  return txId;
}

export async function deployAccount(isPublic: boolean) {
  const client = await getClient();
  const { AccountStorageMode } = await import("@demox-labs/miden-sdk");

  const account = await client.newWallet(
    isPublic ? AccountStorageMode.public() : AccountStorageMode.private(),
    true
  );

  return account;
}

export async function deployFaucet(
  symbol: string,
  decimals: number,
  maxSupply: number
) {
  const client = await getClient();
  const { AccountStorageMode } = await import("@demox-labs/miden-sdk");

  const faucet = await client.newFaucet(
    AccountStorageMode.public(),
    false,
    symbol,
    decimals,
    BigInt(maxSupply)
  );

  return faucet.id().toString();
}

async function getAccountId(accountId: string) {
  const { AccountId } = await import("@demox-labs/miden-sdk");
  return AccountId.fromHex(accountId);
}
