/** @format */

import * as FileSystem from "expo-file-system";

export const getMediaDirectory = () => {
  return `${FileSystem.documentDirectory}media/`;
};

export const ensureMediaDirectoryExists = async () => {
  const dir = getMediaDirectory();
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    console.log("Creating media directory:", dir);
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

export const saveMediaFromUrl = async (url: string, fileName: string) => {
  await ensureMediaDirectoryExists();
  const fileUri = `${getMediaDirectory()}${fileName}`;

  try {
    const { uri } = await FileSystem.downloadAsync(url, fileUri);
    console.log("Media saved to:", uri);
    return uri;
  } catch (error) {
    console.error("Error saving media from URL:", url, error);
    return null;
  }
};

export const deleteMediaFile = async (uri: string) => {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    console.log("Media file deleted:", uri);
    return true;
  } catch (error) {
    console.error("Error deleting media file:", uri, error);
    return false;
  }
};

export const getFileSize = async (uri: string) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists && fileInfo.size) {
      return fileInfo.size;
    }
    return 0;
  } catch (error) {
    console.error("Error getting file size:", uri, error);
    return 0;
  }
};
