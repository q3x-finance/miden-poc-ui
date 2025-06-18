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
import { WebClient } from "@demox-labs/miden-sdk";

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

export async function serializeNote(
  note: Note,
  client: WebClient
): Promise<string> {
  // Use the WebClient's exportNote method to serialize the note
  const noteId = note.id().toString();
  const serialized = await client.exportNote(noteId, "base64");
  return serialized;
}

export async function deserializeNote(
  encoded: string,
  client: WebClient
): Promise<Note> {
  // Use the WebClient's importNote method to deserialize the note
  const note = await client.importNote(encoded);
  return note;
}
