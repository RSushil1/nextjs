import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
    try {
        // 1. Get the refresh token from httpOnly cookies
        const refreshTokenCookie = req.cookies.get("refreshToken");

        if (!refreshTokenCookie || !refreshTokenCookie.value) {
            return NextResponse.json(
                { message: "No refresh token provided" },
                { status: 401 }
            );
        }

        const refreshToken = refreshTokenCookie.value;

        // 2. Verify the refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret");
        } catch (err) {
            return NextResponse.json(
                { message: "Invalid or expired refresh token" },
                { status: 403 }
            );
        }

        await connectToDatabase();

        // 3. Find user and verify the token matches the one in DB (Rotation/Revocation security)
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return NextResponse.json(
                { message: "Refresh token is invalid or has been revoked" },
                { status: 403 }
            );
        }

        // 4. Generate new tokens (Refresh Token Rotation)
        const newAccessToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || "fallback_secret",
            { expiresIn: "15m" }
        );

        const newRefreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret",
            { expiresIn: "30d" }
        );

        // 5. Save the new refresh token in DB
        user.refreshToken = newRefreshToken;
        await user.save();

        const response = NextResponse.json(
            {
                message: "Tokens refreshed successfully",
                accessToken: newAccessToken,
            },
            { status: 200 }
        );

        const isProduction = process.env.NODE_ENV === "production";

        // 6. Set new cookies
        response.cookies.set({
            name: "accessToken",
            value: newAccessToken,
            httpOnly: true,
            secure: isProduction,
            sameSite: "strict",
            maxAge: 15 * 60, // 15 mins
            path: "/",
        });

        response.cookies.set({
            name: "refreshToken",
            value: newRefreshToken,
            httpOnly: true,
            secure: isProduction,
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: "/",
        });

        return response;

    } catch (error) {
        console.error("Refresh Token Error:", error);
        return NextResponse.json(
            { message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}
