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
                console.log("Auth Attempt:", credentials?.email);

                if (!credentials?.email || !credentials?.password) {
                    console.log("Auth Fail: Missing credentials");
                    return null;
                }

                try {
                    // Fetch the user from Supabase admin_users table using SERVICE_ROLE
                    const { data: user, error } = await supabaseServer
                        .from("admin_users")
                        .select("*")
                        .eq("email", credentials.email)
                        .single();

                    if (error) {
                        console.error("Supabase Auth Error:", error.message);
                        return null;
                    }

                    if (!user) {
                        console.log("Auth Fail: User not found in database:", credentials.email);
                        return null;
                    }

                    console.log("User found, comparing passwords...");

                    // Verify the password hash using bcrypt
                    const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);

                    if (!isPasswordValid) {
                        console.log("Auth Fail: Password mismatch for:", credentials.email);
                        return null;
                    }

                    console.log("Auth Success:", user.email);

                    // Return user object
                    return {
                        id: user.id.toString(),
                        email: user.email,
                        name: user.role,
                        role: user.role,
                    };
                } catch (err: any) {
                    console.error("JWT Authorize Exception:", err.message);
                    return null;
                }
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
