import type { EscrowDepositIntent } from "@dotwars/shared";
import { getApiUrl, readJson } from "../game/apiUrl";

export async function fetchDepositIntent(roomId: string): Promise<EscrowDepositIntent> {
  const response = await fetch(`${getApiUrl()}/escrow/deposit/${encodeURIComponent(roomId)}`);
  return readJson<EscrowDepositIntent>(response);
}

export async function sendEscrowDeposit(
  sendTransaction: (tx: {
    validUntil: number;
    messages: { address: string; amount: string; payload: string }[];
  }) => Promise<unknown>,
  intent: EscrowDepositIntent,
) {
  await sendTransaction({
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [
      {
        address: intent.to,
        amount: intent.amount,
        payload: intent.payload,
      },
    ],
  });
}
