export type RootStackParamList = {
  Map: undefined;
  Bookmarks: undefined;
  Restaurant: { publicId?: string; siret?: string };
  Auth: { mode?: "login" | "signup" } | undefined;
};
