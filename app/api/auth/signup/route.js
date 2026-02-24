import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Please fill all fields" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Check if user already exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        if (user) {
            return NextResponse.json(
                {
                    _id: user.id,
                    name: user.name,
                    email: user.email,
                    message: "User registered successfully",
                },
                { status: 201 }
            );
        } else {
            return NextResponse.json(
                { message: "Invalid user data" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Signup Error:", error);

        // Handle Mongoose validation errors gracefully
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map(val => val.message);
            return NextResponse.json(
                { message: messages[0] || "Validation Error" },
                { status: 400 }
            );
        }

        // Handle other Mongoose duplicate key errors
        if (error.code === 11000) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}
