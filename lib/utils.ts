import {
  AccountId,
  FungibleAsset,
  OutputNote,
  Note,
  NoteAssets,
  NoteType,
  Word,
  Felt,
} from "@demox-labs/miden-sdk";
import toast from "react-hot-toast";

export function buildP2IDNote(
  sender: AccountId,
  receiver: AccountId,
  faucet: AccountId,
  amount: number,
  noteType: NoteType = NoteType.Public
) {
  return OutputNote.full(
    Note.createP2IDNote(
      sender,
      receiver,
      new NoteAssets([new FungibleAsset(faucet, BigInt(amount))]),
      noteType,
      Word.newFromFelts([
        new Felt(BigInt(1)),
        new Felt(BigInt(2)),
        new Felt(BigInt(3)),
        new Felt(BigInt(4)),
      ]),
      new Felt(BigInt(0))
    )
  );
}
