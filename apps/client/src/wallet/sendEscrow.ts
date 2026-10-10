import type { EscrowDepositIntent } from "@dotwars/shared";
import { getApiUrl } from "../game/apiUrl";

export async function fetchDepositIntent(roomId: string): Promise<EscrowDepositIntent> {
  const response = await fetch(`${getApiUrl()}/escrow/deposit/${encodeURIComponent(roomId)}`);
  const data = (await response.json()) as EscrowDepositIntent & { message?: string | string[] };
  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new Error(message || "Could not build deposit");
  }
  return data;
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
