import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center">
      <div className="text-center max-w-2xl px-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600 mb-6">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Customer support for indie SaaS
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Zendesk/Intercom at $9/mo. Email inbox, live chat widget, and AI auto-responses.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-violet-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-violet-700 transition"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 transition"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
