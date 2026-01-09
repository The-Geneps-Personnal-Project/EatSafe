import { Share } from "react-native";
import * as Clipboard from "expo-clipboard";

export async function shareLink(url: string, title: string, message?: string) {
  await Share.share({
    message: message ?? url,
    url,
    title,
  });
}

export async function copyText(text: string) {
  await Clipboard.setStringAsync(text);
}
