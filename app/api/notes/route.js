import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import User from "@/models/User"; // Need User model to verify relationships

// Helper function to authenticate token from cookies
async function authenticateUser(req) {
    const token = req.cookies.get("token")?.value;

    if (!token) {
        return { error: "Not authorized, no token", status: 401 };
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "fallback_secret"
        );
        await connectToDatabase();
        // Verify the user actually exists
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return { error: "User not found", status: 401 };
        }

        return { user };
    } catch (error) {
        return { error: "Not authorized, token failed", status: 401 };
    }
}

// GET all notes for the logged-in user
export async function GET(req) {
    const auth = await authenticateUser(req);
    if (auth.error) {
        return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    try {
        const notes = await Note.find({ user: auth.user._id }).sort({
            createdAt: -1,
        });
        return NextResponse.json(notes, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

// POST a new note for the logged-in user
export async function POST(req) {
    const auth = await authenticateUser(req);
    if (auth.error) {
        return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    try {
        const { title, content } = await req.json();

        if (!title || !content) {
            return NextResponse.json(
                { message: "Please add a title and content" },
                { status: 400 }
            );
        }

        const note = await Note.create({
            title,
            content,
            user: auth.user._id,
        });

        return NextResponse.json(note, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
