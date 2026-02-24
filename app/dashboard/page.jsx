"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const router = useRouter();

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const res = await fetch("/api/notes");
            if (res.status === 401) {
                // Not authorized, redirect to login
                router.push("/login");
                return;
            }

            if (!res.ok) throw new Error("Failed to fetch notes");

            const data = await res.json();
            setNotes(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        // In a real app with cookies, we'd have a logout endpoint that clears the cookie.
        // For now, removing the token cookie client-side or redirecting.
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push("/login");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !content) return;

        try {
            const method = editingId ? "PUT" : "POST";
            const url = editingId ? `/api/notes/${editingId}` : "/api/notes";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content }),
            });

            if (!res.ok) throw new Error("Failed to save note");

            setTitle("");
            setContent("");
            setEditingId(null);
            fetchNotes(); // Refresh list
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEdit = (note) => {
        setTitle(note.title);
        setContent(note.content);
        setEditingId(note._id);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this note?")) return;

        try {
            const res = await fetch(`/api/notes/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete note");

            fetchNotes(); // Refresh list
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center p-4">Loading Dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="mx-auto max-w-4xl">
                <header className="mb-8 flex items-center justify-between rounded-xl bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-800">My Notes Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-200"
                    >
                        Logout
                    </button>
                </header>

                {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">
                        {error}
                    </div>
                )}

                <div className="grid gap-8 md:grid-cols-3">
                    {/* Note Form */}
                    <div className="md:col-span-1 rounded-xl bg-white p-6 shadow-sm h-fit">
                        <h2 className="mb-4 text-xl font-semibold text-gray-800">
                            {editingId ? "Edit Note" : "Create Note"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="Note title"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Content</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                                    placeholder="What's on your mind?"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 rounded-lg bg-blue-600 p-3 font-semibold text-white transition-colors hover:bg-blue-700"
                                >
                                    {editingId ? "Update Note" : "Save Note"}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setTitle("");
                                            setContent("");
                                        }}
                                        className="rounded-lg bg-gray-200 px-4 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Notes List */}
                    <div className="md:col-span-2 space-y-4">
                        {notes.length === 0 ? (
                            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
                                No notes found. Create your first note!
                            </div>
                        ) : (
                            notes.map((note) => (
                                <div key={note._id} className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                                    <div className="mb-4 flex items-start justify-between">
                                        <h3 className="text-xl font-bold text-gray-800">{note.title}</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(note)}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(note._id)}
                                                className="text-sm font-medium text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <p className="whitespace-pre-wrap text-gray-600">{note.content}</p>
                                    <p className="mt-4 text-xs text-gray-400">
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
