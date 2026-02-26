import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Protect these routes
const protectedRoutes = ["/dashboard", "/profile", "/settings"];

export async function proxy(req) {
    const path = req.nextUrl.pathname;

    // Check if path starts with any protected route
    const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));

    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    // Attempt to get token from header or cookie
    const authHeader = req.headers.get("authorization");
    let token = authHeader?.split(" ")[1];

    if (!token) {
        const cookieToken = req.cookies.get("accessToken");
        if (cookieToken) token = cookieToken.value;
    }

    if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
        // Verify token using `jose` instead of `jsonwebtoken`
        // jsonwebtoken does not run on Next.js Edge Runtime (which Middleware uses).
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret");
        await jwtVerify(token, secret);

        return NextResponse.next();
    } catch (error) {
        console.error("Middleware Auth Error:", error.message);
        // Token is invalid or expired
        return NextResponse.redirect(new URL("/login", req.url));
    }
}

// Ensure middleware only runs on necessary routes to optimize performance
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
