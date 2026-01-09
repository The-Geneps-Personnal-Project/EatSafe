export type RootStackParamList = {
  Map: undefined;
  Bookmarks: undefined;
  Lists: { pickForSiret?: string } | undefined;
  List: { listId: number; name: string };
  Restaurant: { publicId?: string; siret?: string };
  Auth: { mode?: "login" | "signup" } | undefined;
};
