import { apiClient } from "./client";

export const uploadApi = {
  // `folder` maps to Cloudinary's destination folder — always send it as
  // "folderName" to match what POST /api/upload actually reads from the
  // multipart body.
  uploadImage: async (file: File, folder = "uploads"): Promise<{ url: string; width?: number; height?: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderName", folder);
    return apiClient.post("/api/upload", formData);
  },
};
