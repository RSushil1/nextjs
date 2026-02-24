import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import User from "@/models/User";

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
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return { error: "User not found", status: 401 };
        }

        return { user };
    } catch (error) {
        return { error: "Not authorized, token failed", status: 401 };
    }
}

// UPDATE a specific note
export async function PUT(req, { params }) {
    const auth = await authenticateUser(req);
    if (auth.error) {
        return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    try {
        const { id } = await params;
        const { title, content } = await req.json();

        const note = await Note.findById(id);

        if (!note) {
            return NextResponse.json({ message: "Note not found" }, { status: 404 });
        }

        // Make sure the logged-in user matches the note user
        if (note.user.toString() !== auth.user._id.toString()) {
            return NextResponse.json({ message: "Not authorized" }, { status: 401 });
        }

        const updatedNote = await Note.findByIdAndUpdate(
            id,
            { title, content },
            { new: true } // Returns the updated document
        );

        return NextResponse.json(updatedNote, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

// DELETE a specific note
export async function DELETE(req, { params }) {
    const auth = await authenticateUser(req);
    if (auth.error) {
        return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    try {
        const { id } = await params;
        const note = await Note.findById(id);

        if (!note) {
            return NextResponse.json({ message: "Note not found" }, { status: 404 });
        }

        // Make sure the logged-in user matches the note user
        if (note.user.toString() !== auth.user._id.toString()) {
            return NextResponse.json({ message: "Not authorized" }, { status: 401 });
        }

        await note.deleteOne();

        return NextResponse.json({ id }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
