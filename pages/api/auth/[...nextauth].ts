import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verify } from "bcryptjs";
import { neon } from "@neondatabase/serverless";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const sql = neon(process.env.DATABASE_URL || "");
          
          // Find user by username
          const userQuery = `
            SELECT * FROM users
            WHERE username = '${credentials.username}'
            LIMIT 1
          `;
          
          const users = await sql(userQuery);
          const user = users[0];
          
          if (!user) {
            return null;
          }

          // Verify password
          const isValidPassword = await verify(
            credentials.password,
            user.passwordHash
          );

          if (!isValidPassword) {
            return null;
          }

          // Return user data
          return {
            id: user.id,
            name: user.username,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "your-fallback-secret-should-be-replaced",
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);