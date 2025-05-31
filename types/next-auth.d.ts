import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's ID */
      id?: string;
      /** The user's role */
      role?: string;
      /** The user's medical number */
      medicalNumber?: string;
    } & DefaultSession["user"];
  }

  interface User {
    /** The user's role */
    role?: string;
    /** The user's medical number */
    medicalNumber?: string;
  }
}
