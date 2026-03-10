import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseServer } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "admin@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Fetch the user from Supabase admin_users table using SERVICE_ROLE
                const { data: user, error } = await supabaseServer
                    .from("admin_users")
                    .select("*")
                    .eq("email", credentials.email)
                    .single();

                if (error || !user) {
                    console.error("Auth error:", error);
                    return null;
                }

                // Verify the password hash using bcrypt
                const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);

                if (!isPasswordValid) {
                    return null;
                }

                // Return user object
                return {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.role, // Using 'name' to store the role temporarily
                    role: user.role, // Custom field
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 Days
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
