import Link from "next/link";

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <main className="text-center">
                <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900">
                    Next.js Fullstack App
                </h1>
                <p className="mx-auto mb-8 max-w-lg text-lg text-gray-600">
                    Learn how to build a complete application with authentication, MongoDB, and Next.js App Router.
                </p>

                <div className="flex justify-center gap-4">
                    <Link
                        href="/login"
                        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                        Log In
                    </Link>
                    <Link
                        href="/signup"
                        className="rounded-lg bg-white px-6 py-3 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50"
                    >
                        Sign Up
                    </Link>
                </div>
            </main>
        </div>
    );
}
