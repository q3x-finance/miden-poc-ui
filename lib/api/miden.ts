import { Note } from "@demox-labs/miden-sdk";
import api from "./index";

export const storeSerializedNote = async (serializedNote: Note) => {
  const response = await api.post(`/miden/note`, { serializedNote });
  return response.data;
};
