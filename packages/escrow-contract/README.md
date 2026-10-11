# Dot Wars escrow (non-custodial)

TON contract. Stakes sit in the contract, not in a house wallet. The game server is only an **oracle**: it may open a match, set the guest, settle to host/guest/draw, or refund **before lock**. It cannot send the pot to itself — only to the two depositors and the treasury rake.

Rake is paid by the contract to `treasury` on settle.

## Deploy

Oracle must be **Wallet v4R2** (the script creates that). Treasury is any TON address that receives rake.

```bash
npm install
npm run oracle -w @dotwars/escrow-contract
```

Save the 24 words offline. Send 1–2 TON to the printed oracle address.

```bash
# PowerShell
$env:ORACLE_MNEMONIC="word1 ... word24"
$env:TREASURY_ADDRESS="EQ..."
npm run deploy -w @dotwars/escrow-contract
```

Then on the VPS:

```
ESCROW_CONTRACT=EQ...
ORACLE_WALLET=EQ...
ORACLE_MNEMONIC="word1 ... word24"
TREASURY_ADDRESS=EQ...
```
