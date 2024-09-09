// import {
//   Keypair,
//   LAMPORTS_PER_SOL,
//   SystemProgram,
//   Transaction,
//   PublicKey,
//   sendAndConfirmTransaction,
//   Connection,
// } from "@solana/web3.js";
// import base58 from "bs58";

// const connection = new Connection(
//   "https://solana-devnet.g.alchemy.com/v2/faPrLSt5dkOBJ8qCqrRh4HC7wmiIt4jk"
// );

// export async function sendSol(to: string, amount: string) {
//   // Send out user some sol
//   const keypair = Keypair.fromSecretKey(
//     base58.decode(process.env.SOLANA_PRIVATE_KEY ?? "")
//   );
//   const transferTransaction = new Transaction().add(
//     SystemProgram.transfer({
//       fromPubkey: keypair.publicKey,
//       toPubkey: new PublicKey(to),
//       lamports: parseFloat(amount) * LAMPORTS_PER_SOL, // 0.1 SOL = 10^8 LAMPORTS_PER_SOL
//     })
//   );

//   await sendAndConfirmTransaction(connection, transferTransaction, [keypair]);
//   console.log("Solana has sent");
// }

import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  PublicKey,
  sendAndConfirmTransaction,
  Connection,
} from "@solana/web3.js";
import base58 from "bs58";

const connection = new Connection("https://api.devnet.solana.com", "finalized");

export async function sendSol(to: string, amount: string) {
  // Decode the private key from the environment variable
  const secretKey = process.env.SOL_PRIVATE_KEY ?? "";
  const secretKeyBytes = base58.decode(secretKey);

  // Check if the decoded key is of the correct length
  if (secretKeyBytes.length !== 64) {
    throw new Error(
      `Invalid secret key length: expected 64 bytes, got ${secretKeyBytes.length} bytes. Check your SOLANA_PRIVATE_KEY value.`
    );
  }

  // Create a keypair from the secret key bytes
  const keypair = Keypair.fromSecretKey(secretKeyBytes);

  // Prepare and send the transaction
  const transferTransaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new PublicKey(to),
      lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
    })
  );

  await sendAndConfirmTransaction(connection, transferTransaction, [keypair]);
  console.log("Solana has been sent successfully.");
}
