// Client-side only Miden SDK wrapper
let isInitialized = false;
let webClientModule: any = null;
let sdkModule: any = null;

export async function initializeMidenSDK() {
  if (isInitialized) return;

  // Ensure we're on the client side
  if (typeof window === "undefined") {
    throw new Error("Miden SDK can only be used on the client side");
  }

  try {
    // Dynamic imports to avoid SSR issues
    webClientModule = await import("./webClient");
    sdkModule = await import("@demox-labs/miden-sdk");
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize Miden SDK:", error);
    throw error;
  }
}

// Helper function to ensure client-side execution
function ensureClientSide() {
  if (typeof window === "undefined") {
    throw new Error("This function can only be called on the client side");
  }
}

export async function getAccountAssets(accountId: any) {
  ensureClientSide();
  await initializeMidenSDK();
  return webClientModule.getAccountAssets(accountId);
}

export async function batchTransfer(
  sender: any,
  request: any,
  isPrivate: boolean = false
) {
  ensureClientSide();
  await initializeMidenSDK();
  return webClientModule.batchTransfer(sender, request, isPrivate);
}

export async function consumeAllNotes(noteIds: string[], accountId: string) {
  ensureClientSide();
  await initializeMidenSDK();
  return webClientModule.consumeAllNotes(noteIds, accountId);
}

export async function mintToken(
  accountId: string,
  faucetId: string,
  amount: number
) {
  ensureClientSide();
  await initializeMidenSDK();
  return webClientModule.mintToken(accountId, faucetId, amount);
}

export async function deployAccount(isPublic: boolean) {
  ensureClientSide();
  await initializeMidenSDK();
  return webClientModule.deployAccount(isPublic);
}

export async function deployFaucet(
  symbol: string,
  decimals: number,
  maxSupply: number
) {
  ensureClientSide();
  await initializeMidenSDK();
  return webClientModule.deployFaucet(symbol, decimals, maxSupply);
}

export async function getAccountId() {
  ensureClientSide();
  await initializeMidenSDK();
  if (!sdkModule) {
    throw new Error("Miden SDK not initialized");
  }
  return sdkModule.AccountId;
}
