"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, LogOut, Loader2, BookOpen, AlertCircle, X, Check, StickyNote } from "lucide-react";

export default function DashboardPage() {
    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);

    const router = useRouter();

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const res = await fetch("/api/notes");
            if (res.status === 401) {
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
            setIsFormOpen(false);
            fetchNotes();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEdit = (note) => {
        setTitle(note.title);
        setContent(note.content);
        setEditingId(note._id);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this note?")) return;

        try {
            const res = await fetch(`/api/notes/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete note");

            fetchNotes();
        } catch (err) {
            setError(err.message);
        }
    };

    // Stagger animation for notes
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100 } },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                >
                    <Loader2 className="h-12 w-12 text-indigo-500" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050510] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))] text-neutral-200 font-sans selection:bg-indigo-500/30">
            <div className="mx-auto max-w-6xl p-6 md:p-12">

                {/* Header */}
                <motion.header
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden"
                >
                    {/* Decorative glow inside header */}
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -z-10 pointer-events-none" />

                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                            <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                            <p className="text-sm text-neutral-400 mt-1">Manage your ideas and thoughts</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setIsFormOpen(!isFormOpen);
                                if (!isFormOpen && editingId) {
                                    setEditingId(null);
                                    setTitle("");
                                    setContent("");
                                }
                            }}
                            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${isFormOpen
                                ? "bg-white/10 text-white hover:bg-white/20"
                                : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                                }`}
                        >
                            {isFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {isFormOpen ? "Close Editor" : "New Note"}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </motion.button>
                    </div>
                </motion.header>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -20 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -20 }}
                            className="mb-8 overflow-hidden rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3 text-red-400 backdrop-blur-md"
                        >
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid gap-8 lg:grid-cols-12 relative items-start">

                    {/* Note Form (Animated Panel) */}
                    <AnimatePresence mode="wait">
                        {isFormOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: -50, width: 0 }}
                                animate={{ opacity: 1, x: 0, width: "100%" }}
                                exit={{ opacity: 0, x: -50, width: 0 }}
                                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                className="lg:col-span-4"
                            >
                                <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-500" />

                                    <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
                                        {editingId ? <Edit2 className="h-5 w-5 text-purple-400" /> : <Plus className="h-5 w-5 text-indigo-400" />}
                                        {editingId ? "Edit Note" : "Create Note"}
                                    </h2>

                                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-neutral-400">Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="w-full rounded-xl bg-neutral-900/50 border border-white/10 p-3.5 text-white outline-none transition-all focus:border-indigo-500 focus:bg-neutral-900 focus:ring-1 focus:ring-indigo-500/50"
                                                placeholder="Enter a catchy title..."
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-neutral-400">Content</label>
                                            <textarea
                                                required
                                                rows={6}
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                className="w-full rounded-xl bg-neutral-900/50 border border-white/10 p-3.5 text-white outline-none transition-all focus:border-indigo-500 focus:bg-neutral-900 focus:ring-1 focus:ring-indigo-500/50 resize-none"
                                                placeholder="What's on your mind today?"
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="submit"
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
                                            >
                                                <Check className="h-4 w-4" />
                                                {editingId ? "Update Note" : "Save Note"}
                                            </motion.button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Notes Grid */}
                    <motion.div
                        layout
                        className={`${isFormOpen ? "lg:col-span-8" : "lg:col-span-12"} transition-all duration-500`}
                    >
                        {notes.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 py-24 px-6 text-center backdrop-blur-sm"
                            >
                                <div className="mb-4 rounded-full bg-white/5 p-4">
                                    <StickyNote className="h-8 w-8 text-neutral-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">No notes yet</h3>
                                <p className="text-neutral-400 max-w-sm">Tap the "New Note" button to capture your first idea. It will magically appear right here.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className={`grid gap-6 ${isFormOpen ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}
                            >
                                <AnimatePresence>
                                    {notes.map((note) => (
                                        <motion.div
                                            key={note._id}
                                            layout
                                            variants={itemVariants}
                                            whileHover={{
                                                scale: 1.03,
                                                rotateX: 2,
                                                rotateY: -2,
                                                z: 20
                                            }}
                                            style={{ perspective: 1000, transformStyle: "preserve-3d" }}
                                            className="group cursor-pointer"
                                        >
                                            <div className="h-full rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col backdrop-blur-xl shadow-lg transition-all duration-300 group-hover:bg-white/10 group-hover:border-indigo-500/30 group-hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] relative overflow-hidden">

                                                {/* 3D glowing orb inside card */}
                                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                                <div className="mb-4 flex items-start justify-between relative z-10">
                                                    <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 pr-4">{note.title}</h3>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900/50 backdrop-blur-md rounded-lg p-1 border border-white/10">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1, backgroundColor: "rgba(99, 102, 241, 0.2)" }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(note); }}
                                                            className="p-1.5 rounded-md text-indigo-400 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(note._id); }}
                                                            className="p-1.5 rounded-md text-red-400 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </motion.button>
                                                    </div>
                                                </div>

                                                <div className="flex-1 relative z-10">
                                                    <p className="text-neutral-400 text-sm leading-relaxed line-clamp-5 whitespace-pre-wrap">
                                                        {note.content}
                                                    </p>
                                                </div>

                                                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-500 flex items-center justify-center text-[10px] font-bold text-white to-purple-500">
                                                            {note.title.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-xs font-medium text-neutral-500">
                                                            {new Date(note.createdAt).toLocaleDateString(undefined, {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
