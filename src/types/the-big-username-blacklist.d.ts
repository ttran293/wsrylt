declare module "the-big-username-blacklist" {
  const usernameBlacklist: {
    validate(username: string): boolean;
    list: string[];
  };

  export const validate: (username: string) => boolean;
  export const list: string[];
  export default usernameBlacklist;
}
