import React from "react";

import "../styles/scope/homepage-v2-scope.css"; // ensure this path exists

type ServiceItem = { title: string; price: string; img: string };

const SERVICES: ServiceItem[] = [
  { title: "Emergency Repairs", price: "From $89", img: "/assets/service1.jpg" },
  { title: "Drain Cleaning", price: "From $129", img: "/assets/service2.jpg" },
  { title: "Water Heater Service", price: "From $199", img: "/assets/service3.jpg" },
];

export default function HomepageV2() {
  return (
    <main className="homepage-v2 antialiased text-slate-900">
      {/* HERO */}
      <section className="px-6 md:px-16 py-12 md:py-20 max-w-7xl mx-auto">
        <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16">
          <div className="w-full md:w-6/12">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              24/7 Fast, Reliable & Affordable Service Professionals
            </h1>

            <p className="mt-4 text-slate-600 text-base md:text-lg max-w-xl">
              Trusted experts for urgent repairs, scheduled projects, and complete home & business service needs.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="cta inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-violet-500 text-white px-6 py-3 rounded-xl shadow-md hover:from-indigo-700 hover:to-violet-600"
              >
                Get Instant Quote
              </button>

              <a
                href="tel:1-800-SERVICE"
                className="inline-flex items-center justify-center px-5 py-3 border border-slate-200 rounded-xl text-slate-800"
              >
                Call Now • 1-800-SERVICE
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-500">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50">★ 4.9 rated</div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50">10k+ happy clients</div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50">Licensed & insured</div>
            </div>
          </div>

          <div className="w-full md:w-6/12 flex justify-center">
            <div className="w-full max-w-md rounded-xl shadow-xl overflow-hidden">
              <img
                alt="Service professional"
                src="/assets/hero-service.jpg"
                className="w-full h-64 md:h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="px-6 md:px-16 py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center">Why choose our services</h2>
          <p className="text-slate-600 text-center mt-2 max-w-2xl mx-auto">
            Trusted local teams with transparent pricing and fast response.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm min-w-0">
              <div className="text-indigo-600 text-xl font-semibold">24/7 Emergency</div>
              <p className="mt-3 text-slate-600 text-sm">Always available for urgent service needs.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm min-w-0">
              <div className="text-indigo-600 text-xl font-semibold">Upfront Pricing</div>
              <p className="mt-3 text-slate-600 text-sm">No hidden fees. Transparent quotes.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm min-w-0">
              <div className="text-indigo-600 text-xl font-semibold">Certified Experts</div>
              <p className="mt-3 text-slate-600 text-sm">Licensed, trained & background-checked.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm min-w-0">
              <div className="text-indigo-600 text-xl font-semibold">Satisfaction Guarantee</div>
              <p className="mt-3 text-slate-600 text-sm">Guaranteed quality on every job.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="px-6 md:px-16 py-12">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center">Our Services</h3>
          <p className="text-slate-600 text-center mt-2 max-w-2xl mx-auto">Complete solutions for your home or business</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {SERVICES.map((s, i) => (
              <article key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden min-w-0">
                <img src={s.img} alt={s.title} className="w-full h-44 object-cover" />
                <div className="p-6">
                  <h4 className="text-lg font-semibold">{s.title}</h4>
                  <p className="mt-2 text-slate-600 text-sm">Professional and timely service.</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-indigo-600 font-semibold">{s.price}</div>
                    <button className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700">Book Now</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="px-6 md:px-16 py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-bold">Choose Your Plan</h3>
          <p className="text-slate-600 mt-2">No hidden fees • Cancel anytime • 14-day money back</p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow min-w-0">
              <div className="text-slate-900 text-lg font-bold">$69.99</div>
              <div className="mt-4 text-slate-600 text-sm">Basic - per month</div>
              <button className="mt-6 w-full px-4 py-2 rounded-lg border border-slate-200">Get Started</button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow min-w-0 ring-2 ring-indigo-500">
              <div className="text-slate-900 text-lg font-bold">$129.99</div>
              <div className="mt-4 text-slate-600 text-sm">Pro - per month</div>
              <div className="text-xs text-indigo-600 mt-1">Most Popular</div>
              <button className="mt-6 w-full px-4 py-2 rounded-lg bg-indigo-600 text-white">Get Started</button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow min-w-0">
              <div className="text-slate-900 text-lg font-bold">$99.99</div>
              <div className="mt-4 text-slate-600 text-sm">Lifetime - one-time</div>
              <button className="mt-6 w-full px-4 py-2 rounded-lg border border-slate-200">Get Started</button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT / FOOTER */}
      <footer className="px-6 md:px-16 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Contact</h4>
              <div className="text-slate-600 text-sm">support@service.com</div>
              <div className="text-slate-600 text-sm">+1 800 000 000</div>
            </div>

            <div className="md:col-span-2">
              <h4 className="font-semibold">Get in touch</h4>
              <form className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="p-3 border rounded-lg" placeholder="Full name" />
                <input className="p-3 border rounded-lg" placeholder="Email" />
                <textarea className="p-3 border rounded-lg md:col-span-2" rows={4} placeholder="Message" />
                <button className="md:col-span-2 px-6 py-3 bg-indigo-600 text-white rounded-lg">Send Message</button>
              </form>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-slate-400">© {new Date().getFullYear()} Your Company. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}

