import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
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

        // Set cookie using Next.js Response cookies
        const token = generateToken(user._id);

        // We return the response and set the cookie in the headers
        const response = NextResponse.json(
            {
                _id: user.id,
                name: user.name,
                email: user.email,
                message: "Logged in successfully",
                token: token, // Optionally send to client too, but cookie is better
            },
            { status: 200 }
        );

        // Set the cookie
        response.cookies.set({
            name: "token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
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
