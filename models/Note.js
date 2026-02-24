import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Please provide a title for the note"],
            trim: true,
            maxlength: [100, "Title cannot be more than 100 characters"],
        },
        content: {
            type: String,
            required: [true, "Please provide some content for the note"],
            maxlength: [1000, "Content cannot be more than 1000 characters"],
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.models.Note || mongoose.model("Note", NoteSchema);
