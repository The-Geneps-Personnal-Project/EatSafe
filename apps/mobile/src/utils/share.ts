import { Share } from "react-native";

export async function shareLink(url: string, title: string) {
  await Share.share({
    message: url,
    url,
    title,
  });
}
