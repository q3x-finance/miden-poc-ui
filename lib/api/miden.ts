import api from "./index";

export const storeSerializedNote = async (serializedNote: any) => {
  const response = await api.post(`/miden/note`, { serializedNote });
  return response.data;
};
