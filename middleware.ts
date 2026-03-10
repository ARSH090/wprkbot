import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        // Match all routes except login, auth APIs, public files, and webhook test
        "/((?!login|api/auth|api/facebook|_next/static|_next/image|favicon.ico).*)",
    ],
};
