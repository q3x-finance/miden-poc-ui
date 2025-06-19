import toast from "react-hot-toast";

export async function buildP2IDNote(
  sender: any,
  receiver: any,
  faucet: any,
  amount: number,
  noteType: any
) {
  const {
    AccountId,
    FungibleAsset,
    OutputNote,
    Note,
    NoteAssets,
    NoteType: NoteTypeEnum,
    Word,
    Felt,
  } = await import("@demox-labs/miden-sdk");

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
