import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight, ArrowLeft, Globe, Shield, Lock, Mail, Bell,
  Search, Activity, Clock, AlertTriangle, CheckCircle2,
  Server, FileText, BarChart3, Eye, Zap, Layers,
  Menu, X, ChevronRight
} from 'lucide-react';

interface DomainMonitorPageProps {
  onGetStarted?: () => void;
  onBack?: () => void;
}

export default function DomainMonitorPage({ onGetStarted, onBack }: DomainMonitorPageProps) {
  return (
    <>
      <Helmet>
        <title>Domain Monitor - Track Domain Expiry, SSL & DNS | Adiology</title>
        <meta name="description" content="Monitor your domains with Adiology's Domain Monitor. Track domain expiry, SSL certificates, DNS records, and get email alerts before issues affect your Google Ads campaigns." />
        <link rel="canonical" href="https://adiology.io/features/domain-monitor" />
        <meta property="og:title" content="Domain Monitor - Track Domain Expiry, SSL & DNS | Adiology" />
        <meta property="og:description" content="Monitor your domains with expiry tracking, SSL certificates, and DNS record alerts." />
        <meta property="og:url" content="https://adiology.io/features/domain-monitor" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Domain Monitor - Track Domain Expiry, SSL & DNS | Adiology" />
        <meta name="twitter:description" content="Monitor your domains with expiry tracking, SSL certificates, and DNS record alerts." />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Domain Monitoring",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://adiology.io/features/domain-monitor",
          "description": "Monitor your domains with Adiology's Domain Monitor. Track domain expiry, SSL certificates, DNS records, and get email alerts before issues affect your Google Ads campaigns.",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Adiology",
            "url": "https://adiology.io"
          }
        })}</script>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
        <Navigation onGetStarted={onGetStarted} onBack={onBack} />
        <HeroSection onGetStarted={onGetStarted} />
        <MonitoringCapabilities />
        <DNSRecordTypes />
        <HowItWorks />
        <AlertSystem />
        <CTASection onGetStarted={onGetStarted} />
        <Footer />
      </div>
    </>
  );
}

function Navigation({ onGetStarted, onBack }: { onGetStarted?: () => void; onBack?: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-slate-950/95 backdrop-blur-xl shadow-sm border-b border-white/10' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-white font-black text-xl">A</span>
            </div>
            <span className="font-bold text-xl text-white">adiology</span>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm font-medium text-indigo-200 hover:text-white transition-colors px-4 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all hover:scale-105"
            >
              Get Started Free
            </button>
          </div>

          <button className="md:hidden p-2 text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden mt-4 pb-4 space-y-3 bg-indigo-950/80 backdrop-blur-xl rounded-xl p-4 -mx-2"
          >
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium py-2 text-indigo-200">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            <button onClick={onGetStarted} className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold">
              Get Started Free
            </button>
          </motion.div>
        )}
      </div>
    </nav>
  );
}

function HeroSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const badges = [
    { icon: Search, label: 'WHOIS Monitoring' },
    { icon: Lock, label: 'SSL Tracking' },
    { icon: Server, label: 'DNS Records' },
    { icon: Mail, label: 'Email Alerts' },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="relative pt-32 md:pt-40 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-6 border border-violet-500/20">
                <Globe className="w-4 h-4" />
                Domain Monitor
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="text-white">Never Miss a Domain or</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                SSL Expiration Again
              </span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-indigo-200/80 mb-10 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Comprehensive domain monitoring with WHOIS lookup, SSL certificate tracking, and DNS record surveillance. Stay informed about every change across all your domains.
            </motion.p>

            <motion.div
              className="flex flex-wrap justify-center gap-4 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-violet-900/30 hover:shadow-xl transition-all flex items-center gap-2"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Monitoring
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-3">
              {badges.map((badge, i) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300"
                >
                  <badge.icon className="w-4 h-4 text-violet-400" />
                  {badge.label}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MonitoringCapabilities() {
  const capabilities = [
    {
      icon: Search,
      title: 'Domain Registration & Expiry',
      description: 'Track WHOIS data including registrar, registration date, expiry date, and nameservers. Never let a domain expire unexpectedly.',
      gradient: 'from-violet-500 to-indigo-500',
      bg: 'bg-violet-500/10',
    },
    {
      icon: Lock,
      title: 'SSL Certificate Validity',
      description: 'Monitor SSL certificate expiration dates, issuer details, and validity status. Get alerts before certificates expire to prevent security warnings.',
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Server,
      title: 'DNS Record Tracking',
      description: 'Track all DNS record types including A, AAAA, MX, TXT, NS, and CNAME records. Detect unauthorized changes instantly.',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Activity,
      title: 'Change Detection',
      description: 'Take snapshots of your domain data and compare them over time. Spot differences in registration details, DNS records, or SSL status between checks.',
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-500/10',
    },
    {
      icon: Bell,
      title: 'Expiry Alerts via Email',
      description: 'Receive email notifications before domains and SSL certificates expire. Configurable alert thresholds at 90, 60, 30, and 7 days before expiry.',
      gradient: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-500/10',
    },
    {
      icon: BarChart3,
      title: 'Multi-Domain Dashboard',
      description: 'Manage all your domains from a single dashboard. View status at a glance, sort by expiry date, and quickly identify domains needing attention.',
      gradient: 'from-purple-500 to-violet-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-4 border border-violet-500/20">
            <Eye className="w-4 h-4" />
            Monitoring Capabilities
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Complete Domain
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Intelligence Suite
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Everything you need to keep your domains, SSL certificates, and DNS records secure and up to date.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, index) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className="group bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-900/20 transition-all duration-300"
            >
              <div className={`w-14 h-14 ${cap.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <cap.icon className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{cap.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{cap.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DNSRecordTypes() {
  const records = [
    {
      type: 'A',
      name: 'Address Record',
      description: 'Maps a domain to an IPv4 address. The most fundamental DNS record for connecting your domain to a server.',
      color: 'from-violet-500 to-indigo-500',
      textColor: 'text-violet-400',
    },
    {
      type: 'AAAA',
      name: 'IPv6 Address',
      description: 'Maps a domain to an IPv6 address. Essential for modern internet connectivity and future-proofing your infrastructure.',
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-400',
    },
    {
      type: 'MX',
      name: 'Mail Exchange',
      description: 'Directs email to the correct mail servers. Critical for email delivery — changes here can disrupt your email flow.',
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-400',
    },
    {
      type: 'TXT',
      name: 'Text Record',
      description: 'Stores text data for SPF, DKIM, DMARC, and domain verification. Key for email security and service authentication.',
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-400',
    },
    {
      type: 'NS',
      name: 'Nameserver',
      description: 'Specifies authoritative nameservers for your domain. Unauthorized changes can redirect all your DNS resolution.',
      color: 'from-pink-500 to-rose-500',
      textColor: 'text-pink-400',
    },
    {
      type: 'CNAME',
      name: 'Canonical Name',
      description: 'Creates an alias from one domain to another. Commonly used for subdomains and CDN configurations.',
      color: 'from-purple-500 to-violet-500',
      textColor: 'text-purple-400',
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium mb-4 border border-indigo-500/20">
            <Server className="w-4 h-4" />
            DNS Monitoring
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Every DNS Record Type
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Under Surveillance
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            We monitor all critical DNS record types to ensure your domain infrastructure remains secure and properly configured.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((record, index) => (
            <motion.div
              key={record.type}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className="group relative bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${record.color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300`} />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${record.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-black text-sm">{record.type}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{record.name}</h3>
                    <span className={`text-xs font-semibold ${record.textColor}`}>{record.type} Record</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{record.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Add Your Domains',
      description: 'Simply enter your domain names and we\'ll automatically fetch all WHOIS, SSL, and DNS data. Add as many domains as you need.',
      icon: Globe,
      gradient: 'from-violet-500 to-indigo-500',
    },
    {
      step: '02',
      title: 'Automatic Monitoring',
      description: 'Our system continuously monitors your domains for changes in registration status, SSL validity, and DNS records around the clock.',
      icon: Activity,
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      step: '03',
      title: 'Get Alerts',
      description: 'Receive instant email notifications when something changes or when an expiration date is approaching. Never be caught off guard.',
      icon: Bell,
      gradient: 'from-blue-500 to-cyan-500',
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-4 border border-violet-500/20">
            <Zap className="w-4 h-4" />
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Three Simple Steps to
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Complete Protection
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Get started in minutes. No complex setup required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[calc(100%_-_16px)] w-[calc(100%_-_64px)] z-10">
                  <div className="border-t-2 border-dashed border-violet-500/30 relative">
                    <ChevronRight className="w-5 h-5 text-violet-400 absolute -right-3 -top-[11px]" />
                  </div>
                </div>
              )}
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-violet-500/30 transition-all duration-300 text-center h-full">
                <div className={`w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-violet-400 mb-2 tracking-widest">{step.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AlertSystem() {
  const alerts = [
    {
      icon: AlertTriangle,
      title: 'Domain Expiry Warnings',
      description: 'Get notified 90, 60, 30, and 7 days before your domains expire. Multiple warning levels ensure you never miss a renewal deadline.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      icon: Shield,
      title: 'SSL Renewal Reminders',
      description: 'Automatic reminders when SSL certificates are approaching expiration. Prevent security warnings and maintain visitor trust.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Activity,
      title: 'DNS Change Detection',
      description: 'Instant alerts when any DNS records change. Detect unauthorized modifications to A, MX, NS, or any other record type immediately.',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Mail,
      title: 'Email Notifications',
      description: 'All alerts delivered directly to your inbox. Clear, actionable notifications with full details about what changed and what to do next.',
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-6 border border-violet-500/20">
              <Bell className="w-4 h-4" />
              Alert System
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Stay Ahead with
              <br />
              <span className="text-violet-400">Proactive Alerts</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Our intelligent alert system monitors your domains 24/7 and sends you timely notifications so you can take action before issues arise.
            </p>
            <div className="space-y-4">
              {['Multi-level expiry warnings (90/60/30/7 days)', 'Real-time DNS change detection', 'SSL certificate status monitoring', 'Actionable email notifications'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-violet-400" />
                  </div>
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4 }}
                className="flex items-start gap-4 bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className={`w-12 h-12 ${alert.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <alert.icon className={`w-6 h-6 ${alert.color}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">{alert.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{alert.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CTASection({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          </div>
          <div className="relative bg-white/5 border border-white/10 rounded-3xl p-12 md:p-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/20">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                Start Monitoring Your
                <br />
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  Domains Today
                </span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Add your domains in seconds and get instant visibility into WHOIS, SSL, and DNS status. Free to get started.
              </p>
              <motion.button
                onClick={onGetStarted}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-violet-900/30 hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">A</span>
          </div>
          <span className="font-bold text-lg text-white">adiology</span>
        </div>
        <p className="text-sm text-gray-500">© 2026 Adiology. All rights reserved.</p>
      </div>
    </footer>
  );
}
