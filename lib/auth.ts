import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";
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

                // Fetch the user from Supabase admin_users table
                const { data: user, error } = await supabase
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
                    name: user.role, // Or add a name field to the DB if preferred
                };
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 Days
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
