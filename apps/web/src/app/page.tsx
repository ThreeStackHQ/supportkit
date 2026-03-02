import type { Metadata } from "next";
import Link from "next/link";
import {
  Headphones,
  Inbox,
  Sparkles,
  MessageSquare,
  Users,
  BarChart3,
  CreditCard,
  CheckCircle,
  Star,
  ArrowRight,
  Zap,
  Code2,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "SupportKit — Customer Support for Indie SaaS",
  description:
    "Zendesk-level support tools at $9/mo. Email tickets, AI draft replies, and a live chat widget — all in one dashboard for indie SaaS teams.",
  keywords: [
    "customer support",
    "help desk",
    "indie saas",
    "zendesk alternative",
    "intercom alternative",
    "live chat",
    "ai support",
    "ticket inbox",
  ],
  openGraph: {
    title: "SupportKit — Customer Support for Indie SaaS",
    description:
      "Zendesk-level support tools at $9/mo. Email tickets, AI draft replies, and a live chat widget.",
    url: "https://supportkit.threestack.io",
    siteName: "SupportKit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SupportKit — Customer Support for Indie SaaS",
    description: "Zendesk-level support tools at $9/mo for indie SaaS.",
  },
};

const features = [
  {
    icon: Inbox,
    title: "Unified Inbox",
    desc: "Email and live chat in one place. Never miss a message — from any channel.",
  },
  {
    icon: Sparkles,
    title: "AI Draft Replies",
    desc: "GPT-4o-mini reads the ticket and writes your first reply. Edit or send instantly.",
  },
  {
    icon: MessageSquare,
    title: "Live Chat Widget",
    desc: "1 line of JS, live in 60 seconds. Fully customisable, no-cookie, GDPR-safe.",
  },
  {
    icon: Users,
    title: "Contact Timeline",
    desc: "See every interaction a contact has ever had — emails, chats, and notes.",
  },
  {
    icon: BarChart3,
    title: "Status Tracking",
    desc: "Open → Pending → Resolved. Filter your inbox by status and close faster.",
  },
  {
    icon: CreditCard,
    title: "Stripe Billing",
    desc: "Built-in billing so you can start charging (or stay on the free tier forever).",
  },
];

const steps = [
  {
    num: "01",
    icon: Code2,
    title: "Embed the widget",
    desc: "1 line of JS, live in 60 seconds. Paste it before your closing </body> tag.",
    code: `<script src="https://cdn.supportkit.io/widget.js"\n  data-key="YOUR_KEY"></script>`,
  },
  {
    num: "02",
    icon: Mail,
    title: "Tickets appear",
    desc: "Email + chat arrive in one unified inbox. Contact info auto-attached.",
    code: null,
  },
  {
    num: "03",
    icon: Sparkles,
    title: "Reply with AI",
    desc: "Hit 'AI Draft' and GPT-4o-mini writes your first reply. Send or tweak.",
    code: null,
  },
];

const testimonials = [
  {
    name: "Priya K.",
    role: "Founder @ Logly.so",
    text: "Replaced a $55/mo Zendesk plan on day 1. The AI drafts alone save me 2 hours a week. Easily the best $9 I spend.",
    stars: 5,
  },
  {
    name: "Marcus T.",
    role: "Solo dev, NoteSync",
    text: "Setup took 8 minutes. Email tickets, widget, everything just worked. My customers finally have a real support channel.",
    stars: 5,
  },
  {
    name: "Amelia R.",
    role: "Indie maker, FormFlow",
    text: "Love that it's indie-made for indie teams. The contact timeline is underrated — I know exactly what each user has asked before.",
    stars: 5,
  },
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: false,
    features: [
      "1 workspace",
      "50 tickets / month",
      "Email channel only",
      "Contact timeline",
      "Community support",
    ],
    cta: "Start Free",
    href: "/signup",
  },
  {
    name: "Indie",
    price: "$9",
    period: "/ month",
    highlight: true,
    features: [
      "Unlimited tickets",
      "50 AI drafts / month",
      "Email + chat widget",
      "Contact timeline",
      "Status tracking",
      "Email support",
    ],
    cta: "Start Free →",
    href: "/signup",
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ month",
    highlight: false,
    features: [
      "Multiple workspaces",
      "Unlimited AI drafts",
      "Everything in Indie",
      "API access",
      "Priority support",
      "Custom branding",
    ],
    cta: "Get Pro",
    href: "/signup",
  },
];

const competitors = [
  { name: "SupportKit", price: "$9/mo", ai: true, chat: true, email: true },
  { name: "Zendesk", price: "$55+/mo", ai: false, chat: true, email: true },
  { name: "Intercom", price: "$74+/mo", ai: true, chat: true, email: true },
  { name: "Freshdesk", price: "$19/mo", ai: false, chat: false, email: true },
];

function CheckIcon() {
  return <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
}

function XIcon() {
  return (
    <svg className="w-4 h-4 text-gray-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f0f0f]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">SupportKit</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {["Features", "Pricing", "Docs"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-sm text-gray-400 hover:text-white transition"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Violet glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/15 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-600/15 border border-violet-500/30 text-violet-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
            <Zap className="w-3.5 h-3.5" />
            Now with GPT-4o-mini AI draft replies
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Customer Support That<br />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Doesn&apos;t Cost a Fortune
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            SupportKit gives indie SaaS teams Zendesk-level support tools at{" "}
            <span className="text-white font-semibold">$9/mo</span>. Email tickets,
            AI drafts, live chat widget — all in one.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-7 py-3.5 rounded-xl transition text-base shadow-lg shadow-violet-600/25"
            >
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 text-white font-medium px-7 py-3.5 rounded-xl border border-white/15 transition text-base"
            >
              View Demo
            </Link>
          </div>

          <p className="mt-5 text-sm text-gray-600">No credit card required · Setup in 8 minutes</p>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-white/10 bg-white/3">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Teams using SupportKit" },
              { value: "<1hr", label: "Avg first response time" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "$9/mo", label: "vs $55+ Zendesk" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            From zero to live support in under 10 minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative bg-white/4 border border-white/10 rounded-2xl p-7 hover:border-violet-500/40 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl font-black text-violet-600/30 leading-none font-mono">
                  {step.num}
                </span>
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center">
                  <step.icon className="w-4.5 h-4.5 text-violet-400" />
                </div>
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{step.desc}</p>
              {step.code && (
                <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                  <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap break-all">
                    {step.code}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="bg-white/2 border-y border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Built for solo founders and small teams who want real support tooling without the enterprise price tag.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white/4 border border-white/10 rounded-2xl p-6 hover:border-violet-500/40 hover:bg-white/6 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple Pricing</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            No hidden fees. No per-seat nonsense. Pick a plan and go.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {pricing.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-7 border transition-all ${
                plan.highlight
                  ? "bg-violet-600/15 border-violet-500 shadow-xl shadow-violet-600/20"
                  : "bg-white/4 border-white/10 hover:border-white/20"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-400 mb-2">{plan.name}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm mb-1">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-violet-600 hover:bg-violet-500 text-white"
                    : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Competitor comparison table */}
        <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="font-semibold text-white">How we stack up</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-3 text-left text-gray-400 font-medium">Tool</th>
                  <th className="px-6 py-3 text-center text-gray-400 font-medium">Price</th>
                  <th className="px-6 py-3 text-center text-gray-400 font-medium">AI Drafts</th>
                  <th className="px-6 py-3 text-center text-gray-400 font-medium">Chat Widget</th>
                  <th className="px-6 py-3 text-center text-gray-400 font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => (
                  <tr
                    key={c.name}
                    className={`border-b border-white/5 last:border-0 ${
                      i === 0 ? "bg-violet-600/10" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      {i === 0 ? (
                        <span className="flex items-center gap-2">
                          {c.name}
                          <span className="text-xs bg-violet-600 text-white px-1.5 py-0.5 rounded font-bold">
                            US
                          </span>
                        </span>
                      ) : (
                        c.name
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-300">{c.price}</td>
                    <td className="px-6 py-4 text-center flex justify-center">{c.ai ? <CheckIcon /> : <XIcon />}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">{c.chat ? <CheckIcon /> : <XIcon />}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">{c.email ? <CheckIcon /> : <XIcon />}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-white/2 border-y border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Indie makers love it</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white/4 border border-white/10 rounded-2xl p-6 hover:border-violet-500/30 transition-colors"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-600 p-16 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Start for Free Today
            </h2>
            <p className="text-violet-200 text-lg max-w-xl mx-auto mb-8">
              No credit card. No setup fee. Be live in 8 minutes.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-violet-700 font-bold px-8 py-4 rounded-xl hover:bg-violet-50 transition text-base shadow-xl"
            >
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <Headphones className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-white">SupportKit</span>
            </Link>

            <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              {["Features", "Pricing", "Docs", "Login", "Sign Up"].map((l) => (
                <Link
                  key={l}
                  href={l === "Login" ? "/login" : l === "Sign Up" ? "/signup" : `#${l.toLowerCase()}`}
                  className="hover:text-white transition"
                >
                  {l}
                </Link>
              ))}
            </nav>

            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} ThreeStack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
