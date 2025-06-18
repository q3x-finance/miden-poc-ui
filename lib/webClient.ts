"use client";

import {
  WebClient,
  AccountId,
  TransactionRequestBuilder,
  FungibleAsset,
  OutputNotesArray,
  NoteType,
} from "@demox-labs/miden-sdk";
import { buildP2IDNote } from "./utils";

const nodeEndpoint = "https://rpc.testnet.miden.io:443";

export interface Asset {
  tokenAddress: string;
  amount: string;
}

export interface TransferRequest {
  recipient: AccountId;
  amount: number;
  faucet: AccountId;
}

export async function getAccountAssets(accountId: AccountId): Promise<Asset[]> {
  const client = await WebClient.createClient(nodeEndpoint);
  await client.syncState();

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
  const assets: FungibleAsset[] = account.vault().fungibleAssets();
  return assets.map((asset: FungibleAsset) => ({
    tokenAddress: asset.faucetId().toString(),
    amount: asset.amount().toString(),
  }));
}

export async function batchTransfer(
  sender: AccountId,
  request: TransferRequest[],
  isPrivate: boolean = false
) {
  // build a list of  output notes array
  const outputNotes = new OutputNotesArray(
    request.map((r) => {
      return buildP2IDNote(
        sender,
        r.recipient,
        r.faucet,
        r.amount,
        isPrivate ? NoteType.Private : NoteType.Public
      );
    })
  );
  console.log("HALO");
  const client = await WebClient.createClient(nodeEndpoint);
  await client.syncState();

  // fetch and cache account

  // build transaction request
  const transactionRequest = new TransactionRequestBuilder()
    .withOwnOutputNotes(outputNotes)
    .build();

  console.log("Transactions:", outputNotes, transactionRequest);

  let txResult = await client.newTransaction(sender, transactionRequest);

  await client.submitTransaction(txResult);

  return txResult.executedTransaction().id().toHex();
}
