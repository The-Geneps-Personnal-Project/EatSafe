export type RootStackParamList = {
  Map: undefined;
  Bookmarks: undefined;
  Visited: undefined;
  Settings: undefined;
  Lists: { pickForSiret?: string } | undefined;
  List: { listId: number; name: string };
  Restaurant: { publicId?: string; siret?: string };
  Auth: { mode?: "login" | "signup" } | undefined;
};
