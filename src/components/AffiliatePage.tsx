import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, DollarSign, TrendingUp, Users, Zap, Shield, BarChart3, Gift, Star, ChevronDown, ChevronUp, Clock, Award, Target, Repeat } from 'lucide-react';

const REDITUS_SIGNUP_URL = 'https://app.getreditus.com/marketplace/adiology';

interface AffiliatePageProps {
  onBack?: () => void;
}

const FAQS = [
  {
    q: 'How much can I earn as an Adiology affiliate?',
    a: 'You earn up to 40% recurring commission on every billing cycle your referred users pay. With our plans ranging from $49–$199/month, active affiliates easily earn $500–$5,000+ per month with a modest audience.'
  },
  {
    q: 'How long does the cookie tracking last?',
    a: 'Our tracking cookie lasts 90 days. If a visitor you refer signs up anytime within 90 days of clicking your link, you get credited for the sale.'
  },
  {
    q: 'When and how do I get paid?',
    a: "Payouts are processed monthly via PayPal or bank transfer, with a minimum threshold of $50. You'll receive your earnings within the first 10 days of each month for the previous month's commissions."
  },
  {
    q: 'Is there a limit to how much I can earn?',
    a: 'No limits whatsoever. Refer 1 or 1,000 customers — the commission structure stays the same. The more you refer, the more you earn.'
  },
  {
    q: 'What marketing materials do I get?',
    a: 'You get access to a full suite of banners, email copy, social media templates, demo videos, and a live stats dashboard through the Reditus affiliate portal.'
  },
  {
    q: 'Can I promote Adiology on any platform?',
    a: 'Yes — you can promote via your website, blog, YouTube, social media, newsletters, or any other channel. Paid ads are allowed with prior written approval from our team.'
  },
];

const STEPS = [
  {
    number: '01',
    icon: <UserPlusIcon />,
    title: 'Join Free',
    desc: 'Sign up on our Reditus affiliate portal in under 2 minutes. No approval wait time — get your link instantly.'
  },
  {
    number: '02',
    icon: <ShareIcon />,
    title: 'Share Your Link',
    desc: 'Promote Adiology to marketers, agencies, and business owners via your unique tracking link across any channel.'
  },
  {
    number: '03',
    icon: <DollarSign className="w-6 h-6" />,
    title: 'Earn Recurring Revenue',
    desc: 'Get paid up to 40% commission every single month your referrals remain active subscribers. Forever.'
  },
];

const TIERS = [
  {
    label: 'Starter',
    refs: '1–5 active referrals',
    commission: '25%',
    monthly: 'Up to $498/mo',
    color: 'from-blue-500/20 to-blue-600/20',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-400',
  },
  {
    label: 'Growth',
    refs: '6–20 active referrals',
    commission: '30%',
    monthly: 'Up to $1,992/mo',
    color: 'from-violet-500/20 to-purple-600/20',
    border: 'border-violet-500/30',
    badge: 'bg-violet-500/20 text-violet-400',
    featured: true,
  },
  {
    label: 'Partner',
    refs: '21+ active referrals',
    commission: '40%',
    monthly: 'Unlimited',
    color: 'from-emerald-500/20 to-teal-600/20',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-400',
  },
];

function UserPlusIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${open ? 'border-violet-500/50 bg-violet-500/5' : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50'}`}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between p-6 gap-4">
        <p className="text-white font-semibold text-base leading-snug">{q}</p>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${open ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-700/50 text-slate-400'}`}>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      {open && (
        <div className="px-6 pb-6">
          <p className="text-slate-300 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export function AffiliatePage({ onBack }: AffiliatePageProps) {
  return (
    <div className="min-h-screen bg-[#070B14] text-white overflow-x-hidden">

      {/* Navigation bar */}
      <nav className="sticky top-0 z-50 bg-[#070B14]/90 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Adiology</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="text-white font-semibold text-sm hidden sm:block">adiology</span>
            <span className="text-slate-500 text-sm hidden sm:block">·</span>
            <span className="text-slate-400 text-sm hidden sm:block">Affiliate Program</span>
          </div>
          <a
            href={REDITUS_SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-violet-500/20"
          >
            Join Now
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-radial from-violet-600/20 via-indigo-600/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            <span className="text-violet-300 text-sm font-medium">Affiliate Program · Now Open</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-none">
            Earn{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                40%
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />
            </span>
            {' '}Recurring<br className="hidden sm:block" /> Commission.{' '}
            <span className="text-slate-400">Forever.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Refer marketers and agencies to Adiology and earn up to <strong className="text-white">40% commission on every billing cycle</strong> — not just the first payment. Real recurring revenue that compounds every month.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <a
              href={REDITUS_SIGNUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all duration-200 shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5"
            >
              Start Earning Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-semibold px-6 py-4 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-all duration-200 hover:bg-slate-800/50"
            >
              See How It Works
            </a>
          </div>

          {/* Trust stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: '40%', label: 'Max Commission', icon: <TrendingUp className="w-4 h-4" /> },
              { value: '90 days', label: 'Cookie Duration', icon: <Clock className="w-4 h-4" /> },
              { value: '$0', label: 'Cost to Join', icon: <Gift className="w-4 h-4" /> },
              { value: 'Monthly', label: 'Payout Frequency', icon: <Repeat className="w-4 h-4" /> },
            ].map((s) => (
              <div key={s.label} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 text-center">
                <div className="flex justify-center mb-1 text-violet-400">{s.icon}</div>
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMISSION TIERS ── */}
      <section className="py-20 px-4 sm:px-6 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Commission Structure</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">The More You Refer,<br />The More You Keep</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Tiered commissions that reward your growth. Unlock higher rates as your referral base grows.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div
                key={tier.label}
                className={`relative rounded-3xl border p-8 bg-gradient-to-br ${tier.color} ${tier.border} ${tier.featured ? 'ring-2 ring-violet-500/50 scale-105' : ''}`}
              >
                {tier.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-violet-500/30 whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${tier.badge}`}>
                  {tier.label}
                </span>
                <div className="text-6xl font-black mb-1 bg-gradient-to-br from-white to-slate-300 bg-clip-text text-transparent">
                  {tier.commission}
                </div>
                <div className="text-slate-400 text-sm mb-6">commission per billing</div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-300">{tier.refs}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-300">{tier.monthly} potential</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Repeat className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-300">Paid every billing cycle</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            Based on referred users on the Pro plan ($99/mo). Earnings scale with your referrals' plan selection.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-4">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">How It Works</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Three Steps to<br />Passive Income</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Start earning in minutes. No technical setup, no complex approvals.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-violet-500/40 to-transparent z-0 -translate-y-0.5" style={{ width: 'calc(100% - 2rem)', left: 'calc(100% - 0.5rem)' }} />
                )}
                <div className="relative bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 hover:border-violet-500/30 transition-all duration-300 hover:bg-slate-800/60">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/30 rounded-2xl flex items-center justify-center text-violet-400 flex-shrink-0">
                      {step.icon}
                    </div>
                    <div className="text-5xl font-black text-slate-800 leading-none pt-1">{step.number}</div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ADIOLOGY ── */}
      <section className="py-20 px-4 sm:px-6 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full px-3 py-1 mb-4">
              <Star className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="text-fuchsia-400 text-xs font-semibold uppercase tracking-wider">Why Partner With Us</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Built for Affiliates<br />Who Think Long-Term</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">We've designed every part of our affiliate program to maximize your earnings and minimize your effort.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Repeat className="w-5 h-5" />,
                color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
                title: '100% Recurring Revenue',
                desc: 'Every month your referrals pay, you earn. Not just the first payment — every single recurring charge.'
              },
              {
                icon: <TrendingUp className="w-5 h-5" />,
                color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                title: 'High Conversion Product',
                desc: 'Adiology solves a $100B+ problem — Google Ads management. Users who try it, keep it.'
              },
              {
                icon: <Shield className="w-5 h-5" />,
                color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                title: '90-Day Attribution Window',
                desc: 'Your referrals are protected for 3 full months. Even if they come back later, you get the credit.'
              },
              {
                icon: <BarChart3 className="w-5 h-5" />,
                color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                title: 'Real-Time Dashboard',
                desc: 'Track clicks, signups, conversions, and earnings in real time through the Reditus affiliate portal.'
              },
              {
                icon: <Target className="w-5 h-5" />,
                color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
                title: 'Massive Addressable Market',
                desc: 'Every business running Google Ads is a potential customer. Agencies, freelancers, eCommerce — all qualify.'
              },
              {
                icon: <Gift className="w-5 h-5" />,
                color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
                title: 'Full Marketing Toolkit',
                desc: 'Banners, email copy, demo videos, landing page templates — everything you need to start promoting today.'
              },
            ].map((f) => (
              <div key={f.title} className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 hover:border-slate-600/50 transition-all duration-200 hover:bg-slate-800/60 group">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-white font-bold mb-2 group-hover:text-violet-300 transition-colors">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARNINGS CALCULATOR ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-3xl p-8 sm:p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-black mb-3">What Could You Earn?</h2>
                <p className="text-slate-400">A realistic look at affiliate income on the Pro plan ($99/mo)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left text-slate-400 text-sm font-semibold pb-4">Referrals</th>
                      <th className="text-right text-slate-400 text-sm font-semibold pb-4">Tier</th>
                      <th className="text-right text-slate-400 text-sm font-semibold pb-4">Commission</th>
                      <th className="text-right text-slate-400 text-sm font-semibold pb-4">Monthly Earnings</th>
                      <th className="text-right text-slate-400 text-sm font-semibold pb-4">Annual Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {[
                      { refs: 3, tier: 'Starter', rate: '25%', monthly: '$74.25', annual: '$891' },
                      { refs: 10, tier: 'Growth', rate: '30%', monthly: '$297', annual: '$3,564' },
                      { refs: 25, tier: 'Partner', rate: '40%', monthly: '$990', annual: '$11,880', highlight: true },
                      { refs: 50, tier: 'Partner', rate: '40%', monthly: '$1,980', annual: '$23,760', highlight: true },
                      { refs: 100, tier: 'Partner', rate: '40%', monthly: '$3,960', annual: '$47,520', highlight: true },
                    ].map((row) => (
                      <tr key={row.refs} className={`${row.highlight ? 'bg-emerald-500/5' : ''}`}>
                        <td className="py-4 text-white font-medium">{row.refs} customers</td>
                        <td className="py-4 text-right">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${row.tier === 'Starter' ? 'bg-blue-500/20 text-blue-400' : row.tier === 'Growth' ? 'bg-violet-500/20 text-violet-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {row.tier}
                          </span>
                        </td>
                        <td className="py-4 text-right text-slate-300">{row.rate}</td>
                        <td className="py-4 text-right font-bold text-white">{row.monthly}</td>
                        <td className={`py-4 text-right font-black text-lg ${row.highlight ? 'text-emerald-400' : 'text-white'}`}>{row.annual}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-slate-500 text-xs text-center mt-4">Based on $99/mo Pro plan. Earnings vary by plan selection and churn rate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO IS THIS FOR ── */}
      <section className="py-16 px-4 sm:px-6 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">Perfect For</h2>
            <p className="text-slate-400 text-lg">Anyone with an audience in the digital marketing, SaaS, or advertising space.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji: '📣', title: 'Marketing Influencers', desc: 'Content creators covering Google Ads, PPC, or paid media' },
              { emoji: '🏢', title: 'Agencies', desc: 'Digital agencies recommending tools to their clients' },
              { emoji: '✍️', title: 'Bloggers & Educators', desc: 'SEO/PPC bloggers, newsletter writers, and course creators' },
              { emoji: '🛠️', title: 'SaaS Reviewers', desc: 'Review sites, comparison platforms, and tool directories' },
            ].map((p) => (
              <div key={p.title} className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 text-center hover:border-violet-500/30 transition-all duration-200">
                <div className="text-4xl mb-3">{p.emoji}</div>
                <h3 className="text-white font-bold mb-2">{p.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-lg">Everything you need to know before joining.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-violet-900/40 via-indigo-900/30 to-slate-900/40 border border-violet-500/30 rounded-3xl p-12 sm:p-16 overflow-hidden">
            {/* Decorative glows */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 text-sm font-medium">Free to join · No approval needed · Instant access</span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                Ready to Turn Your<br />
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  Audience Into Income?
                </span>
              </h2>

              <p className="text-slate-300 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                Join our affiliate program today and start earning up to <strong className="text-white">40% recurring commission</strong> on every customer you refer. Your link goes live the moment you sign up.
              </p>

              <a
                href={REDITUS_SIGNUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black px-10 py-5 rounded-2xl text-xl transition-all duration-200 shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 hover:-translate-y-1"
              >
                Join the Affiliate Program
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </a>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-slate-400 text-sm">
                {[
                  { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Free & instant sign up' },
                  { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Up to 40% recurring commission' },
                  { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: '90-day cookie window' },
                  { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: 'Monthly payouts' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-slate-500 text-sm">
                Questions? Email us at{' '}
                <a href="mailto:affiliates@adiology.io" className="text-violet-400 hover:text-violet-300 transition-colors">
                  affiliates@adiology.io
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer strip */}
      <div className="border-t border-slate-800/60 py-6 px-4 text-center">
        <p className="text-slate-500 text-sm">
          © {new Date().getFullYear()} Adiology · Affiliate program powered by{' '}
          <a href="https://www.getreditus.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
            Reditus
          </a>
        </p>
      </div>
    </div>
  );
}
