import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        const refreshTokenCookie = req.cookies.get("refreshToken");

        // Even if we don't have a token, we should clear cookies
        if (refreshTokenCookie && refreshTokenCookie.value) {
            try {
                const decoded = jwt.verify(
                    refreshTokenCookie.value,
                    process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret",
                    { ignoreExpiration: true } // We still want to remove it from DB even if expired
                );

                // Remove refresh token from DB to prevent replay attacks
                await connectToDatabase();
                await User.findByIdAndUpdate(decoded.id, { $unset: { refreshToken: 1 } });
            } catch (err) {
                // Ignore JWT errors during logout, main goal is to clear cookies
                console.warn("Logout warning: Could not verify token string for DB cleanup");
            }
        }

        const response = NextResponse.json(
            { message: "Logged out successfully" },
            { status: 200 }
        );

        // Clear both cookies
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");

        return response;

    } catch (error) {
        console.error("Logout Error:", error);
        return NextResponse.json(
            { message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}
