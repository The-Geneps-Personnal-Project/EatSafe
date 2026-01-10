export type RootStackParamList = {
  Map: { focusSiret?: string; focusSirets?: string[] } | undefined;
  Bookmarks: undefined;
  Visited: undefined;
  Settings: undefined;
  Lists: { pickForSiret?: string } | undefined;
  Selected: undefined;
  List: { listId: number; name: string };
  Restaurant: { publicId?: string; siret?: string };
  Auth: { mode?: "login" | "signup" } | undefined;
};
