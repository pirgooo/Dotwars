import { Address, toNano } from "@ton/core";
import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";
import { TonClient, WalletContractV4 } from "@ton/ton";
import { DotWarsEscrow } from "../generated/DotWarsEscrow_DotWarsEscrow";

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function words(mnemonic: string): string[] {
  return mnemonic.split(/\s+/).filter(Boolean);
}

function client() {
  return new TonClient({
    endpoint: env("TON_ENDPOINT") || "https://toncenter.com/api/v2/jsonRPC",
    apiKey: env("TON_API_KEY") || undefined,
  });
}

function friendly(address: Address) {
  return address.toString({ bounceable: true, urlSafe: true });
}

async function oracleFromMnemonic(mnemonic: string) {
  const keys = await mnemonicToPrivateKey(words(mnemonic));
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keys.publicKey });
  return { keys, wallet };
}

async function genOracle() {
  const mnemonic = await mnemonicNew(24);
  const { wallet } = await oracleFromMnemonic(mnemonic.join(" "));
  console.log("Wallet v4R2 (oracle)");
  console.log(`address: ${friendly(wallet.address)}`);
  console.log(`mnemonic: ${mnemonic.join(" ")}`);
  console.log("");
  console.log("Save the mnemonic offline. Send 1–2 TON to this address for deploy + gas.");
  console.log("Do not commit it. Do not paste the words in chat.");
}

async function showAddress() {
  const mnemonic = env("ORACLE_MNEMONIC");
  if (words(mnemonic).length < 12) {
    throw new Error("Set ORACLE_MNEMONIC");
  }
  const { wallet } = await oracleFromMnemonic(mnemonic);
  console.log(friendly(wallet.address));
}

async function deploy() {
  const mnemonic = env("ORACLE_MNEMONIC");
  const treasuryRaw = env("TREASURY_ADDRESS");
  if (words(mnemonic).length < 12) {
    throw new Error("Set ORACLE_MNEMONIC");
  }
  if (!treasuryRaw) {
    throw new Error("Set TREASURY_ADDRESS");
  }
  const treasury = Address.parse(treasuryRaw);
  const { keys, wallet } = await oracleFromMnemonic(mnemonic);
  const ton = client();
  const openedWallet = ton.open(wallet);
  const contract = await DotWarsEscrow.fromInit(wallet.address, treasury);
  console.log(`oracle:    ${friendly(wallet.address)}`);
  console.log(`treasury:  ${friendly(treasury)}`);
  console.log(`contract:  ${friendly(contract.address)}`);

  const state = await ton.getContractState(contract.address);
  if (state.state === "active") {
    console.log("Already deployed. Put this in server env as ESCROW_CONTRACT.");
    return;
  }

  const balance = await openedWallet.getBalance();
  if (balance < toNano("0.4")) {
    throw new Error(`Oracle needs ~0.4 TON for deploy, has ${Number(balance) / 1e9} TON`);
  }

  const openedContract = ton.open(contract);
  await openedContract.send(
    openedWallet.sender(keys.secretKey),
    { value: toNano("0.25") },
    { $$type: "Deploy", queryId: 0n },
  );
  console.log("Deploy sent. Wait ~15s, then set on the VPS:");
  console.log(`ESCROW_CONTRACT=${friendly(contract.address)}`);
  console.log(`ORACLE_WALLET=${friendly(wallet.address)}`);
}

const command = process.argv[2];
void (async () => {
  if (command === "gen-oracle") {
    await genOracle();
    return;
  }
  if (command === "address") {
    await showAddress();
    return;
  }
  if (command === "deploy") {
    await deploy();
    return;
  }
  console.log("Usage: tsx scripts/wallet.ts gen-oracle | address | deploy");
  process.exitCode = 1;
})().catch((reason) => {
  console.error(reason instanceof Error ? reason.message : reason);
  process.exitCode = 1;
});
