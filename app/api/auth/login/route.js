import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

const generateAccessToken = (id) => {
    // 15 minutes short-lived access token
    return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
        expiresIn: "15m",
    });
};

const generateRefreshToken = (id) => {
    // 30 days long-lived refresh token
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret", {
        expiresIn: "30d",
    });
};

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: "Please provide an email and password" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Check for user email
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return NextResponse.json(
                { message: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { message: "Invalid credentials" },
                { status: 401 }
            );
        }

        // 1. Generate both tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // 2. Save refresh token to user document for rotation validity check
        user.refreshToken = refreshToken;
        await user.save();

        // 3. Create the response object
        const response = NextResponse.json(
            {
                _id: user.id,
                name: user.name,
                email: user.email,
                message: "Logged in successfully",
                // Notice: Not storing access token in frontend localStorage!
                // It's sent via HTTP-Only cookie, but also returned here if frontend needs to decode it (e.g., getting user ID without another request).
                accessToken: accessToken,
            },
            { status: 200 }
        );

        const isProduction = process.env.NODE_ENV === "production";

        // 4. Set both tokens in HttpOnly cookies securely
        response.cookies.set({
            name: "accessToken",
            value: accessToken,
            httpOnly: true, // Prevents XSS script from accessing it
            secure: isProduction, // HTTPS only in production
            sameSite: "strict", // Protects against CSRF
            maxAge: 15 * 60, // 15 minutes
            path: "/",
        });

        response.cookies.set({
            name: "refreshToken",
            value: refreshToken,
            httpOnly: true,
            secure: isProduction,
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: "/",
        });

        return response;

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json(
            { message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}
