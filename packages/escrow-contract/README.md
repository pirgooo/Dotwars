# Dot Wars escrow (non-custodial)

TON contract. Stakes sit in the contract, not in a house wallet. The game server is only an **oracle**: it may open a match, set the guest, settle to host/guest/draw, or refund **before lock**. It cannot send the pot to itself — only to the two depositors and the treasury rake.

Rake is paid by the contract to `treasury` on settle.

## Deploy

```bash
npm install
npm run build -w @dotwars/escrow-contract
```

Deploy `generated/DotWarsEscrow_DotWarsEscrow.*` with Wallet v4R2:

- `oracle` = the server signer (`ORACLE_WALLET`)
- `treasury` = rake address (`TREASURY_ADDRESS`)

Then set on the VPS:

```
ESCROW_CONTRACT=EQ...
ORACLE_MNEMONIC="..."
ORACLE_WALLET=EQ...
```
