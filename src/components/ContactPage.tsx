import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Mail, Phone, MapPin, Send, Clock, MessageSquare } from 'lucide-react';

interface ContactPageProps {
  onBack: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email Us',
      content: 'support@adiology.io',
      link: 'mailto:support@adiology.io',
      description: 'Send us an email anytime'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Call Us',
      content: '+1 304-305-1702',
      link: 'tel:+13043051702',
      description: 'Mon-Fri, 9am-6pm EST'
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Visit Us',
      content: 'San Francisco, CA',
      link: '#',
      description: 'United States'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us - Adiology | Get Support & Help</title>
        <meta name="description" content="Get in touch with Adiology. Contact our support team for help with Google Ads campaign building, account issues, or feature requests." />
        <link rel="canonical" href="https://adiology.io/contact" />
        <meta property="og:title" content="Contact Us - Adiology" />
        <meta property="og:description" content="Get in touch with Adiology support team." />
        <meta property="og:url" content="https://adiology.io/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://adiology.io/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Contact Us - Adiology" />
        <meta name="twitter:description" content="Get in touch with Adiology support team." />
      </Helmet>
      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-white/80 max-w-2xl">
            Have questions about our platform? We'd love to hear from you. Our team is here to help.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {contactInfo.map((info) => (
            <a
              key={info.title}
              href={info.link}
              className="block bg-white rounded-2xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 text-white">
                {info.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{info.title}</h3>
              <p className="text-indigo-600 font-medium mb-1">{info.content}</p>
              <p className="text-gray-500 text-sm">{info.description}</p>
            </a>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">Message Sent!</h3>
                <p className="text-green-700 mb-4">
                  Thank you for reaching out. Our team will get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-gray-700 mb-2 text-sm font-medium">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-gray-700 mb-2 text-sm font-medium">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="company" className="block text-gray-700 mb-2 text-sm font-medium">
                      Company Name
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
                      placeholder="Your Company"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-gray-700 mb-2 text-sm font-medium">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-gray-700 mb-2 text-sm font-medium">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors bg-white"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="sales">Sales Question</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-gray-700 mb-2 text-sm font-medium">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors resize-none"
                    placeholder="Tell us about your project or questions..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <span>Send Message</span>
                  <Send className="w-5 h-5" />
                </button>

                <p className="text-gray-500 text-sm text-center">
                  We respect your privacy. Your information will never be shared with third parties.
                </p>
              </form>
            )}
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Business Hours</h3>
              </div>
              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="font-medium">9:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-medium">10:00 AM - 2:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="text-gray-500">Closed</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Quick Response</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Our support team typically responds within 24 hours on business days. For urgent matters, please call us directly.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Average response time: 4 hours</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Customer satisfaction: 98%</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">Enterprise Support</h3>
              <p className="text-gray-300 mb-4 text-sm">
                Need dedicated support for your organization? Our enterprise plans include priority support with a dedicated account manager.
              </p>
              <a
                href="mailto:enterprise@adiology.io"
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium text-sm"
              >
                <Mail className="w-4 h-4" />
                enterprise@adiology.io
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
