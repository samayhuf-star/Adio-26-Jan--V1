import { useState, useEffect, useRef } from 'react';
import { Eye, Download, Star, Phone, Mail, Clock, Edit3, Trash2, FolderOpen, Plus, Sparkles, X, Search, Filter, Globe, Copy, Check, CheckCircle, AlertCircle, Loader, RefreshCw, ExternalLink, Calendar, Shield } from 'lucide-react';
import TemplateEditorBuilder from './TemplateEditorBuilder';
import { supabase } from '../utils/supabase/client';
import { 
  TemplateData, 
  SavedWebsite, 
  getSavedWebsites, 
  createSavedWebsite, 
  deleteSavedWebsite,
  downloadTemplate 
} from '../utils/savedWebsites';
import JSZip from 'jszip';


const lawnCareTemplate: TemplateData = {
  slug: "lawn-care",
  title: "GreenEdge Lawn Care",
  themeId: "green-edge",
  hero: {
    heading: "Professional Lawn Care Services",
    subheading: "Transform your yard with expert lawn care and landscaping services",
    ctaText: "Get Free Quote"
  },
  hero_image: "/template-images/tree_trimming_professional_arborist_work.png",
  features: {
    heading: "Why Choose GreenEdge",
    items: [
      { icon: "🌱", title: "Expert Care", desc: "Professional lawn care specialists with years of experience" },
      { icon: "💚", title: "Eco-Friendly", desc: "Sustainable and environmentally friendly solutions" },
      { icon: "⚡", title: "Fast Service", desc: "Quick response times and efficient service" },
      { icon: "✅", title: "Satisfaction Guaranteed", desc: "100% satisfaction guarantee on all services" }
    ]
  },
  services: {
    heading: "Our Services",
    subheading: "Complete lawn care solutions for your property",
    items: [
      { image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop", title: "Lawn Mowing", desc: "Regular lawn mowing and trimming to keep your yard looking perfect", price: "From $59/visit" },
      { image: "https://images.unsplash.com/photo-1599629954294-2f46e0b87b02?w=400&h=300&fit=crop", title: "Landscape Design", desc: "Custom landscape design and planning services", price: "From $499" },
      { image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop", title: "Hardscaping", desc: "Patios, walkways, retaining walls, and more", price: "Custom Quote" }
    ]
  },
  testimonials: {
    heading: "What Our Customers Say",
    items: [
      { name: "John Smith", company: "Homeowner", rating: 5, text: "Excellent service! Our lawn has never looked better. The team is professional and always on time.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
      { name: "Sarah Johnson", company: "Property Manager", rating: 5, text: "Professional and reliable. Highly recommend GreenEdge for all landscaping needs!", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
      { name: "Michael Brown", company: "Business Owner", rating: 5, text: "Best landscaping company in the area. They transformed our commercial property beautifully.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Ready to Transform Your Lawn?",
    subheading: "Contact us today for a free consultation and estimate",
    ctaText: "Call Now"
  },
  contact: {
    phone: "+1-800-GREEN-GO",
    email: "info@greenedge.com",
    hours: "Mon-Sat: 7AM-6PM"
  },
  footer: {
    companyName: "GreenEdge Lawn Care",
    tagline: "Creating Beautiful Outdoor Spaces",
    address: "123 Garden Lane, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 GreenEdge Lawn Care. All rights reserved."
  },
  seo: {
    title: "GreenEdge Lawn Care - Professional Lawn Care Services",
    description: "Professional lawn care and landscaping services. Expert mowing, design, and hardscaping. Free quotes available.",
    keywords: "lawn care, landscaping, lawn mowing, landscape design, hardscaping, yard maintenance"
  },
  styles: {
    primaryColor: "#16a34a",
    secondaryColor: "#15803d"
  },
  aboutUs: {
    heading: "About GreenEdge",
    description: "We are a trusted local lawn care company with over 15 years of experience serving our community. Our team of certified landscaping professionals is dedicated to providing top-quality service and creating beautiful outdoor spaces.",
    values: [
      { title: "Quality", desc: "We never compromise on the quality of our work" },
      { title: "Reliability", desc: "Count on us to be there when you need us" },
      { title: "Trust", desc: "Building lasting relationships with our customers" }
    ]
  },
  contactForm: {
    heading: "Get In Touch",
    subheading: "Fill out the form below and we'll get back to you shortly",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: false },
      { name: "message", label: "Message", type: "textarea", required: true }
    ],
    submitText: "Send Message"
  }
};

const plumbingTemplate: TemplateData = {
  slug: "plumbing",
  title: "AquaFlow Plumbing Services",
  themeId: "aquaflow",
  hero: {
    heading: "Expert Plumbing Solutions",
    subheading: "Professional plumbing services for residential and commercial needs",
    ctaText: "Schedule Service"
  },
  hero_image: "/template-images/professional_plumbing_repair_service.png",
  features: {
    heading: "Why Choose AquaFlow",
    items: [
      { icon: "🔧", title: "Expert Plumbers", desc: "Licensed and certified plumbing professionals" },
      { icon: "💧", title: "24/7 Emergency", desc: "Available 24/7 for emergency plumbing issues" },
      { icon: "⚡", title: "Quick Response", desc: "Same-day service available in most areas" },
      { icon: "✅", title: "Guaranteed Work", desc: "All work backed by satisfaction guarantee" }
    ]
  },
  services: {
    heading: "Our Services",
    subheading: "Comprehensive plumbing solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop", title: "Leak Detection", desc: "Advanced leak detection and repair services", price: "From $99" },
      { image: "https://images.unsplash.com/photo-1584622181563-430f63602d4b?w=400&h=300&fit=crop", title: "Pipe Installation", desc: "New pipe installation and replacement", price: "From $199" },
      { image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop", title: "Water Heater", desc: "Water heater repair and replacement", price: "From $299" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Robert Miller", company: "Homeowner", rating: 5, text: "Fast, professional, and affordable. Fixed our leak in minutes!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Jennifer Lee", company: "Property Manager", rating: 5, text: "Reliable service and fair pricing. Highly recommend!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "David Chen", company: "Business Owner", rating: 5, text: "Emergency service saved our restaurant. Great team!", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Need Plumbing Help?",
    subheading: "Call now for immediate assistance",
    ctaText: "Call 24/7"
  },
  contact: {
    phone: "+1-800-AQUA-FLO",
    email: "service@aquaflow.com",
    hours: "Available 24/7"
  },
  footer: {
    companyName: "AquaFlow Plumbing",
    tagline: "Keeping Your Water Flowing",
    address: "456 Water St, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 AquaFlow Plumbing. All rights reserved."
  },
  seo: {
    title: "AquaFlow Plumbing - Professional Plumbing Services",
    description: "Expert plumbing services including repairs, installations, and emergency service.",
    keywords: "plumbing, leak repair, water heater, pipes, emergency plumbing"
  },
  styles: {
    primaryColor: "#0ea5e9",
    secondaryColor: "#0284c7"
  },
  aboutUs: {
    heading: "About AquaFlow",
    description: "AquaFlow Plumbing has been providing expert plumbing services for over 20 years. Our licensed and certified plumbers are available 24/7 to handle any plumbing emergency or scheduled maintenance.",
    values: [
      { title: "Expertise", desc: "Licensed professionals with decades of experience" },
      { title: "Availability", desc: "24/7 emergency service when you need it most" },
      { title: "Integrity", desc: "Honest pricing with no hidden fees" }
    ]
  },
  contactForm: {
    heading: "Request Service",
    subheading: "Describe your plumbing issue and we'll respond promptly",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: true },
      { name: "message", label: "Describe Your Issue", type: "textarea", required: true }
    ],
    submitText: "Request Service"
  }
};

const electricalTemplate: TemplateData = {
  slug: "electrical",
  title: "ElectroMax Electrical",
  themeId: "electromax",
  hero: {
    heading: "Professional Electrical Services",
    subheading: "Safe, reliable electrical solutions for homes and businesses",
    ctaText: "Get Free Estimate"
  },
  hero_image: "/template-images/professional_electrical_installation.png",
  features: {
    heading: "Why ElectroMax",
    items: [
      { icon: "⚡", title: "Licensed & Insured", desc: "Certified electricians with full insurance coverage" },
      { icon: "🔌", title: "Modern Solutions", desc: "Latest electrical technology and upgrades" },
      { icon: "🛡️", title: "Safety First", desc: "Rigorous safety standards on every job" },
      { icon: "✅", title: "100% Satisfaction", desc: "Guaranteed satisfaction on all work" }
    ]
  },
  services: {
    heading: "Services Offered",
    subheading: "Complete electrical solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop", title: "Rewiring", desc: "Complete home and commercial rewiring", price: "From $499" },
      { image: "https://images.unsplash.com/photo-1581092921550-e323f87c7f0c?w=400&h=300&fit=crop", title: "Panel Upgrades", desc: "Electrical panel upgrades and maintenance", price: "From $799" },
      { image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop", title: "Lighting Design", desc: "Custom lighting installation and design", price: "From $299" }
    ]
  },
  testimonials: {
    heading: "What Clients Say",
    items: [
      { name: "Thomas Wilson", company: "Homeowner", rating: 5, text: "Professional installation, clean work area, excellent results!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Amanda Harris", company: "Facility Manager", rating: 5, text: "Efficient and knowledgeable team. Great communication!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "Mark Torres", company: "Contractor", rating: 5, text: "Go-to electrician for all our projects. Highly recommend!", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Need Electrical Work?",
    subheading: "Contact us for a free consultation",
    ctaText: "Call Now"
  },
  contact: {
    phone: "+1-800-ELECTRO",
    email: "info@electromax.com",
    hours: "Mon-Fri: 7AM-7PM, Sat: 8AM-5PM"
  },
  footer: {
    companyName: "ElectroMax Electrical",
    tagline: "Power Your Home Safely",
    address: "789 Power Ave, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 ElectroMax Electrical. All rights reserved."
  },
  seo: {
    title: "ElectroMax Electrical - Professional Electrical Services",
    description: "Licensed electricians providing rewiring, panel upgrades, and lighting design.",
    keywords: "electrician, electrical repair, wiring, panel upgrade, lighting"
  },
  styles: {
    primaryColor: "#fbbf24",
    secondaryColor: "#f59e0b"
  },
  aboutUs: {
    heading: "About ElectroMax",
    description: "ElectroMax Electrical is your trusted source for professional electrical services. Our team of licensed electricians brings safety, expertise, and reliability to every project, big or small.",
    values: [
      { title: "Safety", desc: "Rigorous safety standards on every job" },
      { title: "Certification", desc: "Fully licensed and insured electricians" },
      { title: "Excellence", desc: "Committed to quality workmanship" }
    ]
  },
  contactForm: {
    heading: "Get a Free Estimate",
    subheading: "Tell us about your electrical project",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: false },
      { name: "message", label: "Project Details", type: "textarea", required: true }
    ],
    submitText: "Get Estimate"
  }
};

const hvacTemplate: TemplateData = {
  slug: "hvac",
  title: "ComfortZone HVAC",
  themeId: "comfortzone",
  hero: {
    heading: "Complete HVAC Solutions",
    subheading: "Keep your home comfortable year-round with expert HVAC services",
    ctaText: "Schedule Maintenance"
  },
  hero_image: "/template-images/hvac_cooling_system_service.png",
  features: {
    heading: "Why ComfortZone",
    items: [
      { icon: "❄️", title: "Expert Technicians", desc: "Certified HVAC specialists with years of experience" },
      { icon: "🌡️", title: "Energy Efficient", desc: "Modern systems that save on energy costs" },
      { icon: "🔧", title: "Maintenance Plans", desc: "Affordable maintenance packages available" },
      { icon: "⏰", title: "Emergency Service", desc: "Same-day service for urgent needs" }
    ]
  },
  services: {
    heading: "Services Available",
    subheading: "Heating, cooling, and air quality solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop", title: "AC Installation", desc: "New air conditioning system installation", price: "From $1,999" },
      { image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop", title: "Furnace Repair", desc: "Heating system repair and maintenance", price: "From $199" },
      { image: "https://images.unsplash.com/photo-1584622181563-430f63602d4b?w=400&h=300&fit=crop", title: "Ductwork", desc: "Duct cleaning and sealing services", price: "From $299" }
    ]
  },
  testimonials: {
    heading: "Customer Testimonials",
    items: [
      { name: "Patricia Garcia", company: "Homeowner", rating: 5, text: "Professional installation and great customer service throughout!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "James Rodriguez", company: "Business Owner", rating: 5, text: "Reliable service. Our office is always at perfect temperature.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Lisa Anderson", company: "Property Manager", rating: 5, text: "Responsive and professional. Best HVAC company in the area!", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Need HVAC Service?",
    subheading: "Get your system running smoothly today",
    ctaText: "Call Us"
  },
  contact: {
    phone: "+1-800-COMFORT",
    email: "service@comfortzone.com",
    hours: "Mon-Sat: 8AM-8PM"
  },
  footer: {
    companyName: "ComfortZone HVAC",
    tagline: "Your Comfort Is Our Priority",
    address: "321 Climate Ln, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 ComfortZone HVAC. All rights reserved."
  },
  seo: {
    title: "ComfortZone HVAC - Air Conditioning & Heating Services",
    description: "Professional HVAC services including AC repair, furnace maintenance, and ductwork cleaning.",
    keywords: "HVAC, air conditioning, heating, furnace repair, AC installation"
  },
  styles: {
    primaryColor: "#06b6d4",
    secondaryColor: "#0891b2"
  },
  aboutUs: {
    heading: "About ComfortZone",
    description: "ComfortZone HVAC has been keeping homes and businesses comfortable for over 25 years. Our certified technicians provide expert heating, cooling, and air quality solutions with a focus on energy efficiency.",
    values: [
      { title: "Comfort", desc: "Your comfort is our top priority" },
      { title: "Efficiency", desc: "Energy-saving solutions that reduce costs" },
      { title: "Reliability", desc: "Dependable service you can count on" }
    ]
  },
  contactForm: {
    heading: "Schedule Service",
    subheading: "Book your HVAC maintenance or repair today",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: true },
      { name: "message", label: "Service Needed", type: "textarea", required: true }
    ],
    submitText: "Schedule Now"
  }
};

const cleaningTemplate: TemplateData = {
  slug: "cleaning",
  title: "SparkleClean House Cleaning",
  themeId: "sparkle",
  hero: {
    heading: "Professional House Cleaning",
    subheading: "Let us handle the cleaning while you enjoy your life",
    ctaText: "Book Now"
  },
  hero_image: "/template-images/power_washing_professional_cleaning_driveway.png",
  features: {
    heading: "Why SparkleClean",
    items: [
      { icon: "✨", title: "Thorough Cleaning", desc: "Deep cleaning with attention to every detail" },
      { icon: "👥", title: "Trusted Team", desc: "Background-checked, professional cleaners" },
      { icon: "🌿", title: "Eco-Friendly", desc: "Safe, non-toxic cleaning products" },
      { icon: "💯", title: "100% Guaranteed", desc: "Satisfaction guaranteed or we'll re-clean free" }
    ]
  },
  services: {
    heading: "Our Services",
    subheading: "Complete house cleaning solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1584854435991-93f3f0af2c4f?w=400&h=300&fit=crop", title: "Regular Cleaning", desc: "Weekly or bi-weekly cleaning maintenance", price: "From $149" },
      { image: "https://images.unsplash.com/photo-1628902419900-e6a0c57fa0a9?w=400&h=300&fit=crop", title: "Deep Cleaning", desc: "Comprehensive deep clean of your entire home", price: "From $399" },
      { image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop", title: "Move-In/Out", desc: "Complete cleaning for move-in or move-out", price: "From $299" }
    ]
  },
  testimonials: {
    heading: "Happy Customers",
    items: [
      { name: "Michelle Davis", company: "Busy Professional", rating: 5, text: "Amazing service! My home is spotless every time!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "Kevin Martinez", company: "Homeowner", rating: 5, text: "Trustworthy, professional, and thorough. Highly recommend!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Susan Jackson", company: "Office Manager", rating: 5, text: "Our office has never looked better. Excellent service!", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Ready for a Sparkling Clean Home?",
    subheading: "Schedule your cleaning service today",
    ctaText: "Book Online"
  },
  contact: {
    phone: "+1-800-SPARKLE",
    email: "hello@sparkleclean.com",
    hours: "Mon-Sat: 8AM-6PM"
  },
  footer: {
    companyName: "SparkleClean House Cleaning",
    tagline: "Clean Homes, Happy Lives",
    address: "654 Fresh St, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 SparkleClean. All rights reserved."
  },
  seo: {
    title: "SparkleClean - Professional House Cleaning Services",
    description: "Professional house cleaning services including regular cleaning, deep cleaning, and move-in/out cleaning.",
    keywords: "house cleaning, cleaning service, deep cleaning, professional cleaners"
  },
  styles: {
    primaryColor: "#a855f7",
    secondaryColor: "#9333ea"
  },
  aboutUs: {
    heading: "About SparkleClean",
    description: "SparkleClean House Cleaning has been transforming homes for over a decade. Our professional, background-checked cleaning team uses eco-friendly products to create spotless, healthy living spaces.",
    values: [
      { title: "Cleanliness", desc: "Thorough attention to every detail" },
      { title: "Trust", desc: "Background-checked, bonded professionals" },
      { title: "Eco-Friendly", desc: "Safe, non-toxic cleaning products" }
    ]
  },
  contactForm: {
    heading: "Book Your Cleaning",
    subheading: "Get a quote for your home or office",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: false },
      { name: "message", label: "Cleaning Requirements", type: "textarea", required: true }
    ],
    submitText: "Get Quote"
  }
};

const paintingTemplate: TemplateData = {
  slug: "painting",
  title: "ColorWorks Home Painting",
  themeId: "colorworks",
  hero: {
    heading: "Expert House Painting",
    subheading: "Transform your home with professional painting and staining services",
    ctaText: "Get Free Quote"
  },
  hero_image: "/template-images/professional_interior_painting_service.png",
  features: {
    heading: "Why ColorWorks",
    items: [
      { icon: "🎨", title: "Expert Painters", desc: "Skilled professionals with 15+ years experience" },
      { icon: "🏠", title: "Interior & Exterior", desc: "Complete house painting services" },
      { icon: "🌱", title: "Eco-Friendly Paint", desc: "Low-VOC, environmentally safe paints" },
      { icon: "⏱️", title: "Timely Completion", desc: "Efficient work completed on schedule" }
    ]
  },
  services: {
    heading: "Services",
    subheading: "Professional painting solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1582430223154-58f2fbb67b4c?w=400&h=300&fit=crop", title: "Interior Painting", desc: "Professional interior room and wall painting", price: "From $399" },
      { image: "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=300&fit=crop", title: "Exterior Painting", desc: "High-quality exterior house painting", price: "From $699" },
      { image: "https://images.unsplash.com/photo-1559563362-f1e77e6c1e6f?w=400&h=300&fit=crop", title: "Deck Staining", desc: "Professional deck and fence staining", price: "From $499" }
    ]
  },
  testimonials: {
    heading: "Client Reviews",
    items: [
      { name: "Catherine Moore", company: "Homeowner", rating: 5, text: "Perfect color match and flawless finish. Very professional!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "George King", company: "Real Estate Agent", rating: 5, text: "Transforms homes before sale. Excellent quality!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Nicole Brown", company: "Interior Designer", rating: 5, text: "My go-to painter for all projects. Highly skilled!", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Ready to Refresh Your Home?",
    subheading: "Get your free painting estimate today",
    ctaText: "Schedule Estimate"
  },
  contact: {
    phone: "+1-800-COLORS",
    email: "paint@colorworks.com",
    hours: "Mon-Fri: 7AM-7PM, Sat: 8AM-4PM"
  },
  footer: {
    companyName: "ColorWorks Home Painting",
    tagline: "Bringing Color To Life",
    address: "987 Paint Ln, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 ColorWorks. All rights reserved."
  },
  seo: {
    title: "ColorWorks - Professional House Painting Services",
    description: "Expert interior and exterior house painting services with eco-friendly products.",
    keywords: "house painting, interior painting, exterior painting, deck staining, professional painters"
  },
  styles: {
    primaryColor: "#ea580c",
    secondaryColor: "#c2410c"
  },
  aboutUs: {
    heading: "About ColorWorks",
    description: "ColorWorks Home Painting brings over 15 years of professional painting expertise to every project. Our skilled painters use premium, eco-friendly paints to deliver flawless finishes that transform your space.",
    values: [
      { title: "Craftsmanship", desc: "Expert painters with attention to detail" },
      { title: "Quality", desc: "Premium paints and materials only" },
      { title: "Timeliness", desc: "Projects completed on schedule" }
    ]
  },
  contactForm: {
    heading: "Get Your Free Quote",
    subheading: "Tell us about your painting project",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: false },
      { name: "message", label: "Project Description", type: "textarea", required: true }
    ],
    submitText: "Request Quote"
  }
};

const roofingTemplate: TemplateData = {
  slug: "roofing",
  title: "SkyGuard Roofing",
  themeId: "skyguard",
  hero: {
    heading: "Professional Roofing Services",
    subheading: "Protect your home with expert roofing solutions",
    ctaText: "Free Inspection"
  },
  hero_image: "/template-images/chimney_cleaning_professional_on_roof.png",
  features: {
    heading: "Why SkyGuard",
    items: [
      { icon: "🏢", title: "Master Roofers", desc: "Experienced roofing professionals" },
      { icon: "🛡️", title: "Quality Materials", desc: "Premium roofing materials and products" },
      { icon: "📋", title: "Full Warranty", desc: "Comprehensive warranty on all work" },
      { icon: "⭐", title: "Local Leaders", desc: "Top-rated roofing company in the area" }
    ]
  },
  services: {
    heading: "Roofing Services",
    subheading: "Complete roofing solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1551216606-420f2687b398?w=400&h=300&fit=crop", title: "Roof Replacement", desc: "Complete roof replacement with new materials", price: "From $3,999" },
      { image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop", title: "Repair Services", desc: "Fast and reliable roof repair", price: "From $299" },
      { image: "https://images.unsplash.com/photo-1584622181563-430f63602d4b?w=400&h=300&fit=crop", title: "Inspection", desc: "Professional roof inspection and assessment", price: "From $99" }
    ]
  },
  testimonials: {
    heading: "Testimonials",
    items: [
      { name: "Richard White", company: "Homeowner", rating: 5, text: "Excellent work and professional crew. Roof looks amazing!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Lauren Scott", company: "Insurance Agent", rating: 5, text: "They're my recommended roofer. Always quality work!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "Thomas Baker", company: "Contractor", rating: 5, text: "Reliable and professional. Great to work with!", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Protect Your Home",
    subheading: "Schedule your free roof inspection today",
    ctaText: "Get Free Inspection"
  },
  contact: {
    phone: "+1-800-ROOF-NOW",
    email: "info@skyguard.com",
    hours: "Mon-Sat: 8AM-6PM"
  },
  footer: {
    companyName: "SkyGuard Roofing",
    tagline: "Your Roof, Our Responsibility",
    address: "111 Ridge Rd, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 SkyGuard Roofing. All rights reserved."
  },
  seo: {
    title: "SkyGuard Roofing - Professional Roofing Services",
    description: "Expert roofing services including repair, replacement, and inspection.",
    keywords: "roofing, roof repair, roof replacement, roofer, roofing contractor"
  },
  styles: {
    primaryColor: "#64748b",
    secondaryColor: "#475569"
  },
  aboutUs: {
    heading: "About SkyGuard",
    description: "SkyGuard Roofing has been protecting homes for over 30 years. Our master roofers use only premium materials and provide comprehensive warranties to ensure your roof stands the test of time.",
    values: [
      { title: "Protection", desc: "Keeping your home safe from the elements" },
      { title: "Quality", desc: "Premium materials and expert installation" },
      { title: "Warranty", desc: "Comprehensive coverage on all work" }
    ]
  },
  contactForm: {
    heading: "Request Free Inspection",
    subheading: "Get a comprehensive roof assessment at no cost",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: true },
      { name: "message", label: "Describe Any Concerns", type: "textarea", required: false }
    ],
    submitText: "Schedule Inspection"
  }
};

const carpentryTemplate: TemplateData = {
  slug: "carpentry",
  title: "CraftWood Carpentry",
  themeId: "craftwood",
  hero: {
    heading: "Expert Carpentry Services",
    subheading: "Custom woodwork and carpentry for your home and business",
    ctaText: "Request Quote"
  },
  hero_image: "/template-images/professional_carpentry_woodwork.png",
  features: {
    heading: "Why CraftWood",
    items: [
      { icon: "🪚", title: "Master Craftsmen", desc: "Skilled carpenters with years of expertise" },
      { icon: "🌲", title: "Quality Wood", desc: "Premium quality wood and materials" },
      { icon: "🎯", title: "Custom Work", desc: "Tailored solutions for your needs" },
      { icon: "✨", title: "Fine Details", desc: "Attention to every detail in craftsmanship" }
    ]
  },
  services: {
    heading: "Carpentry Services",
    subheading: "Professional woodworking solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=400&h=300&fit=crop", title: "Custom Cabinetry", desc: "Built-in cabinets and custom woodwork", price: "From $999" },
      { image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop", title: "Deck Building", desc: "Beautiful custom decks and patios", price: "From $1,499" },
      { image: "https://images.unsplash.com/photo-1611107104494-f5f39c6c70dc?w=400&h=300&fit=crop", title: "Repairs", desc: "General carpentry repairs and restoration", price: "From $199" }
    ]
  },
  testimonials: {
    heading: "Customer Stories",
    items: [
      { name: "Victoria Price", company: "Homeowner", rating: 5, text: "Beautiful custom cabinets. Exceptional craftsmanship!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "Benjamin Shaw", company: "Builder", rating: 5, text: "Perfect partner for custom projects. Very reliable!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Emily Grant", company: "Interior Designer", rating: 5, text: "Outstanding work quality. Highly professional team!", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Need Custom Carpentry?",
    subheading: "Let's create something beautiful together",
    ctaText: "Get Custom Quote"
  },
  contact: {
    phone: "+1-800-CARPENTR",
    email: "build@craftwood.com",
    hours: "Mon-Fri: 8AM-6PM, Sat: 9AM-3PM"
  },
  footer: {
    companyName: "CraftWood Carpentry",
    tagline: "Quality Craftsmanship Since 1995",
    address: "222 Wood Ave, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 CraftWood Carpentry. All rights reserved."
  },
  seo: {
    title: "CraftWood Carpentry - Custom Carpentry & Woodwork",
    description: "Expert carpentry services including custom cabinetry, decks, and general carpentry repairs.",
    keywords: "carpentry, carpenter, custom cabinetry, woodwork, deck building"
  },
  styles: {
    primaryColor: "#92400e",
    secondaryColor: "#78350f"
  },
  aboutUs: {
    heading: "About CraftWood",
    description: "CraftWood Carpentry has been creating beautiful custom woodwork since 1995. Our master craftsmen combine traditional techniques with modern precision to deliver exceptional results.",
    values: [
      { title: "Craftsmanship", desc: "Skilled artisans with decades of experience" },
      { title: "Customization", desc: "Tailored solutions for your unique needs" },
      { title: "Excellence", desc: "Attention to every detail in our work" }
    ]
  },
  contactForm: {
    heading: "Request a Quote",
    subheading: "Tell us about your carpentry project",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: false },
      { name: "message", label: "Project Details", type: "textarea", required: true }
    ],
    submitText: "Get Quote"
  }
};

const pestControlTemplate: TemplateData = {
  slug: "pest-control",
  title: "BugShield Pest Control",
  themeId: "bugshield",
  hero: {
    heading: "Professional Pest Control",
    subheading: "Protect your home from unwanted pests with proven solutions",
    ctaText: "Free Inspection"
  },
  hero_image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop",
  features: {
    heading: "Why BugShield",
    items: [
      { icon: "🛡️", title: "Effective Treatment", desc: "Proven pest elimination methods" },
      { icon: "🌿", title: "Safe Products", desc: "Eco-friendly and pet-safe treatments" },
      { icon: "📅", title: "Regular Service", desc: "Preventative maintenance programs" },
      { icon: "💯", title: "Results Guaranteed", desc: "If pests return, we treat for free" }
    ]
  },
  services: {
    heading: "Our Services",
    subheading: "Comprehensive pest control solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop", title: "Termite Control", desc: "Advanced termite detection and treatment", price: "From $399" },
      { image: "https://images.unsplash.com/photo-1576159135619-c67a1ee31e8a?w=400&h=300&fit=crop", title: "Rodent Removal", desc: "Humane rodent control and prevention", price: "From $299" },
      { image: "https://images.unsplash.com/photo-1591508463859-9fde2e969236?w=400&h=300&fit=crop", title: "Insect Control", desc: "Treatment for ants, roaches, and more", price: "From $199" }
    ]
  },
  testimonials: {
    heading: "Happy Homeowners",
    items: [
      { name: "Walter Fisher", company: "Homeowner", rating: 5, text: "Thorough, professional, and completely eliminated our problem!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Dorothy Hamilton", company: "Property Manager", rating: 5, text: "Reliable and effective. Safe for our residents!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "Christopher Wood", company: "Business Owner", rating: 5, text: "Professional service kept our restaurant pest-free!", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Keep Your Home Pest-Free",
    subheading: "Schedule your free pest inspection today",
    ctaText: "Book Inspection"
  },
  contact: {
    phone: "+1-800-BUG-FREE",
    email: "service@bugshield.com",
    hours: "Mon-Sat: 8AM-6PM"
  },
  footer: {
    companyName: "BugShield Pest Control",
    tagline: "A Pest-Free Home Is a Happy Home",
    address: "333 Shield Ln, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 BugShield Pest Control. All rights reserved."
  },
  seo: {
    title: "BugShield Pest Control - Professional Pest Control Services",
    description: "Pest control services including termite, rodent, and insect control with guaranteed results.",
    keywords: "pest control, termite control, rodent removal, insect control, exterminator"
  },
  styles: {
    primaryColor: "#dc2626",
    secondaryColor: "#b91c1c"
  },
  aboutUs: {
    heading: "About BugShield",
    description: "BugShield Pest Control has been protecting homes and businesses for over 20 years. We use safe, eco-friendly treatments that are effective against pests but safe for your family and pets.",
    values: [
      { title: "Effectiveness", desc: "Proven methods that eliminate pests" },
      { title: "Safety", desc: "Pet and family-friendly treatments" },
      { title: "Guarantee", desc: "If pests return, we treat for free" }
    ]
  },
  contactForm: {
    heading: "Request Free Inspection",
    subheading: "Let us assess your pest situation",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: true },
      { name: "message", label: "Describe Your Pest Issue", type: "textarea", required: false }
    ],
    submitText: "Book Inspection"
  }
};

const homeInspectionTemplate: TemplateData = {
  slug: "home-inspection",
  title: "InspectPro Home Inspections",
  themeId: "inspectpro",
  hero: {
    heading: "Professional Home Inspections",
    subheading: "Comprehensive home inspections for buyers and sellers",
    ctaText: "Schedule Inspection"
  },
  hero_image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&h=600&fit=crop",
  features: {
    heading: "Why InspectPro",
    items: [
      { icon: "🔍", title: "Thorough Inspection", desc: "Comprehensive examination of your entire property" },
      { icon: "📋", title: "Detailed Reports", desc: "Clear, easy-to-understand inspection reports" },
      { icon: "👨‍🔧", title: "Certified Inspectors", desc: "Licensed and certified home inspectors" },
      { icon: "⏰", title: "Quick Turnaround", desc: "Reports delivered within 24 hours" }
    ]
  },
  services: {
    heading: "Inspection Services",
    subheading: "Detailed property evaluations",
    items: [
      { image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop", title: "General Inspection", desc: "Complete home inspection and evaluation", price: "From $399" },
      { image: "https://images.unsplash.com/photo-1584622181563-430f63602d4b?w=400&h=300&fit=crop", title: "Pest & Termite", desc: "Specialized pest and termite inspection", price: "From $199" },
      { image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop", title: "Radon Testing", desc: "Radon and indoor air quality testing", price: "From $149" }
    ]
  },
  testimonials: {
    heading: "Client Feedback",
    items: [
      { name: "Henry Clark", company: "Real Estate Agent", rating: 5, text: "Detailed reports help my clients make informed decisions!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Dorothy Martinez", company: "Homebuyer", rating: 5, text: "Very thorough inspection. Excellent report quality!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "Frank Johnson", company: "Property Seller", rating: 5, text: "Professional and fair assessment. Highly recommend!", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Need a Home Inspection?",
    subheading: "Schedule your comprehensive inspection today",
    ctaText: "Book Now"
  },
  contact: {
    phone: "+1-800-INSPECT",
    email: "inspect@inspectpro.com",
    hours: "Mon-Sat: 8AM-6PM"
  },
  footer: {
    companyName: "InspectPro Home Inspections",
    tagline: "Know Your Home's Condition",
    address: "444 Inspect Ave, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 InspectPro. All rights reserved."
  },
  seo: {
    title: "InspectPro - Professional Home Inspection Services",
    description: "Certified home inspectors providing comprehensive inspections with detailed reports.",
    keywords: "home inspection, home inspector, property inspection, pest inspection"
  },
  styles: {
    primaryColor: "#0d9488",
    secondaryColor: "#0f766e"
  },
  aboutUs: {
    heading: "About InspectPro",
    description: "InspectPro Home Inspections has helped thousands of buyers and sellers make informed decisions. Our certified inspectors provide thorough examinations and detailed, easy-to-understand reports.",
    values: [
      { title: "Thoroughness", desc: "Comprehensive property examination" },
      { title: "Clarity", desc: "Clear, detailed inspection reports" },
      { title: "Speed", desc: "Reports delivered within 24 hours" }
    ]
  },
  contactForm: {
    heading: "Schedule Your Inspection",
    subheading: "Book your home inspection today",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: true },
      { name: "message", label: "Property Address & Details", type: "textarea", required: true }
    ],
    submitText: "Book Inspection"
  }
};

const handymanTemplate: TemplateData = {
  slug: "handyman",
  title: "FixIt Pro Handyman Services",
  themeId: "fixit",
  hero: {
    heading: "Expert Handyman Services",
    subheading: "Your trusted local handyman for all home repair needs",
    ctaText: "Get Free Quote"
  },
  hero_image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=600&fit=crop",
  features: {
    heading: "Why FixIt Pro",
    items: [
      { icon: "🔨", title: "Versatile Skills", desc: "Handle all types of home repairs and maintenance" },
      { icon: "⏱️", title: "On Time", desc: "Reliable and punctual service every time" },
      { icon: "💰", title: "Affordable", desc: "Competitive rates with transparent pricing" },
      { icon: "⭐", title: "Trusted", desc: "Local trusted handyman since 2010" }
    ]
  },
  services: {
    heading: "Services Available",
    subheading: "Complete handyman solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop", title: "General Repairs", desc: "Drywall, trim, shelves, and general fixes", price: "From $89/hour" },
      { image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop", title: "Home Maintenance", desc: "Regular maintenance and seasonal tasks", price: "From $79/hour" },
      { image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop", title: "Bathroom & Kitchen", desc: "Fixture installation and repairs", price: "From $99/hour" }
    ]
  },
  testimonials: {
    heading: "What Customers Say",
    items: [
      { name: "Margaret Allen", company: "Homeowner", rating: 5, text: "Dependable and trustworthy. Always happy with his work!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "Donald Collins", company: "Property Owner", rating: 5, text: "Great for emergency repairs. Very responsive!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Sarah Mitchell", company: "Business Manager", rating: 5, text: "Professional and efficient. Highly recommend!", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Need Something Fixed?",
    subheading: "Call your local handyman today",
    ctaText: "Call Now"
  },
  contact: {
    phone: "+1-800-FIXIT-PRO",
    email: "service@fixitpro.com",
    hours: "Mon-Sat: 7AM-7PM"
  },
  footer: {
    companyName: "FixIt Pro Handyman Services",
    tagline: "Your Home Repair Specialists",
    address: "555 Fix St, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 FixIt Pro Handyman. All rights reserved."
  },
  seo: {
    title: "FixIt Pro - Professional Handyman Services",
    description: "Local handyman services for repairs, maintenance, and home improvement projects.",
    keywords: "handyman, home repair, home maintenance, contractor, handyman services"
  },
  styles: {
    primaryColor: "#059669",
    secondaryColor: "#047857"
  },
  aboutUs: {
    heading: "About FixIt Pro",
    description: "FixIt Pro Handyman Services has been the trusted local handyman since 2010. Our skilled team handles everything from small repairs to complete home maintenance with reliability and fair pricing.",
    values: [
      { title: "Versatility", desc: "Wide range of repair and maintenance skills" },
      { title: "Reliability", desc: "Punctual and dependable service" },
      { title: "Value", desc: "Competitive rates with no hidden fees" }
    ]
  },
  contactForm: {
    heading: "Get a Free Quote",
    subheading: "Tell us about your repair or maintenance needs",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: false },
      { name: "message", label: "What Do You Need Fixed?", type: "textarea", required: true }
    ],
    submitText: "Request Quote"
  }
};

const dentistTemplate: TemplateData = {
  slug: "dentist",
  title: "BrightSmile Dental Clinic",
  themeId: "brightsmile",
  hero: {
    heading: "Your Smile, Our Priority",
    subheading: "Comprehensive dental care for the whole family with a gentle touch",
    ctaText: "Book Appointment"
  },
  hero_image: "/template-images/professional_pest_control_service.png?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose BrightSmile",
    items: [
      { icon: "🦷", title: "Expert Dentists", desc: "Experienced dental professionals with gentle care" },
      { icon: "✨", title: "Modern Technology", desc: "State-of-the-art dental equipment and techniques" },
      { icon: "💳", title: "Flexible Payment", desc: "Insurance accepted and financing available" },
      { icon: "😊", title: "Comfort First", desc: "Relaxing environment for anxiety-free visits" }
    ]
  },
  services: {
    heading: "Our Dental Services",
    subheading: "Complete dental care under one roof",
    items: [
      { image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=300&fit=crop", title: "General Dentistry", desc: "Cleanings, fillings, and preventive care", price: "From $99" },
      { image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=300&fit=crop", title: "Cosmetic Dentistry", desc: "Teeth whitening, veneers, and smile makeovers", price: "From $299" },
      { image: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&h=300&fit=crop", title: "Orthodontics", desc: "Braces, Invisalign, and teeth alignment", price: "From $2,999" }
    ]
  },
  testimonials: {
    heading: "Patient Reviews",
    items: [
      { name: "Jennifer Martinez", company: "Patient", rating: 5, text: "Best dental experience ever! The staff is so caring and gentle.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "Michael Thompson", company: "Patient", rating: 5, text: "Finally found a dentist my kids love! Highly recommend for families.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Sarah Chen", company: "Patient", rating: 5, text: "My smile transformation was amazing. Thank you BrightSmile!", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Ready for a Brighter Smile?",
    subheading: "Schedule your appointment today and get a free consultation",
    ctaText: "Schedule Now"
  },
  contact: {
    phone: "+1-800-BRIGHT-SMILE",
    email: "smile@brightsmile.com",
    hours: "Mon-Fri: 8AM-6PM, Sat: 9AM-3PM"
  },
  footer: {
    companyName: "BrightSmile Dental Clinic",
    tagline: "Creating Beautiful Smiles Since 2005",
    address: "123 Dental Way, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 BrightSmile Dental Clinic. All rights reserved."
  },
  seo: {
    title: "BrightSmile Dental Clinic - Family Dentistry & Cosmetic Care",
    description: "Comprehensive dental services including general dentistry, cosmetic procedures, and orthodontics.",
    keywords: "dentist, dental clinic, teeth whitening, braces, dental care, family dentist"
  },
  styles: {
    primaryColor: "#06b6d4",
    secondaryColor: "#0891b2"
  },
  aboutUs: {
    heading: "About BrightSmile",
    description: "BrightSmile Dental Clinic has been providing exceptional dental care since 2005. Our team of experienced dentists combines modern technology with a gentle approach to ensure comfortable, effective treatment for patients of all ages.",
    values: [
      { title: "Excellence", desc: "Highest standards in dental care" },
      { title: "Comfort", desc: "Gentle, anxiety-free experience" },
      { title: "Family", desc: "Care for patients of all ages" }
    ]
  },
  contactForm: {
    heading: "Book Your Appointment",
    subheading: "Schedule your visit or ask us a question",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: true },
      { name: "message", label: "Preferred Date & Time", type: "textarea", required: false }
    ],
    submitText: "Request Appointment"
  }
};

const flooringTemplate: TemplateData = {
  slug: "flooring",
  title: "FloorCraft Flooring Solutions",
  themeId: "floorcraft",
  hero: {
    heading: "Premium Flooring Installation",
    subheading: "Transform your space with beautiful, durable floors that last a lifetime",
    ctaText: "Get Free Estimate"
  },
  hero_image: "/template-images/professional_flooring_installation.png?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose FloorCraft",
    items: [
      { icon: "🏠", title: "Expert Installation", desc: "Professional flooring installers with 20+ years experience" },
      { icon: "🪵", title: "Quality Materials", desc: "Premium hardwood, laminate, vinyl, and tile options" },
      { icon: "💰", title: "Best Prices", desc: "Competitive pricing with free in-home estimates" },
      { icon: "✅", title: "Lifetime Warranty", desc: "Installation backed by comprehensive warranty" }
    ]
  },
  services: {
    heading: "Flooring Services",
    subheading: "Complete flooring solutions for every room",
    items: [
      { image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400&h=300&fit=crop", title: "Hardwood Flooring", desc: "Classic solid and engineered hardwood installation", price: "From $8/sq ft" },
      { image: "https://images.unsplash.com/photo-1615873968403-89e068629265?w=400&h=300&fit=crop", title: "Luxury Vinyl", desc: "Waterproof luxury vinyl plank and tile", price: "From $5/sq ft" },
      { image: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400&h=300&fit=crop", title: "Tile & Stone", desc: "Ceramic, porcelain, and natural stone tile", price: "From $10/sq ft" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Robert Williams", company: "Homeowner", rating: 5, text: "Beautiful hardwood floors installed perfectly. Absolutely love them!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Amanda Foster", company: "Interior Designer", rating: 5, text: "My go-to flooring company for all client projects. Always exceptional!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "David Park", company: "Property Developer", rating: 5, text: "Fast, professional, and great quality. Highly recommend FloorCraft!", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Ready for New Floors?",
    subheading: "Get your free in-home estimate today",
    ctaText: "Schedule Estimate"
  },
  contact: {
    phone: "+1-800-FLOORS",
    email: "info@floorcraft.com",
    hours: "Mon-Sat: 8AM-6PM"
  },
  footer: {
    companyName: "FloorCraft Flooring Solutions",
    tagline: "Beautiful Floors, Expert Installation",
    address: "456 Floor St, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 FloorCraft Flooring. All rights reserved."
  },
  seo: {
    title: "FloorCraft - Professional Flooring Installation Services",
    description: "Premium flooring installation including hardwood, vinyl, laminate, and tile flooring.",
    keywords: "flooring, hardwood floors, vinyl flooring, tile installation, floor installation"
  },
  styles: {
    primaryColor: "#92400e",
    secondaryColor: "#78350f"
  },
  aboutUs: {
    heading: "About FloorCraft",
    description: "FloorCraft Flooring has been transforming homes with beautiful floors for over 20 years. Our expert installers work with the finest materials to deliver stunning results that stand the test of time.",
    values: [
      { title: "Quality", desc: "Premium materials and expert craftsmanship" },
      { title: "Experience", desc: "20+ years of flooring expertise" },
      { title: "Guarantee", desc: "Lifetime warranty on installation" }
    ]
  },
  contactForm: {
    heading: "Get Free Estimate",
    subheading: "Tell us about your flooring project",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: true },
      { name: "message", label: "Project Details (Room size, flooring type)", type: "textarea", required: true }
    ],
    submitText: "Request Estimate"
  }
};

const windowsTemplate: TemplateData = {
  slug: "windows",
  title: "ClearView Windows & Doors",
  themeId: "clearview",
  hero: {
    heading: "Premium Window & Door Solutions",
    subheading: "Energy-efficient windows and doors that enhance your home's beauty and comfort",
    ctaText: "Free Consultation"
  },
  hero_image: "/template-images/professional_window_installation_service.png?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose ClearView",
    items: [
      { icon: "🪟", title: "Quality Windows", desc: "Premium vinyl, wood, and fiberglass options" },
      { icon: "⚡", title: "Energy Efficient", desc: "Lower energy bills with ENERGY STAR rated products" },
      { icon: "🔧", title: "Expert Installation", desc: "Factory-trained certified installers" },
      { icon: "🏆", title: "Lifetime Warranty", desc: "Comprehensive coverage on all products" }
    ]
  },
  services: {
    heading: "Our Services",
    subheading: "Complete window and door solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=400&h=300&fit=crop", title: "Window Replacement", desc: "Double-hung, casement, sliding, and specialty windows", price: "From $399/window" },
      { image: "https://images.unsplash.com/photo-1555636222-cae831e670b3?w=400&h=300&fit=crop", title: "Entry Doors", desc: "Beautiful, secure front doors and patio doors", price: "From $899" },
      { image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop", title: "Window Repair", desc: "Glass replacement, seal repair, and hardware fixes", price: "From $149" }
    ]
  },
  testimonials: {
    heading: "Customer Testimonials",
    items: [
      { name: "Karen Mitchell", company: "Homeowner", rating: 5, text: "Our new windows are beautiful and our energy bills dropped 30%!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "James Anderson", company: "Homeowner", rating: 5, text: "Professional installation, great cleanup. Highly recommend!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Lisa Garcia", company: "Real Estate Agent", rating: 5, text: "ClearView adds real value to homes. My clients love them!", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Upgrade Your Windows Today",
    subheading: "Get a free in-home consultation and estimate",
    ctaText: "Schedule Consultation"
  },
  contact: {
    phone: "+1-800-WINDOWS",
    email: "info@clearviewwindows.com",
    hours: "Mon-Sat: 8AM-6PM"
  },
  footer: {
    companyName: "ClearView Windows & Doors",
    tagline: "See the Difference Quality Makes",
    address: "789 Glass Ave, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 ClearView Windows & Doors. All rights reserved."
  },
  seo: {
    title: "ClearView Windows & Doors - Premium Window Replacement",
    description: "Energy-efficient window and door replacement with professional installation and lifetime warranty.",
    keywords: "window replacement, window repair, energy efficient windows, entry doors, patio doors"
  },
  styles: {
    primaryColor: "#3b82f6",
    secondaryColor: "#2563eb"
  },
  aboutUs: {
    heading: "About ClearView",
    description: "ClearView Windows & Doors has been helping homeowners upgrade their homes for over 25 years. We offer premium, energy-efficient products installed by factory-trained professionals, all backed by our lifetime warranty.",
    values: [
      { title: "Quality", desc: "Premium products from trusted manufacturers" },
      { title: "Efficiency", desc: "Energy savings that pay for themselves" },
      { title: "Service", desc: "Professional installation and support" }
    ]
  },
  contactForm: {
    heading: "Free Consultation",
    subheading: "Schedule your in-home estimate today",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: true },
      { name: "message", label: "Project Details (Number of windows, etc.)", type: "textarea", required: false }
    ],
    submitText: "Request Consultation"
  }
};

const moversTemplate: TemplateData = {
  slug: "movers",
  title: "SwiftMove Movers & Packers",
  themeId: "swiftmove",
  hero: {
    heading: "Stress-Free Moving Services",
    subheading: "Professional movers and packers for local and long-distance relocations",
    ctaText: "Get Free Quote"
  },
  hero_image: "/template-images/professional_home_inspection_service.png?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose SwiftMove",
    items: [
      { icon: "📦", title: "Full Service", desc: "Packing, loading, transport, and unpacking" },
      { icon: "🛡️", title: "Fully Insured", desc: "Complete protection for your belongings" },
      { icon: "⏰", title: "On-Time Delivery", desc: "Reliable scheduling and punctual service" },
      { icon: "💪", title: "Trained Movers", desc: "Professional, careful handling of your items" }
    ]
  },
  services: {
    heading: "Moving Services",
    subheading: "Complete relocation solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=300&fit=crop", title: "Local Moving", desc: "Same-day local moves with careful handling", price: "From $299" },
      { image: "https://images.unsplash.com/photo-1600518464441-9306c5188764?w=400&h=300&fit=crop", title: "Long Distance", desc: "Interstate and cross-country relocations", price: "From $1,499" },
      { image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop", title: "Packing Services", desc: "Professional packing and crating services", price: "From $199" }
    ]
  },
  testimonials: {
    heading: "Customer Stories",
    items: [
      { name: "Emily Roberts", company: "Recent Mover", rating: 5, text: "Smoothest move ever! The team was fast, careful, and super friendly.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "Daniel Kim", company: "Business Owner", rating: 5, text: "Relocated our office seamlessly. Minimal downtime, maximum care!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Rachel Thompson", company: "Family Move", rating: 5, text: "They treated our belongings like their own. Highly recommend!", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Ready to Move?",
    subheading: "Get your free, no-obligation moving quote today",
    ctaText: "Get Free Quote"
  },
  contact: {
    phone: "+1-800-SWIFT-MOVE",
    email: "move@swiftmove.com",
    hours: "Mon-Sat: 7AM-8PM, Sun: 9AM-5PM"
  },
  footer: {
    companyName: "SwiftMove Movers & Packers",
    tagline: "Moving Made Simple",
    address: "321 Moving Blvd, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 SwiftMove Movers & Packers. All rights reserved."
  },
  seo: {
    title: "SwiftMove - Professional Movers & Packers Services",
    description: "Full-service moving company for local and long-distance relocations with packing services.",
    keywords: "movers, packers, moving company, local movers, long distance moving, relocation"
  },
  styles: {
    primaryColor: "#f97316",
    secondaryColor: "#ea580c"
  },
  aboutUs: {
    heading: "About SwiftMove",
    description: "SwiftMove Movers & Packers has been helping families and businesses relocate for over 15 years. Our trained professionals handle every move with care, ensuring your belongings arrive safely and on time.",
    values: [
      { title: "Care", desc: "Treating your belongings like our own" },
      { title: "Reliability", desc: "On-time delivery, every time" },
      { title: "Protection", desc: "Full insurance for peace of mind" }
    ]
  },
  contactForm: {
    heading: "Get Free Moving Quote",
    subheading: "Tell us about your move",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: true },
      { name: "message", label: "Move Details (From, To, Date)", type: "textarea", required: true }
    ],
    submitText: "Get Quote"
  }
};

const poolServicesTemplate: TemplateData = {
  slug: "pool-services",
  title: "AquaCare Pool Services",
  themeId: "aquacare",
  hero: {
    heading: "Professional Pool Care",
    subheading: "Expert pool maintenance, repair, and renovation services",
    ctaText: "Get Free Quote"
  },
  hero_image: "/template-images/professional_handyman_repair_service.png?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose AquaCare",
    items: [
      { icon: "🏊", title: "Certified Technicians", desc: "CPO certified pool professionals" },
      { icon: "🧪", title: "Water Chemistry", desc: "Perfect water balance for safe swimming" },
      { icon: "🔧", title: "Equipment Repair", desc: "Expert repair of pumps, filters, and heaters" },
      { icon: "📅", title: "Weekly Service", desc: "Reliable scheduled maintenance plans" }
    ]
  },
  services: {
    heading: "Pool Services",
    subheading: "Complete pool care solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400&h=300&fit=crop", title: "Weekly Maintenance", desc: "Regular cleaning, chemical balance, and equipment check", price: "From $149/month" },
      { image: "https://images.unsplash.com/photo-1572331165267-854da2b10ccc?w=400&h=300&fit=crop", title: "Pool Repair", desc: "Pump, filter, heater, and liner repairs", price: "From $199" },
      { image: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=400&h=300&fit=crop", title: "Pool Renovation", desc: "Resurfacing, tile work, and complete remodels", price: "From $3,999" }
    ]
  },
  testimonials: {
    heading: "Happy Pool Owners",
    items: [
      { name: "Christopher Davis", company: "Pool Owner", rating: 5, text: "Our pool has never looked better! Reliable weekly service.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Jessica White", company: "Homeowner", rating: 5, text: "Fixed our pump quickly and at a fair price. Great team!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "Mark Johnson", company: "Property Manager", rating: 5, text: "AquaCare keeps all our community pools in perfect condition.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Ready for Crystal Clear Water?",
    subheading: "Schedule your pool service or repair today",
    ctaText: "Contact Us"
  },
  contact: {
    phone: "+1-800-POOL-CARE",
    email: "service@aquacarepools.com",
    hours: "Mon-Sat: 7AM-6PM"
  },
  footer: {
    companyName: "AquaCare Pool Services",
    tagline: "Your Pool, Our Passion",
    address: "555 Pool Lane, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 AquaCare Pool Services. All rights reserved."
  },
  seo: {
    title: "AquaCare - Professional Pool Maintenance & Repair Services",
    description: "Expert pool services including weekly maintenance, equipment repair, and pool renovation.",
    keywords: "pool service, pool maintenance, pool repair, pool cleaning, swimming pool"
  },
  styles: {
    primaryColor: "#0ea5e9",
    secondaryColor: "#0284c7"
  },
  aboutUs: {
    heading: "About AquaCare",
    description: "AquaCare Pool Services has been keeping pools crystal clear for over 20 years. Our CPO certified technicians provide reliable maintenance, expert repairs, and stunning renovations for residential and commercial pools.",
    values: [
      { title: "Expertise", desc: "Certified pool professionals" },
      { title: "Reliability", desc: "Consistent, on-time service" },
      { title: "Quality", desc: "Premium products and workmanship" }
    ]
  },
  contactForm: {
    heading: "Request Pool Service",
    subheading: "Tell us about your pool care needs",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: true },
      { name: "message", label: "Service Needed", type: "textarea", required: false }
    ],
    submitText: "Request Service"
  }
};

const travelAgencyTemplate: TemplateData = {
  slug: "travel-agency",
  title: "Wanderlust Travel Agency",
  themeId: "wanderlust",
  hero: {
    heading: "Your Dream Vacation Awaits",
    subheading: "Personalized travel planning and unforgettable vacation experiences",
    ctaText: "Plan Your Trip"
  },
  hero_image: "/template-images/professional_pool_maintenance_service.png?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Book With Us",
    items: [
      { icon: "🌍", title: "Expert Planning", desc: "Personalized itineraries crafted by travel experts" },
      { icon: "💰", title: "Best Prices", desc: "Exclusive deals and price match guarantee" },
      { icon: "📞", title: "24/7 Support", desc: "Round-the-clock assistance during your trip" },
      { icon: "⭐", title: "VIP Experiences", desc: "Access to exclusive tours and experiences" }
    ]
  },
  services: {
    heading: "Travel Packages",
    subheading: "Curated vacations for every traveler",
    items: [
      { image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop", title: "Beach Getaways", desc: "Tropical paradises with crystal clear waters", price: "From $999" },
      { image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop", title: "European Tours", desc: "Historic cities and cultural experiences", price: "From $1,999" },
      { image: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=400&h=300&fit=crop", title: "Adventure Travel", desc: "Hiking, safaris, and thrilling expeditions", price: "From $2,499" }
    ]
  },
  testimonials: {
    heading: "Traveler Reviews",
    items: [
      { name: "Sarah Mitchell", company: "Honeymooners", rating: 5, text: "They planned our perfect honeymoon. Every detail was amazing!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "John Peterson", company: "Family Vacation", rating: 5, text: "Best family trip ever! The kids are still talking about it.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Maria Rodriguez", company: "Solo Traveler", rating: 5, text: "Felt safe and supported throughout my solo adventure!", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Start Your Adventure",
    subheading: "Let us plan your dream vacation today",
    ctaText: "Get Free Consultation"
  },
  contact: {
    phone: "+1-800-TRAVEL",
    email: "hello@wanderlusttravel.com",
    hours: "Mon-Sat: 9AM-8PM, Sun: 10AM-6PM"
  },
  footer: {
    companyName: "Wanderlust Travel Agency",
    tagline: "Adventure Awaits",
    address: "123 Travel Way, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Destinations", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 Wanderlust Travel Agency. All rights reserved."
  },
  seo: {
    title: "Wanderlust Travel Agency - Personalized Vacation Planning",
    description: "Expert travel agency offering customized vacation packages, honeymoons, and adventure travel.",
    keywords: "travel agency, vacation packages, honeymoon, travel planning, tours"
  },
  styles: {
    primaryColor: "#10b981",
    secondaryColor: "#059669"
  },
  aboutUs: {
    heading: "About Wanderlust",
    description: "Wanderlust Travel Agency has been creating unforgettable travel experiences for over 15 years. Our expert travel consultants work with you to craft personalized itineraries that turn your travel dreams into reality.",
    values: [
      { title: "Personalization", desc: "Custom trips tailored to you" },
      { title: "Expertise", desc: "Insider knowledge from travel pros" },
      { title: "Support", desc: "24/7 assistance wherever you go" }
    ]
  },
  contactForm: {
    heading: "Plan Your Trip",
    subheading: "Tell us about your dream vacation",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: false },
      { name: "message", label: "Where would you like to go?", type: "textarea", required: true }
    ],
    submitText: "Get Quote"
  }
};

const flightBookingTemplate: TemplateData = {
  slug: "flight-booking",
  title: "SkyWay Flights",
  themeId: "skyway",
  hero: {
    heading: "Find Your Perfect Flight",
    subheading: "Compare prices and book flights to destinations worldwide",
    ctaText: "Search Flights"
  },
  hero_image: "/template-images/tropical_vacation_travel_destination.png?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Book With SkyWay",
    items: [
      { icon: "✈️", title: "Best Prices", desc: "Compare fares across all major airlines" },
      { icon: "🔒", title: "Secure Booking", desc: "Safe and secure payment processing" },
      { icon: "📧", title: "Instant Confirmation", desc: "E-tickets delivered to your inbox" },
      { icon: "💬", title: "24/7 Support", desc: "Help available around the clock" }
    ]
  },
  services: {
    heading: "Flight Options",
    subheading: "Find the right flight for your journey",
    items: [
      { image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop", title: "Domestic Flights", desc: "Affordable flights within the country", price: "From $89" },
      { image: "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=400&h=300&fit=crop", title: "International", desc: "Worldwide destinations at great prices", price: "From $299" },
      { image: "https://images.unsplash.com/photo-1540339832862-474599807836?w=400&h=300&fit=crop", title: "Business Class", desc: "Premium comfort for business travelers", price: "From $899" }
    ]
  },
  testimonials: {
    heading: "Traveler Feedback",
    items: [
      { name: "Alex Johnson", company: "Frequent Flyer", rating: 5, text: "Always find the best prices here. Super easy booking process!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Linda Chen", company: "Business Traveler", rating: 5, text: "My go-to for business travel. Fast, reliable, and great service.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "Marcus Brown", company: "Family Travel", rating: 5, text: "Booked flights for our family of 5. Great deals and easy process!", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Ready to Fly?",
    subheading: "Search and book your flights in minutes",
    ctaText: "Book Now"
  },
  contact: {
    phone: "+1-800-SKYWAY",
    email: "support@skywayflights.com",
    hours: "24/7 Support Available"
  },
  footer: {
    companyName: "SkyWay Flights",
    tagline: "Your Journey Starts Here",
    address: "456 Aviation Blvd, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Destinations", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 SkyWay Flights. All rights reserved."
  },
  seo: {
    title: "SkyWay Flights - Compare & Book Cheap Flights Online",
    description: "Find and book affordable flights to destinations worldwide. Compare prices across airlines.",
    keywords: "flights, cheap flights, airfare, flight booking, airline tickets"
  },
  styles: {
    primaryColor: "#6366f1",
    secondaryColor: "#4f46e5"
  },
  aboutUs: {
    heading: "About SkyWay",
    description: "SkyWay Flights makes finding and booking flights simple. We compare prices across all major airlines to help you find the best deals, whether you're flying for business or pleasure.",
    values: [
      { title: "Value", desc: "Best prices guaranteed" },
      { title: "Simplicity", desc: "Easy search and booking" },
      { title: "Support", desc: "Help when you need it" }
    ]
  },
  contactForm: {
    heading: "Need Help Booking?",
    subheading: "Our travel experts are here to assist",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: false },
      { name: "message", label: "How can we help?", type: "textarea", required: true }
    ],
    submitText: "Submit"
  }
};

const cruiseBookingTemplate: TemplateData = {
  slug: "cruise-booking",
  title: "OceanVoyage Cruises",
  themeId: "oceanvoyage",
  hero: {
    heading: "Set Sail on Your Dream Cruise",
    subheading: "Luxury cruises to breathtaking destinations around the world",
    ctaText: "Explore Cruises"
  },
  hero_image: "/template-images/commercial_flight_airline_service.png?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Cruise With Us",
    items: [
      { icon: "🚢", title: "Premium Ships", desc: "Luxury cruise lines with world-class amenities" },
      { icon: "🌴", title: "Top Destinations", desc: "Caribbean, Mediterranean, Alaska, and more" },
      { icon: "🍽️", title: "All-Inclusive", desc: "Dining, entertainment, and activities included" },
      { icon: "💎", title: "VIP Perks", desc: "Exclusive onboard credits and upgrades" }
    ]
  },
  services: {
    heading: "Popular Cruises",
    subheading: "Discover our most loved itineraries",
    items: [
      { image: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=300&fit=crop", title: "Caribbean Paradise", desc: "7-night cruise to tropical islands", price: "From $799/person" },
      { image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop", title: "Mediterranean Explorer", desc: "10-night cruise through historic ports", price: "From $1,299/person" },
      { image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=300&fit=crop", title: "Alaska Adventure", desc: "7-night cruise through glaciers and wildlife", price: "From $999/person" }
    ]
  },
  testimonials: {
    heading: "Cruise Reviews",
    items: [
      { name: "Patricia Williams", company: "Anniversary Trip", rating: 5, text: "The most romantic week of our lives! Everything was perfect.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "Robert Taylor", company: "Family Vacation", rating: 5, text: "Kids had a blast! So much to do for the whole family.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Nancy Martinez", company: "Group Travel", rating: 5, text: "Organized a group cruise - it was incredible! Will book again.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Your Adventure Awaits",
    subheading: "Book your dream cruise and save up to 40%",
    ctaText: "View Deals"
  },
  contact: {
    phone: "+1-800-CRUISES",
    email: "sail@oceanvoyage.com",
    hours: "Mon-Sun: 8AM-10PM"
  },
  footer: {
    companyName: "OceanVoyage Cruises",
    tagline: "Sail Into Adventure",
    address: "789 Harbor Dr, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Destinations", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 OceanVoyage Cruises. All rights reserved."
  },
  seo: {
    title: "OceanVoyage - Book Luxury Cruise Vacations Online",
    description: "Find and book luxury cruises to Caribbean, Mediterranean, Alaska and more destinations.",
    keywords: "cruise, cruise booking, Caribbean cruise, Mediterranean cruise, Alaska cruise"
  },
  styles: {
    primaryColor: "#0891b2",
    secondaryColor: "#0e7490"
  },
  aboutUs: {
    heading: "About OceanVoyage",
    description: "OceanVoyage Cruises partners with the world's top cruise lines to bring you unforgettable vacation experiences. From tropical getaways to expedition adventures, we help you find the perfect cruise at the best price.",
    values: [
      { title: "Selection", desc: "Access to all major cruise lines" },
      { title: "Value", desc: "Exclusive deals and onboard credits" },
      { title: "Expertise", desc: "Cruise specialists to guide you" }
    ]
  },
  contactForm: {
    heading: "Plan Your Cruise",
    subheading: "Tell us where you want to sail",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: false },
      { name: "message", label: "Destination & Travel Dates", type: "textarea", required: true }
    ],
    submitText: "Get Cruise Quote"
  }
};

const carRentalTemplate: TemplateData = {
  slug: "car-rental",
  title: "DriveEasy Car Rentals",
  themeId: "driveeasy",
  hero: {
    heading: "Rent Your Perfect Ride",
    subheading: "Quality rental cars at affordable prices for any journey",
    ctaText: "Find Your Car"
  },
  hero_image: "/template-images/luxury_cruise_ship_vacation.png?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Rent With Us",
    items: [
      { icon: "🚗", title: "Wide Selection", desc: "Economy to luxury vehicles available" },
      { icon: "💵", title: "Best Rates", desc: "Competitive daily and weekly pricing" },
      { icon: "📍", title: "Convenient Locations", desc: "Airport and city center pickup points" },
      { icon: "🛡️", title: "Full Insurance", desc: "Comprehensive coverage included" }
    ]
  },
  services: {
    heading: "Our Fleet",
    subheading: "Find the right vehicle for your needs",
    items: [
      { image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop", title: "Economy Cars", desc: "Fuel-efficient compact cars for city driving", price: "From $29/day" },
      { image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop", title: "SUVs & Crossovers", desc: "Spacious vehicles for families and groups", price: "From $49/day" },
      { image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop", title: "Luxury & Sports", desc: "Premium vehicles for special occasions", price: "From $99/day" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Jason Wright", company: "Business Traveler", rating: 5, text: "Quick pickup, clean car, hassle-free return. Perfect rental!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Michelle Lee", company: "Vacation Renter", rating: 5, text: "Great rates for our family road trip. The SUV was spotless!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "Carlos Rivera", company: "Weekend Renter", rating: 5, text: "Rented a convertible for our anniversary. Made it extra special!", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" }
    ]
  },
  cta: {
    heading: "Ready to Hit the Road?",
    subheading: "Book your rental car in minutes",
    ctaText: "Reserve Now"
  },
  contact: {
    phone: "+1-800-DRIVE-EZ",
    email: "rentals@driveeasy.com",
    hours: "24/7 Reservations"
  },
  footer: {
    companyName: "DriveEasy Car Rentals",
    tagline: "Your Journey, Your Way",
    address: "321 Auto Center Dr, Your City, ST 12345",
    links: [
      { text: "Privacy Policy", href: "/policies/privacy.html" },
      { text: "Terms of Service", href: "/policies/terms.html" },
      { text: "Fleet", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    copyright: "© 2024 DriveEasy Car Rentals. All rights reserved."
  },
  seo: {
    title: "DriveEasy Car Rentals - Affordable Car Rental Services",
    description: "Rent quality vehicles at competitive prices. Economy, SUV, and luxury cars available.",
    keywords: "car rental, rental car, car hire, vehicle rental, cheap car rental"
  },
  styles: {
    primaryColor: "#dc2626",
    secondaryColor: "#b91c1c"
  },
  aboutUs: {
    heading: "About DriveEasy",
    description: "DriveEasy Car Rentals has been providing quality rental vehicles for over 20 years. With a diverse fleet and convenient locations, we make it easy to get on the road whether you're traveling for business or pleasure.",
    values: [
      { title: "Quality", desc: "Well-maintained, clean vehicles" },
      { title: "Value", desc: "Competitive pricing, no hidden fees" },
      { title: "Convenience", desc: "Easy booking, quick pickup" }
    ]
  },
  contactForm: {
    heading: "Reserve Your Vehicle",
    subheading: "Tell us about your rental needs",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "phone", required: true },
      { name: "message", label: "Pickup Location & Dates", type: "textarea", required: true }
    ],
    submitText: "Get Quote"
  }
};

const locksmithTemplate: TemplateData = {
  slug: "locksmith",
  title: "SecureLock Locksmith",
  themeId: "securelock",
  hero: {
    heading: "24/7 Emergency Locksmith Services",
    subheading: "Fast, reliable locksmith services for homes, businesses, and vehicles",
    ctaText: "Call Now"
  },
  hero_image: "/template-images/professional_window_installation_service.png?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose SecureLock",
    items: [
      { icon: "🔐", title: "24/7 Available", desc: "Emergency service around the clock" },
      { icon: "⚡", title: "Fast Response", desc: "15-30 minute arrival time" },
      { icon: "🛡️", title: "Licensed & Bonded", desc: "Fully insured professionals" },
      { icon: "✅", title: "Upfront Pricing", desc: "No hidden fees, transparent quotes" }
    ]
  },
  services: {
    heading: "Our Services",
    subheading: "Complete locksmith solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&h=300&fit=crop", title: "Emergency Lockout", desc: "Locked out? We'll get you back in quickly", price: "From $49" },
      { image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=300&fit=crop", title: "Lock Replacement", desc: "New locks installed for enhanced security", price: "From $89" },
      { image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop", title: "Key Duplication", desc: "Fast key copying for all lock types", price: "From $15" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Mike Thompson", company: "Homeowner", rating: 5, text: "Locked out at midnight and they were there in 20 minutes. Lifesaver!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Lisa Garcia", company: "Business Owner", rating: 5, text: "Rekeyed all our office locks quickly and professionally.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Locked Out? Call Now!", subheading: "We're available 24/7 for emergencies", ctaText: "Call 24/7" },
  contact: { phone: "+1-800-LOCK-NOW", email: "help@securelock.com", hours: "24/7 Emergency Service" },
  footer: { companyName: "SecureLock Locksmith", tagline: "Your Security Is Our Priority", address: "Mobile Service - Your Area", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 SecureLock Locksmith" },
  seo: { title: "SecureLock - 24/7 Emergency Locksmith", description: "Fast, reliable locksmith services. Available 24/7.", keywords: "locksmith, emergency lockout, lock replacement, key duplication" },
  styles: { primaryColor: "#1e40af", secondaryColor: "#1d4ed8" },
  aboutUs: { heading: "About SecureLock", description: "SecureLock Locksmith has served our community for over 15 years with fast, reliable locksmith services.", values: [{ title: "Speed", desc: "Fast 15-30 min response" }, { title: "Trust", desc: "Licensed & insured techs" }, { title: "Quality", desc: "Top-grade locks & hardware" }] },
  contactForm: { heading: "Request Service", subheading: "Tell us about your lock situation", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Issue Description", type: "textarea", required: true }], submitText: "Get Help Now" }
};

const garageDoorTemplate: TemplateData = {
  slug: "garage-door",
  title: "DoorPro Garage Services",
  themeId: "doorpro",
  hero: {
    heading: "Expert Garage Door Repair & Installation",
    subheading: "Professional garage door services for residential and commercial properties",
    ctaText: "Free Estimate"
  },
  hero_image: "https://images.unsplash.com/photo-1558767132-cb76ffe7ad00?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose DoorPro",
    items: [
      { icon: "🚪", title: "All Brands", desc: "Service all major garage door brands" },
      { icon: "⚡", title: "Same Day", desc: "Same-day service available" },
      { icon: "🛠️", title: "Expert Techs", desc: "Factory-trained technicians" },
      { icon: "✅", title: "Warranty", desc: "Parts and labor warranty" }
    ]
  },
  services: {
    heading: "Our Services",
    subheading: "Complete garage door solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1558767132-cb76ffe7ad00?w=400&h=300&fit=crop", title: "Door Repair", desc: "Fix broken springs, cables, and openers", price: "From $99" },
      { image: "https://images.unsplash.com/photo-1558767132-a2dd8b3f2e4f?w=400&h=300&fit=crop", title: "New Installation", desc: "Professional garage door installation", price: "From $799" },
      { image: "https://images.unsplash.com/photo-1558767132-d63ca1b67c4c?w=400&h=300&fit=crop", title: "Opener Install", desc: "Smart garage door opener installation", price: "From $299" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Tom Wilson", company: "Homeowner", rating: 5, text: "Fixed my broken spring same day. Great service!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Nancy Clark", company: "Business Owner", rating: 5, text: "Installed new commercial doors perfectly.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Need Garage Door Service?", subheading: "Get a free estimate today", ctaText: "Get Free Quote" },
  contact: { phone: "+1-800-DOOR-PRO", email: "service@doorpro.com", hours: "Mon-Sat: 7AM-7PM" },
  footer: { companyName: "DoorPro Garage Services", tagline: "Your Trusted Garage Door Experts", address: "456 Industrial Way, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 DoorPro" },
  seo: { title: "DoorPro - Garage Door Repair & Installation", description: "Expert garage door repair and installation services.", keywords: "garage door repair, garage door installation, opener repair" },
  styles: { primaryColor: "#ea580c", secondaryColor: "#c2410c" },
  aboutUs: { heading: "About DoorPro", description: "DoorPro has been the trusted name in garage door services for over 20 years.", values: [{ title: "Quality", desc: "Premium parts & materials" }, { title: "Experience", desc: "20+ years in business" }, { title: "Service", desc: "Customer satisfaction guaranteed" }] },
  contactForm: { heading: "Schedule Service", subheading: "Get your free estimate", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Describe Your Issue", type: "textarea", required: true }], submitText: "Request Quote" }
};

const applianceRepairTemplate: TemplateData = {
  slug: "appliance-repair",
  title: "ApplianceFix Pro",
  themeId: "appliancefix",
  hero: {
    heading: "Expert Appliance Repair Services",
    subheading: "Fast, affordable repairs for all major home appliances",
    ctaText: "Schedule Repair"
  },
  hero_image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose ApplianceFix",
    items: [
      { icon: "🔧", title: "All Brands", desc: "Repair all major appliance brands" },
      { icon: "⚡", title: "Same Day", desc: "Same-day service available" },
      { icon: "💰", title: "Fair Pricing", desc: "Upfront, honest pricing" },
      { icon: "✅", title: "90-Day Warranty", desc: "Parts and labor guaranteed" }
    ]
  },
  services: {
    heading: "Appliances We Repair",
    subheading: "Expert service for all major appliances",
    items: [
      { image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=300&fit=crop", title: "Refrigerator", desc: "Not cooling? Ice maker broken? We fix it", price: "From $89" },
      { image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=300&fit=crop", title: "Washer/Dryer", desc: "Washer and dryer repair services", price: "From $79" },
      { image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=300&fit=crop", title: "Dishwasher", desc: "Not cleaning? Leaking? We can help", price: "From $69" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Carol Martinez", company: "Homeowner", rating: 5, text: "Fixed my refrigerator same day. Very professional!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "James Lee", company: "Homeowner", rating: 5, text: "Great service, fair price. Highly recommend!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Appliance Acting Up?", subheading: "Don't replace it - let us fix it!", ctaText: "Call Now" },
  contact: { phone: "+1-800-FIX-FAST", email: "repair@appliancefix.com", hours: "Mon-Sat: 8AM-6PM" },
  footer: { companyName: "ApplianceFix Pro", tagline: "We Fix It Right", address: "789 Service Blvd, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 ApplianceFix Pro" },
  seo: { title: "ApplianceFix - Home Appliance Repair", description: "Expert repair for refrigerators, washers, dryers, and more.", keywords: "appliance repair, refrigerator repair, washer repair, dryer repair" },
  styles: { primaryColor: "#0891b2", secondaryColor: "#0e7490" },
  aboutUs: { heading: "About ApplianceFix", description: "ApplianceFix Pro has been keeping homes running smoothly for 15+ years with expert appliance repair.", values: [{ title: "Expertise", desc: "Factory-trained technicians" }, { title: "Speed", desc: "Same-day service" }, { title: "Value", desc: "Repair, don't replace" }] },
  contactForm: { heading: "Schedule Repair", subheading: "Tell us about your appliance issue", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Appliance & Issue", type: "textarea", required: true }], submitText: "Schedule Now" }
};

const pressureWashingTemplate: TemplateData = {
  slug: "pressure-washing",
  title: "PowerWash Pro",
  themeId: "powerwash",
  hero: {
    heading: "Professional Pressure Washing Services",
    subheading: "Restore your property's curb appeal with our expert cleaning",
    ctaText: "Free Estimate"
  },
  hero_image: "https://images.unsplash.com/photo-1581092920283-e8dff16e9dca?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose PowerWash",
    items: [
      { icon: "💦", title: "High-Power Clean", desc: "Commercial-grade equipment" },
      { icon: "🏠", title: "All Surfaces", desc: "Driveways, decks, siding & more" },
      { icon: "🌿", title: "Eco-Friendly", desc: "Safe, biodegradable cleaners" },
      { icon: "✅", title: "Satisfaction", desc: "100% satisfaction guaranteed" }
    ]
  },
  services: {
    heading: "Our Services",
    subheading: "Complete exterior cleaning",
    items: [
      { image: "https://images.unsplash.com/photo-1581092920283-e8dff16e9dca?w=400&h=300&fit=crop", title: "Driveway Cleaning", desc: "Remove oil stains, dirt, and grime", price: "From $99" },
      { image: "https://images.unsplash.com/photo-1581092920295-0c33ecf8d206?w=400&h=300&fit=crop", title: "House Washing", desc: "Soft wash siding and trim", price: "From $199" },
      { image: "https://images.unsplash.com/photo-1581092920220-5f1f63a1a5f0?w=400&h=300&fit=crop", title: "Deck Restoration", desc: "Clean and prep decks", price: "From $149" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Steve Adams", company: "Homeowner", rating: 5, text: "My driveway looks brand new! Amazing transformation.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Karen White", company: "Homeowner", rating: 5, text: "They did our whole house exterior. Looks fantastic!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Ready for a Clean Property?", subheading: "Get your free estimate today", ctaText: "Get Quote" },
  contact: { phone: "+1-800-WASH-PRO", email: "clean@powerwash.com", hours: "Mon-Sat: 7AM-6PM" },
  footer: { companyName: "PowerWash Pro", tagline: "We Make It Shine", address: "321 Clean Street, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 PowerWash Pro" },
  seo: { title: "PowerWash Pro - Pressure Washing Services", description: "Professional pressure washing for driveways, homes, and decks.", keywords: "pressure washing, power washing, driveway cleaning, house washing" },
  styles: { primaryColor: "#2563eb", secondaryColor: "#1d4ed8" },
  aboutUs: { heading: "About PowerWash", description: "PowerWash Pro has been restoring properties to their original beauty for over 10 years.", values: [{ title: "Results", desc: "Visible transformation" }, { title: "Care", desc: "Safe for all surfaces" }, { title: "Value", desc: "Competitive pricing" }] },
  contactForm: { heading: "Get Free Quote", subheading: "Tell us about your property", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "What needs cleaning?", type: "textarea", required: true }], submitText: "Get Estimate" }
};

const gutterCleaningTemplate: TemplateData = {
  slug: "gutter-cleaning",
  title: "GutterGuard Services",
  themeId: "gutterguard",
  hero: {
    heading: "Professional Gutter Cleaning & Repair",
    subheading: "Protect your home from water damage with clean gutters",
    ctaText: "Schedule Service"
  },
  hero_image: "https://images.unsplash.com/photo-1551216606-420f2687b398?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose GutterGuard",
    items: [
      { icon: "🏠", title: "Home Protection", desc: "Prevent water damage" },
      { icon: "🍂", title: "Full Cleaning", desc: "Remove all debris" },
      { icon: "🔧", title: "Repairs", desc: "Fix leaks and damage" },
      { icon: "✅", title: "Satisfaction", desc: "Work guaranteed" }
    ]
  },
  services: {
    heading: "Our Services",
    subheading: "Complete gutter care",
    items: [
      { image: "https://images.unsplash.com/photo-1551216606-420f2687b398?w=400&h=300&fit=crop", title: "Gutter Cleaning", desc: "Remove leaves, debris, and buildup", price: "From $99" },
      { image: "https://images.unsplash.com/photo-1551216606-420f2687b398?w=400&h=300&fit=crop", title: "Gutter Repair", desc: "Fix leaks, reattach sections", price: "From $79" },
      { image: "https://images.unsplash.com/photo-1551216606-420f2687b398?w=400&h=300&fit=crop", title: "Gutter Guards", desc: "Install protection systems", price: "From $299" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Bob Nelson", company: "Homeowner", rating: 5, text: "They did a thorough job and even showed me pictures!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Mary Scott", company: "Homeowner", rating: 5, text: "No more overflowing gutters. Great service!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Protect Your Home", subheading: "Schedule gutter service today", ctaText: "Get Quote" },
  contact: { phone: "+1-800-GUTTERS", email: "service@gutterguard.com", hours: "Mon-Sat: 8AM-5PM" },
  footer: { companyName: "GutterGuard Services", tagline: "Keeping Homes Dry", address: "456 Roof Lane, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 GutterGuard" },
  seo: { title: "GutterGuard - Gutter Cleaning & Repair", description: "Professional gutter cleaning, repair, and guard installation.", keywords: "gutter cleaning, gutter repair, gutter guards, downspout cleaning" },
  styles: { primaryColor: "#65a30d", secondaryColor: "#4d7c0f" },
  aboutUs: { heading: "About GutterGuard", description: "GutterGuard Services has protected thousands of homes from water damage.", values: [{ title: "Protection", desc: "Prevent costly repairs" }, { title: "Quality", desc: "Thorough service" }, { title: "Trust", desc: "Reliable & insured" }] },
  contactForm: { heading: "Schedule Service", subheading: "Get your gutters cleaned", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Service Needed", type: "textarea", required: true }], submitText: "Book Now" }
};

const fenceInstallTemplate: TemplateData = {
  slug: "fence-install",
  title: "FenceBuilders Pro",
  themeId: "fencebuilders",
  hero: {
    heading: "Quality Fence Installation & Repair",
    subheading: "Privacy, security, and style for your property",
    ctaText: "Free Estimate"
  },
  hero_image: "https://images.unsplash.com/photo-1585847335735-5e9ec58a4fa0?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose FenceBuilders",
    items: [
      { icon: "🏡", title: "All Types", desc: "Wood, vinyl, chain link, iron" },
      { icon: "📏", title: "Custom Design", desc: "Tailored to your needs" },
      { icon: "⚡", title: "Fast Install", desc: "Most jobs done in days" },
      { icon: "✅", title: "5-Year Warranty", desc: "Workmanship guaranteed" }
    ]
  },
  services: {
    heading: "Fencing Services",
    subheading: "Complete fence solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1585847335735-5e9ec58a4fa0?w=400&h=300&fit=crop", title: "Wood Fencing", desc: "Classic cedar and pine privacy fences", price: "From $25/ft" },
      { image: "https://images.unsplash.com/photo-1585847335692-b7ef33c6c24a?w=400&h=300&fit=crop", title: "Vinyl Fencing", desc: "Low-maintenance vinyl options", price: "From $30/ft" },
      { image: "https://images.unsplash.com/photo-1585847335650-a0f2c3fb8d8f?w=400&h=300&fit=crop", title: "Fence Repair", desc: "Fix damaged or leaning fences", price: "From $149" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Dan Roberts", company: "Homeowner", rating: 5, text: "Beautiful fence installed in 2 days. Very professional crew!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Julie Anderson", company: "Homeowner", rating: 5, text: "Love our new privacy fence. Great quality work!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Ready for a New Fence?", subheading: "Get your free estimate today", ctaText: "Get Quote" },
  contact: { phone: "+1-800-FENCE-IT", email: "build@fencebuilders.com", hours: "Mon-Sat: 7AM-5PM" },
  footer: { companyName: "FenceBuilders Pro", tagline: "Your Boundary Experts", address: "789 Post Road, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 FenceBuilders" },
  seo: { title: "FenceBuilders - Fence Installation & Repair", description: "Quality fence installation for wood, vinyl, and chain link.", keywords: "fence installation, fence repair, privacy fence, wood fence, vinyl fence" },
  styles: { primaryColor: "#78350f", secondaryColor: "#92400e" },
  aboutUs: { heading: "About FenceBuilders", description: "FenceBuilders Pro has been creating quality fences for over 25 years.", values: [{ title: "Craftsmanship", desc: "Built to last" }, { title: "Materials", desc: "Premium quality" }, { title: "Service", desc: "Clean, professional" }] },
  contactForm: { heading: "Get Free Estimate", subheading: "Tell us about your fencing project", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Fence Type & Linear Feet", type: "textarea", required: true }], submitText: "Get Estimate" }
};

const concreteTemplate: TemplateData = {
  slug: "concrete",
  title: "SolidGround Concrete",
  themeId: "solidground",
  hero: {
    heading: "Professional Concrete & Paving Services",
    subheading: "Driveways, patios, walkways, and more",
    ctaText: "Free Estimate"
  },
  hero_image: "https://images.unsplash.com/photo-1576859265169-85cacac4e0a0?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose SolidGround",
    items: [
      { icon: "🏗️", title: "Expert Work", desc: "Experienced concrete pros" },
      { icon: "💪", title: "Built to Last", desc: "Quality materials & methods" },
      { icon: "🎨", title: "Custom Finishes", desc: "Stamped, stained, & more" },
      { icon: "✅", title: "Guaranteed", desc: "5-year workmanship warranty" }
    ]
  },
  services: {
    heading: "Our Services",
    subheading: "Complete concrete solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1576859265169-85cacac4e0a0?w=400&h=300&fit=crop", title: "Driveways", desc: "New pours and replacements", price: "From $8/sq ft" },
      { image: "https://images.unsplash.com/photo-1576859265155-9d5b49b1a6e7?w=400&h=300&fit=crop", title: "Patios", desc: "Beautiful outdoor living spaces", price: "From $10/sq ft" },
      { image: "https://images.unsplash.com/photo-1576859265175-8c3e1a6e8c0f?w=400&h=300&fit=crop", title: "Sidewalks", desc: "Walkways and sidewalk repair", price: "From $6/sq ft" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Rick Johnson", company: "Homeowner", rating: 5, text: "New driveway looks amazing! Very professional team.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Susan Brown", company: "Homeowner", rating: 5, text: "Love our stamped concrete patio. Great work!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Need Concrete Work?", subheading: "Get your free estimate today", ctaText: "Get Quote" },
  contact: { phone: "+1-800-SOLID-CO", email: "pour@solidground.com", hours: "Mon-Sat: 7AM-5PM" },
  footer: { companyName: "SolidGround Concrete", tagline: "Built on Solid Ground", address: "456 Cement Way, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 SolidGround" },
  seo: { title: "SolidGround - Concrete & Paving Services", description: "Professional concrete work for driveways, patios, and walkways.", keywords: "concrete, driveway, patio, sidewalk, stamped concrete" },
  styles: { primaryColor: "#6b7280", secondaryColor: "#4b5563" },
  aboutUs: { heading: "About SolidGround", description: "SolidGround Concrete has been pouring quality concrete for 30+ years.", values: [{ title: "Quality", desc: "Premium concrete mix" }, { title: "Experience", desc: "30+ years expertise" }, { title: "Durability", desc: "Built to last" }] },
  contactForm: { heading: "Get Free Estimate", subheading: "Describe your concrete project", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Project Details & Size", type: "textarea", required: true }], submitText: "Get Estimate" }
};

const treeServiceTemplate: TemplateData = {
  slug: "tree-service",
  title: "TreeCare Arborists",
  themeId: "treecare",
  hero: {
    heading: "Professional Tree Service & Care",
    subheading: "Expert tree trimming, removal, and stump grinding",
    ctaText: "Free Estimate"
  },
  hero_image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose TreeCare",
    items: [
      { icon: "🌳", title: "Certified Arborists", desc: "ISA certified professionals" },
      { icon: "⚡", title: "Emergency Service", desc: "24/7 storm damage response" },
      { icon: "🛡️", title: "Fully Insured", desc: "$2M liability coverage" },
      { icon: "✅", title: "Free Estimates", desc: "No-obligation quotes" }
    ]
  },
  services: {
    heading: "Our Services",
    subheading: "Complete tree care solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop", title: "Tree Trimming", desc: "Professional pruning and shaping", price: "From $149" },
      { image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop", title: "Tree Removal", desc: "Safe, efficient tree removal", price: "From $299" },
      { image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop", title: "Stump Grinding", desc: "Complete stump removal", price: "From $99" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Greg Taylor", company: "Homeowner", rating: 5, text: "Removed a huge oak tree safely. Very impressive!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Linda Harris", company: "Property Manager", rating: 5, text: "Great team, cleaned up perfectly. Will use again!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Need Tree Service?", subheading: "Get your free estimate today", ctaText: "Get Quote" },
  contact: { phone: "+1-800-TREE-CUT", email: "care@treecare.com", hours: "Mon-Sat: 7AM-6PM" },
  footer: { companyName: "TreeCare Arborists", tagline: "Your Tree Health Experts", address: "789 Forest Rd, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 TreeCare" },
  seo: { title: "TreeCare - Tree Service & Arborist", description: "Professional tree trimming, removal, and stump grinding services.", keywords: "tree service, tree removal, tree trimming, stump grinding, arborist" },
  styles: { primaryColor: "#15803d", secondaryColor: "#166534" },
  aboutUs: { heading: "About TreeCare", description: "TreeCare Arborists has been caring for trees in our community for 20+ years.", values: [{ title: "Safety", desc: "Safety-first approach" }, { title: "Expertise", desc: "ISA certified team" }, { title: "Care", desc: "Tree health focus" }] },
  contactForm: { heading: "Get Free Estimate", subheading: "Tell us about your tree project", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Trees & Service Needed", type: "textarea", required: true }], submitText: "Get Estimate" }
};

const solarTemplate: TemplateData = {
  slug: "solar",
  title: "SunPower Solar",
  themeId: "sunpower",
  hero: {
    heading: "Go Solar & Save Thousands",
    subheading: "Professional solar panel installation for your home or business",
    ctaText: "Free Solar Analysis"
  },
  hero_image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Go Solar with Us",
    items: [
      { icon: "☀️", title: "Energy Savings", desc: "Cut electric bills by 70-100%" },
      { icon: "🏠", title: "Home Value", desc: "Increase property value" },
      { icon: "🌍", title: "Eco-Friendly", desc: "Reduce carbon footprint" },
      { icon: "✅", title: "25-Year Warranty", desc: "Performance guaranteed" }
    ]
  },
  services: {
    heading: "Solar Solutions",
    subheading: "Complete solar installation services",
    items: [
      { image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop", title: "Residential Solar", desc: "Home solar panel systems", price: "From $15,000" },
      { image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop", title: "Commercial Solar", desc: "Business solar installations", price: "Custom Quote" },
      { image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop", title: "Battery Storage", desc: "Energy storage solutions", price: "From $8,000" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Mark Stevens", company: "Homeowner", rating: 5, text: "Our electric bill went from $300 to $20. Amazing!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Janet Moore", company: "Business Owner", rating: 5, text: "Great investment for our business. Professional installation.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Ready to Go Solar?", subheading: "See how much you can save", ctaText: "Free Analysis" },
  contact: { phone: "+1-800-SUN-POWR", email: "solar@sunpower.com", hours: "Mon-Fri: 8AM-6PM" },
  footer: { companyName: "SunPower Solar", tagline: "Power Your Future", address: "123 Solar Way, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 SunPower Solar" },
  seo: { title: "SunPower Solar - Solar Panel Installation", description: "Professional solar panel installation for homes and businesses.", keywords: "solar panels, solar installation, solar energy, solar power" },
  styles: { primaryColor: "#f59e0b", secondaryColor: "#d97706" },
  aboutUs: { heading: "About SunPower", description: "SunPower Solar has helped thousands of homeowners switch to clean energy.", values: [{ title: "Savings", desc: "Maximize your savings" }, { title: "Quality", desc: "Tier 1 panels" }, { title: "Service", desc: "Lifetime support" }] },
  contactForm: { heading: "Free Solar Analysis", subheading: "See your savings potential", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Monthly Electric Bill", type: "textarea", required: true }], submitText: "Get Analysis" }
};

const homeSecurityTemplate: TemplateData = {
  slug: "home-security",
  title: "SafeHome Security",
  themeId: "safehome",
  hero: {
    heading: "Protect What Matters Most",
    subheading: "Professional home security systems and monitoring",
    ctaText: "Free Consultation"
  },
  hero_image: "/template-images/professional_window_installation_service.png?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose SafeHome",
    items: [
      { icon: "🛡️", title: "24/7 Monitoring", desc: "Round-the-clock protection" },
      { icon: "📱", title: "Smart Home", desc: "Control from anywhere" },
      { icon: "⚡", title: "Fast Response", desc: "Under 30 second dispatch" },
      { icon: "✅", title: "No Contracts", desc: "Flexible monthly plans" }
    ]
  },
  services: {
    heading: "Security Solutions",
    subheading: "Complete home protection",
    items: [
      { image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=300&fit=crop", title: "Security Systems", desc: "Professional alarm installation", price: "From $299" },
      { image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=300&fit=crop", title: "Video Surveillance", desc: "HD camera systems", price: "From $499" },
      { image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop", title: "24/7 Monitoring", desc: "Professional monitoring service", price: "$29/month" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Paul King", company: "Homeowner", rating: 5, text: "Peace of mind knowing my family is protected. Great system!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Amy Wilson", company: "Homeowner", rating: 5, text: "Easy to use app and fast response time. Highly recommend!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Secure Your Home Today", subheading: "Get your free security assessment", ctaText: "Free Assessment" },
  contact: { phone: "+1-800-SAFE-NOW", email: "protect@safehome.com", hours: "24/7 Support" },
  footer: { companyName: "SafeHome Security", tagline: "Your Family's Protection Partner", address: "789 Secure Blvd, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 SafeHome Security" },
  seo: { title: "SafeHome - Home Security Systems", description: "Professional home security systems with 24/7 monitoring.", keywords: "home security, security system, alarm system, video surveillance" },
  styles: { primaryColor: "#1e3a8a", secondaryColor: "#1e40af" },
  aboutUs: { heading: "About SafeHome", description: "SafeHome Security has protected over 50,000 homes with reliable security solutions.", values: [{ title: "Protection", desc: "24/7 monitoring" }, { title: "Technology", desc: "Smart home ready" }, { title: "Trust", desc: "50,000+ homes protected" }] },
  contactForm: { heading: "Free Security Assessment", subheading: "Get a customized security plan", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Home Size & Concerns", type: "textarea", required: true }], submitText: "Get Assessment" }
};

const insulationTemplate: TemplateData = {
  slug: "insulation",
  title: "InsulPro Insulation",
  themeId: "insulpro",
  hero: {
    heading: "Expert Insulation Services",
    subheading: "Keep your home comfortable and energy-efficient",
    ctaText: "Free Energy Audit"
  },
  hero_image: "/template-images/professional_window_installation_service.png?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose InsulPro",
    items: [
      { icon: "🏠", title: "Energy Savings", desc: "Cut heating/cooling costs 30-50%" },
      { icon: "🌡️", title: "Year-Round Comfort", desc: "Even temperatures throughout" },
      { icon: "🔇", title: "Noise Reduction", desc: "Quieter living spaces" },
      { icon: "✅", title: "Lifetime Warranty", desc: "Materials guaranteed" }
    ]
  },
  services: {
    heading: "Insulation Services",
    subheading: "Complete insulation solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=400&h=300&fit=crop", title: "Attic Insulation", desc: "Blown-in and batt insulation", price: "From $1/sq ft" },
      { image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop", title: "Wall Insulation", desc: "Injection foam insulation", price: "From $2/sq ft" },
      { image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop", title: "Spray Foam", desc: "Premium spray foam", price: "From $3/sq ft" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Chris Wright", company: "Homeowner", rating: 5, text: "Our heating bill dropped 40%! Best home investment we made.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Diane Foster", company: "Homeowner", rating: 5, text: "No more cold spots in winter. Very thorough work!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Ready to Save Energy?", subheading: "Get your free energy audit", ctaText: "Free Audit" },
  contact: { phone: "+1-800-INSUL-IT", email: "save@insulpro.com", hours: "Mon-Fri: 8AM-5PM" },
  footer: { companyName: "InsulPro Insulation", tagline: "Comfort & Efficiency Experts", address: "456 Energy Lane, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 InsulPro" },
  seo: { title: "InsulPro - Home Insulation Services", description: "Professional insulation installation for attics, walls, and more.", keywords: "insulation, attic insulation, spray foam, energy efficiency" },
  styles: { primaryColor: "#059669", secondaryColor: "#047857" },
  aboutUs: { heading: "About InsulPro", description: "InsulPro has helped homeowners save millions on energy costs.", values: [{ title: "Savings", desc: "Reduce energy bills" }, { title: "Comfort", desc: "Even temperatures" }, { title: "Quality", desc: "Premium materials" }] },
  contactForm: { heading: "Free Energy Audit", subheading: "See your savings potential", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Home Age & Size", type: "textarea", required: true }], submitText: "Schedule Audit" }
};

const chimneyTemplate: TemplateData = {
  slug: "chimney",
  title: "ChimneyCare Services",
  themeId: "chimneycare",
  hero: {
    heading: "Professional Chimney Cleaning & Repair",
    subheading: "Keep your home safe and your fireplace working perfectly",
    ctaText: "Schedule Inspection"
  },
  hero_image: "/template-images/professional_window_installation_service.png?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose ChimneyCare",
    items: [
      { icon: "🔥", title: "Fire Safety", desc: "Prevent chimney fires" },
      { icon: "🏠", title: "Full Service", desc: "Cleaning, repair, & inspection" },
      { icon: "📋", title: "Certified", desc: "CSIA certified technicians" },
      { icon: "✅", title: "Guaranteed", desc: "Work satisfaction guaranteed" }
    ]
  },
  services: {
    heading: "Our Services",
    subheading: "Complete chimney care",
    items: [
      { image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop", title: "Chimney Cleaning", desc: "Remove soot and creosote buildup", price: "From $149" },
      { image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=300&fit=crop", title: "Chimney Repair", desc: "Fix cracks, caps, and liners", price: "From $199" },
      { image: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=400&h=300&fit=crop", title: "Inspection", desc: "Full chimney safety inspection", price: "From $99" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "George Martin", company: "Homeowner", rating: 5, text: "Very thorough cleaning. Explained everything they found.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Betty Davis", company: "Homeowner", rating: 5, text: "Fixed our chimney cap perfectly. No more water leaks!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Is Your Chimney Safe?", subheading: "Schedule your inspection today", ctaText: "Book Now" },
  contact: { phone: "+1-800-CHIMNEY", email: "clean@chimneycare.com", hours: "Mon-Sat: 8AM-5PM" },
  footer: { companyName: "ChimneyCare Services", tagline: "Keeping Homes Safe Since 1995", address: "123 Hearth Lane, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 ChimneyCare" },
  seo: { title: "ChimneyCare - Chimney Cleaning & Repair", description: "Professional chimney cleaning, repair, and inspection services.", keywords: "chimney cleaning, chimney repair, chimney sweep, fireplace" },
  styles: { primaryColor: "#7c2d12", secondaryColor: "#9a3412" },
  aboutUs: { heading: "About ChimneyCare", description: "ChimneyCare has kept homes safe with quality chimney services for 25+ years.", values: [{ title: "Safety", desc: "Fire prevention focus" }, { title: "Experience", desc: "25+ years expertise" }, { title: "Certified", desc: "CSIA professionals" }] },
  contactForm: { heading: "Schedule Service", subheading: "Get your chimney inspected", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Service Needed", type: "textarea", required: true }], submitText: "Book Appointment" }
};

const waterDamageTemplate: TemplateData = {
  slug: "water-damage",
  title: "FloodFix Restoration",
  themeId: "floodfix",
  hero: {
    heading: "24/7 Water Damage Restoration",
    subheading: "Fast response to minimize damage and restore your property",
    ctaText: "Emergency Call"
  },
  hero_image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose FloodFix",
    items: [
      { icon: "⚡", title: "Fast Response", desc: "On-site within 60 minutes" },
      { icon: "🔧", title: "Full Service", desc: "Extraction to restoration" },
      { icon: "📋", title: "Insurance Help", desc: "Work with all insurers" },
      { icon: "✅", title: "IICRC Certified", desc: "Industry-certified pros" }
    ]
  },
  services: {
    heading: "Restoration Services",
    subheading: "Complete water damage recovery",
    items: [
      { image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop", title: "Water Extraction", desc: "Remove standing water fast", price: "Emergency Rates" },
      { image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop", title: "Drying & Dehumidification", desc: "Industrial drying equipment", price: "Included" },
      { image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop", title: "Restoration", desc: "Repair and rebuild", price: "Custom Quote" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Tim Green", company: "Homeowner", rating: 5, text: "Arrived in 45 minutes after our pipe burst. Saved our floors!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Sandra Lee", company: "Business Owner", rating: 5, text: "Handled our insurance claim perfectly. Back in business in days.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Water Emergency?", subheading: "Call now for immediate response", ctaText: "Call 24/7" },
  contact: { phone: "+1-800-FLOOD-FX", email: "help@floodfix.com", hours: "24/7 Emergency Service" },
  footer: { companyName: "FloodFix Restoration", tagline: "Restoring Homes, Rebuilding Lives", address: "789 Recovery Rd, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 FloodFix" },
  seo: { title: "FloodFix - Water Damage Restoration", description: "24/7 water damage restoration and flood cleanup services.", keywords: "water damage, flood restoration, water extraction, mold prevention" },
  styles: { primaryColor: "#0369a1", secondaryColor: "#0284c7" },
  aboutUs: { heading: "About FloodFix", description: "FloodFix Restoration responds 24/7 to water emergencies with fast, professional service.", values: [{ title: "Speed", desc: "60-min response time" }, { title: "Care", desc: "Insurance assistance" }, { title: "Results", desc: "Full restoration" }] },
  contactForm: { heading: "Emergency Contact", subheading: "Get immediate help", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Describe Emergency", type: "textarea", required: true }], submitText: "Get Help Now" }
};

const moldRemovalTemplate: TemplateData = {
  slug: "mold-removal",
  title: "MoldFree Solutions",
  themeId: "moldfree",
  hero: {
    heading: "Professional Mold Removal & Remediation",
    subheading: "Protect your health with expert mold elimination",
    ctaText: "Free Inspection"
  },
  hero_image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose MoldFree",
    items: [
      { icon: "🏥", title: "Health First", desc: "Eliminate health risks" },
      { icon: "🔬", title: "Lab Testing", desc: "Identify mold types" },
      { icon: "🛡️", title: "Safe Process", desc: "EPA-approved methods" },
      { icon: "✅", title: "Guaranteed", desc: "Mold-free guarantee" }
    ]
  },
  services: {
    heading: "Mold Services",
    subheading: "Complete mold remediation",
    items: [
      { image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=300&fit=crop", title: "Mold Inspection", desc: "Thorough testing and assessment", price: "From $199" },
      { image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=300&fit=crop", title: "Mold Removal", desc: "Safe, complete mold elimination", price: "Custom Quote" },
      { image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=300&fit=crop", title: "Prevention", desc: "Stop mold from returning", price: "Included" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Rachel Kim", company: "Homeowner", rating: 5, text: "Found mold in our basement. They eliminated it completely!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "David Stone", company: "Property Manager", rating: 5, text: "Professional, thorough, and worked with our schedule.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Suspect Mold?", subheading: "Get your free inspection today", ctaText: "Free Inspection" },
  contact: { phone: "+1-800-MOLD-OUT", email: "safe@moldfree.com", hours: "Mon-Sat: 8AM-6PM" },
  footer: { companyName: "MoldFree Solutions", tagline: "Breathe Easy Again", address: "456 Clean Air Blvd, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 MoldFree" },
  seo: { title: "MoldFree - Mold Removal & Remediation", description: "Professional mold testing, removal, and prevention services.", keywords: "mold removal, mold remediation, mold testing, mold inspection" },
  styles: { primaryColor: "#7c3aed", secondaryColor: "#6d28d9" },
  aboutUs: { heading: "About MoldFree", description: "MoldFree Solutions protects families from mold hazards with certified remediation.", values: [{ title: "Health", desc: "Protect your family" }, { title: "Expertise", desc: "Certified technicians" }, { title: "Results", desc: "Mold-free guarantee" }] },
  contactForm: { heading: "Free Mold Inspection", subheading: "Find out if you have a mold problem", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Describe Concern", type: "textarea", required: true }], submitText: "Schedule Inspection" }
};

// IT & Tech Services Templates
const wifiPrinterSupportTemplate: TemplateData = {
  slug: "wifi-printer-support",
  title: "PrintConnect Pro",
  themeId: "printconnect",
  hero: {
    heading: "WiFi & Printer Support Services",
    subheading: "Expert setup, troubleshooting, and support for all your printing needs",
    ctaText: "Get Help Now"
  },
  hero_image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose PrintConnect",
    items: [
      { icon: "🖨️", title: "All Brands", desc: "HP, Canon, Epson, Brother & more" },
      { icon: "📶", title: "WiFi Setup", desc: "Wireless printer configuration" },
      { icon: "🔧", title: "Troubleshooting", desc: "Fix printing errors fast" },
      { icon: "💻", title: "Remote Support", desc: "Help via phone or remote access" }
    ]
  },
  services: {
    heading: "Printer Services",
    subheading: "Complete printer and WiFi support solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=300&fit=crop", title: "Printer Setup", desc: "New printer installation and configuration", price: "From $49" },
      { image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=300&fit=crop", title: "WiFi Connection", desc: "Connect printer to wireless network", price: "From $39" },
      { image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop", title: "Troubleshooting", desc: "Fix paper jams, errors, and connectivity issues", price: "From $29" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Linda Morris", company: "Home Office", rating: 5, text: "Fixed my printer connectivity issue in minutes. Very professional!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "James Wilson", company: "Small Business", rating: 5, text: "Set up our office printers on the network. Excellent service!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Printer Problems?", subheading: "Get expert help today", ctaText: "Call Now" },
  contact: { phone: "+1-800-PRINT-FX", email: "help@printconnect.com", hours: "Mon-Sat: 8AM-8PM" },
  footer: { companyName: "PrintConnect Pro", tagline: "Your Printer Experts", address: "123 Tech Lane, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 PrintConnect Pro" },
  seo: { title: "PrintConnect Pro - WiFi & Printer Support", description: "Expert WiFi printer setup, troubleshooting, and support services.", keywords: "printer support, wifi printer, printer setup, printer troubleshooting" },
  styles: { primaryColor: "#2563eb", secondaryColor: "#1d4ed8" },
  aboutUs: { heading: "About PrintConnect", description: "PrintConnect Pro provides expert printer and WiFi support for homes and businesses.", values: [{ title: "Expert", desc: "Certified technicians" }, { title: "Fast", desc: "Same-day service" }, { title: "Affordable", desc: "Competitive pricing" }] },
  contactForm: { heading: "Get Printer Help", subheading: "Describe your issue", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Describe Problem", type: "textarea", required: true }], submitText: "Request Support" }
};

const routerSupportTemplate: TemplateData = {
  slug: "router-support",
  title: "NetFix Router Services",
  themeId: "netfix",
  hero: {
    heading: "Professional Router Support & Setup",
    subheading: "Expert WiFi router installation, configuration, and troubleshooting",
    ctaText: "Fix My WiFi"
  },
  hero_image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose NetFix",
    items: [
      { icon: "📡", title: "All Routers", desc: "Netgear, Linksys, ASUS, TP-Link & more" },
      { icon: "🚀", title: "Speed Boost", desc: "Optimize your network performance" },
      { icon: "🔒", title: "Security", desc: "Secure your home network" },
      { icon: "📞", title: "24/7 Support", desc: "Help when you need it" }
    ]
  },
  services: {
    heading: "Router Services",
    subheading: "Complete networking solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=300&fit=crop", title: "Router Setup", desc: "New router installation and configuration", price: "From $59" },
      { image: "https://images.unsplash.com/photo-1516044734145-07ca8eef8731?w=400&h=300&fit=crop", title: "WiFi Optimization", desc: "Improve coverage and speed", price: "From $49" },
      { image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop", title: "Network Security", desc: "Secure your WiFi network", price: "From $39" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Mike Thompson", company: "Homeowner", rating: 5, text: "Fixed our dead zones and doubled our WiFi speed!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Sarah Chen", company: "Remote Worker", rating: 5, text: "Professional setup for my home office. No more connection drops!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "WiFi Issues?", subheading: "Get professional help today", ctaText: "Call Now" },
  contact: { phone: "+1-800-NET-FIXX", email: "help@netfix.com", hours: "24/7 Support Available" },
  footer: { companyName: "NetFix Router Services", tagline: "Fast, Reliable WiFi", address: "456 Network Ave, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 NetFix" },
  seo: { title: "NetFix - Router Support & WiFi Services", description: "Professional router setup, WiFi optimization, and network security services.", keywords: "router support, wifi setup, router configuration, network troubleshooting" },
  styles: { primaryColor: "#059669", secondaryColor: "#047857" },
  aboutUs: { heading: "About NetFix", description: "NetFix provides expert router and networking support for homes and businesses.", values: [{ title: "Speed", desc: "Optimize performance" }, { title: "Security", desc: "Protect your network" }, { title: "Support", desc: "24/7 assistance" }] },
  contactForm: { heading: "Get WiFi Help", subheading: "Describe your network issue", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Describe Issue", type: "textarea", required: true }], submitText: "Request Support" }
};

const smartTvSupportTemplate: TemplateData = {
  slug: "smart-tv-support",
  title: "SmartTV Experts",
  themeId: "smarttv",
  hero: {
    heading: "Smart TV Support & Setup Services",
    subheading: "Expert installation, streaming setup, and troubleshooting for all Smart TVs",
    ctaText: "Get TV Help"
  },
  hero_image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose SmartTV Experts",
    items: [
      { icon: "📺", title: "All Brands", desc: "Samsung, LG, Sony, Roku, Fire TV & more" },
      { icon: "🎬", title: "Streaming", desc: "Netflix, Hulu, Disney+ setup" },
      { icon: "🔊", title: "Sound Setup", desc: "Soundbar and audio configuration" },
      { icon: "📱", title: "Remote Help", desc: "Phone and remote support" }
    ]
  },
  services: {
    heading: "TV Services",
    subheading: "Complete Smart TV solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop", title: "TV Setup", desc: "Complete Smart TV installation", price: "From $79" },
      { image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop", title: "Streaming Setup", desc: "Configure all streaming apps", price: "From $49" },
      { image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop", title: "Troubleshooting", desc: "Fix connectivity and app issues", price: "From $39" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Robert Garcia", company: "Homeowner", rating: 5, text: "Set up our new Samsung TV perfectly. All apps working great!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Emily White", company: "Senior Citizen", rating: 5, text: "Very patient and helpful. Now I can watch my shows easily!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Smart TV Problems?", subheading: "Expert help is just a call away", ctaText: "Call Now" },
  contact: { phone: "+1-800-TV-SMART", email: "help@smarttvexperts.com", hours: "Mon-Sun: 9AM-9PM" },
  footer: { companyName: "SmartTV Experts", tagline: "Your Entertainment Experts", address: "789 Media Blvd, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 SmartTV Experts" },
  seo: { title: "SmartTV Experts - TV Setup & Support", description: "Expert Smart TV setup, streaming configuration, and troubleshooting services.", keywords: "smart tv support, tv setup, streaming setup, smart tv troubleshooting" },
  styles: { primaryColor: "#7c3aed", secondaryColor: "#6d28d9" },
  aboutUs: { heading: "About SmartTV Experts", description: "SmartTV Experts helps you get the most from your Smart TV with professional setup and support.", values: [{ title: "Expertise", desc: "All TV brands" }, { title: "Patience", desc: "We explain everything" }, { title: "Results", desc: "Working TV guaranteed" }] },
  contactForm: { heading: "Get TV Help", subheading: "Describe your TV issue", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "TV Model & Issue", type: "textarea", required: true }], submitText: "Request Support" }
};

const itServicesTemplate: TemplateData = {
  slug: "it-services",
  title: "TechPro IT Services",
  themeId: "techpro",
  hero: {
    heading: "Professional IT Services & Management",
    subheading: "Complete IT solutions for businesses - support, maintenance, and managed services",
    ctaText: "Get IT Support"
  },
  hero_image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose TechPro",
    items: [
      { icon: "💼", title: "Business Focus", desc: "IT solutions for your business" },
      { icon: "🛡️", title: "Cybersecurity", desc: "Protect your data and systems" },
      { icon: "☁️", title: "Cloud Services", desc: "Migration and management" },
      { icon: "📞", title: "24/7 Support", desc: "Always available helpdesk" }
    ]
  },
  services: {
    heading: "IT Services",
    subheading: "Comprehensive technology solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop", title: "Managed IT", desc: "Complete IT management and support", price: "From $299/mo" },
      { image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop", title: "Network Setup", desc: "Business network design and implementation", price: "Custom Quote" },
      { image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop", title: "Help Desk", desc: "On-demand technical support", price: "From $99/hr" }
    ]
  },
  testimonials: {
    heading: "Client Reviews",
    items: [
      { name: "Jennifer Adams", company: "Law Firm", rating: 5, text: "TechPro manages all our IT. No more tech headaches!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { name: "Mark Stevens", company: "Medical Practice", rating: 5, text: "Professional, HIPAA-compliant IT support. Highly recommend!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Need IT Help?", subheading: "Let us handle your technology", ctaText: "Free Consultation" },
  contact: { phone: "+1-800-TECH-PRO", email: "support@techpro.com", hours: "24/7 Support Available" },
  footer: { companyName: "TechPro IT Services", tagline: "Your Technology Partner", address: "100 Business Park Dr, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 TechPro IT" },
  seo: { title: "TechPro IT Services - Managed IT & Support", description: "Professional IT services, managed IT, and technical support for businesses.", keywords: "IT services, managed IT, IT support, business technology, help desk" },
  styles: { primaryColor: "#0f172a", secondaryColor: "#1e293b" },
  aboutUs: { heading: "About TechPro", description: "TechPro IT Services provides comprehensive technology solutions for businesses of all sizes.", values: [{ title: "Reliability", desc: "99.9% uptime" }, { title: "Security", desc: "Enterprise protection" }, { title: "Support", desc: "Always available" }] },
  contactForm: { heading: "Get IT Support", subheading: "Tell us about your needs", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "company", label: "Company", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "IT Needs", type: "textarea", required: true }], submitText: "Request Consultation" }
};

const smartHomeSupportTemplate: TemplateData = {
  slug: "smart-home-support",
  title: "SmartHome Solutions",
  themeId: "smarthome",
  hero: {
    heading: "Smart Home Device Support",
    subheading: "Expert setup and support for all your smart home devices and automation",
    ctaText: "Get Smart Help"
  },
  hero_image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose SmartHome Solutions",
    items: [
      { icon: "🏠", title: "All Devices", desc: "Alexa, Google Home, Ring, Nest & more" },
      { icon: "🔌", title: "Integration", desc: "Connect all your devices" },
      { icon: "📱", title: "App Setup", desc: "Configure control apps" },
      { icon: "🤖", title: "Automation", desc: "Create smart routines" }
    ]
  },
  services: {
    heading: "Smart Home Services",
    subheading: "Complete home automation support",
    items: [
      { image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=300&fit=crop", title: "Device Setup", desc: "Install and configure smart devices", price: "From $49" },
      { image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=300&fit=crop", title: "Home Integration", desc: "Connect all devices together", price: "From $99" },
      { image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop", title: "Troubleshooting", desc: "Fix connectivity issues", price: "From $39" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "David Kim", company: "Homeowner", rating: 5, text: "Set up our entire smart home system. Everything works perfectly!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Nancy Brown", company: "Tech Enthusiast", rating: 5, text: "Made my Alexa, Ring, and Nest all work together seamlessly!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Smart Home Issues?", subheading: "Expert help for all devices", ctaText: "Call Now" },
  contact: { phone: "+1-800-SMART-HM", email: "help@smarthomesolutions.com", hours: "Mon-Sat: 8AM-8PM" },
  footer: { companyName: "SmartHome Solutions", tagline: "Making Homes Smarter", address: "321 Automation Way, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 SmartHome Solutions" },
  seo: { title: "SmartHome Solutions - Smart Device Support", description: "Expert smart home device setup, integration, and troubleshooting services.", keywords: "smart home, alexa, google home, nest, ring, smart device support" },
  styles: { primaryColor: "#0891b2", secondaryColor: "#0e7490" },
  aboutUs: { heading: "About SmartHome Solutions", description: "SmartHome Solutions helps you build and maintain your connected home with expert device support.", values: [{ title: "Connected", desc: "All devices work together" }, { title: "Simple", desc: "Easy to use" }, { title: "Smart", desc: "Automate your life" }] },
  contactForm: { heading: "Get Smart Home Help", subheading: "Tell us about your devices", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Devices & Issues", type: "textarea", required: true }], submitText: "Request Support" }
};

const cctvDvrTemplate: TemplateData = {
  slug: "cctv-dvr-services",
  title: "SecureView CCTV",
  themeId: "secureview",
  hero: {
    heading: "CCTV & DVR Security Services",
    subheading: "Professional security camera installation, DVR setup, and monitoring solutions",
    ctaText: "Get Secure Now"
  },
  hero_image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&h=600&fit=crop",
  features: {
    heading: "Why Choose SecureView",
    items: [
      { icon: "📹", title: "HD Cameras", desc: "Crystal clear 4K recording" },
      { icon: "💾", title: "DVR/NVR", desc: "Reliable video storage" },
      { icon: "📱", title: "Remote View", desc: "Watch from anywhere" },
      { icon: "🔔", title: "Alerts", desc: "Motion detection notifications" }
    ]
  },
  services: {
    heading: "Security Services",
    subheading: "Complete video surveillance solutions",
    items: [
      { image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=300&fit=crop", title: "Camera Install", desc: "Professional CCTV installation", price: "From $199" },
      { image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=300&fit=crop", title: "DVR Setup", desc: "Configure recording and storage", price: "From $99" },
      { image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop", title: "Remote Access", desc: "View cameras from your phone", price: "From $49" }
    ]
  },
  testimonials: {
    heading: "Customer Reviews",
    items: [
      { name: "Tom Anderson", company: "Business Owner", rating: 5, text: "Installed 8 cameras at our store. Picture quality is amazing!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { name: "Lisa Martinez", company: "Homeowner", rating: 5, text: "Now I can check on my home from work. Great peace of mind!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
    ]
  },
  cta: { heading: "Protect Your Property", subheading: "Get professional security cameras", ctaText: "Free Quote" },
  contact: { phone: "+1-800-SECURE-V", email: "info@secureview.com", hours: "Mon-Sat: 8AM-6PM" },
  footer: { companyName: "SecureView CCTV", tagline: "See Everything, Anywhere", address: "555 Security Dr, Your City", links: [{ text: "Privacy", href: "#" }, { text: "Terms", href: "#" }], copyright: "© 2024 SecureView CCTV" },
  seo: { title: "SecureView CCTV - Security Camera Installation", description: "Professional CCTV installation, DVR setup, and video surveillance services.", keywords: "CCTV, security cameras, DVR, NVR, video surveillance, camera installation" },
  styles: { primaryColor: "#dc2626", secondaryColor: "#b91c1c" },
  aboutUs: { heading: "About SecureView", description: "SecureView CCTV provides professional security camera solutions for homes and businesses.", values: [{ title: "Security", desc: "Protect what matters" }, { title: "Quality", desc: "HD/4K cameras" }, { title: "Access", desc: "View from anywhere" }] },
  contactForm: { heading: "Get a Free Quote", subheading: "Tell us about your security needs", fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "phone", required: true }, { name: "message", label: "Property & Needs", type: "textarea", required: true }], submitText: "Request Quote" }
};

const TemplatePreview = ({ template, onClose }: { template: TemplateData; onClose: () => void }) => {
  const primaryColor = template.styles?.primaryColor || '#16a34a';
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${template.styles?.secondaryColor || '#15803d'})` }}>
          <h2 className="text-white font-bold text-lg">{template.title} - Preview</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors text-2xl font-light">×</button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="relative h-[400px] bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: `url(${template.hero_image})` }}>
            <div className="absolute inset-0 bg-black/50"></div>
            <div className="relative z-10 text-center text-white px-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{template.hero.heading}</h1>
              <p className="text-xl mb-8 opacity-90">{template.hero.subheading}</p>
              <button className="text-white px-8 py-3 rounded-lg font-semibold transition-colors" style={{ backgroundColor: primaryColor }}>
                {template.hero.ctaText}
              </button>
            </div>
          </div>

          <div className="py-16 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">{template.features.heading}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {template.features.items.map((feature, index) => (
                  <div key={index} className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow" style={{ backgroundColor: `${primaryColor}10` }}>
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div id="services" className="py-16 px-4 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">{template.services.heading}</h2>
              <p className="text-center text-gray-600 mb-12">{template.services.subheading}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {template.services.items.map((service, index) => (
                  <div key={index} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <img src={service.image} alt={service.title} className="w-full h-48 object-cover" />
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{service.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{service.desc}</p>
                      <p className="font-bold" style={{ color: primaryColor }}>{service.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="py-16 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">{template.testimonials.heading}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {template.testimonials.items.map((testimonial, index) => (
                  <div key={index} className="bg-gray-50 p-6 rounded-xl">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                        <p className="text-sm text-gray-500">{testimonial.company}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm italic">"{testimonial.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {template.aboutUs && (
            <div id="about" className="py-16 px-4 bg-gray-50">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">{template.aboutUs.heading}</h2>
                <p className="text-center text-gray-600 max-w-3xl mx-auto mb-12">{template.aboutUs.description}</p>
                {template.aboutUs.values && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {template.aboutUs.values.map((value, index) => (
                      <div key={index} className="bg-white p-6 rounded-xl shadow-md text-center">
                        <h3 className="text-xl font-semibold mb-2" style={{ color: primaryColor }}>{value.title}</h3>
                        <p className="text-gray-600">{value.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {template.contactForm && (
            <div id="contact-form" className="py-16 px-4 bg-white">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">{template.contactForm.heading}</h2>
                <p className="text-center text-gray-600 mb-8">{template.contactForm.subheading}</p>
                <form className="space-y-4">
                  {template.contactForm.fields.map((field, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          name={field.name}
                          required={field.required}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      ) : (
                        <input
                          type={field.type === 'phone' ? 'tel' : field.type}
                          name={field.name}
                          required={field.required}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}
                  <button
                    type="submit"
                    className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {template.contactForm.submitText}
                  </button>
                </form>
              </div>
            </div>
          )}

          <div className="py-16 px-4 text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${template.styles?.secondaryColor || '#15803d'})` }}>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">{template.cta.heading}</h2>
              <p className="text-xl mb-8 opacity-90">{template.cta.subheading}</p>
              <button className="bg-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors" style={{ color: primaryColor }}>
                {template.cta.ctaText}
              </button>
            </div>
          </div>

          <div id="contact" className="py-12 px-4 bg-gray-800 text-white">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5" style={{ color: primaryColor }} />
                  <span>{template.contact.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5" style={{ color: primaryColor }} />
                  <span>{template.contact.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                  <span>{template.contact.hours}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{template.footer.companyName}</h3>
                    <p className="text-gray-400 text-sm">{template.footer.tagline}</p>
                  </div>
                  <div className="flex gap-6">
                    {template.footer.links.map((link, index) => (
                      <a key={index} href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                        {link.text}
                      </a>
                    ))}
                  </div>
                </div>
                <p className="text-center text-gray-500 text-sm mt-8">{template.footer.copyright}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomDomainModal = ({ website, onClose }: { website: SavedWebsite; onClose: () => void }) => {
  const [copied, setCopied] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verified' | 'failed'>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [customDomain, setCustomDomain] = useState((website as any).customDomain || '');
  
  const userDomain = customDomain.replace(/^www\./, '') || 'yourdomain.com';
  const siteSlug = website.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'site';
  
  // Vercel DNS configuration
  const dnsRecords = [
    { type: 'A', name: '@', value: '76.76.21.21', description: 'Points apex domain (yourdomain.com) to Vercel servers', ttl: '3600' },
    { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com', description: 'Points www subdomain to your Vercel deployment', ttl: '3600' }
  ];

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleVerifyDNS = async () => {
    if (!customDomain) {
      setVerificationStatus('failed');
      setVerificationMessage('Please enter a domain name first');
      return;
    }
    
    setVerifying(true);
    setVerificationStatus('idle');
    setVerificationMessage('');
    
    try {
      const response = await fetch('/api/dns/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: customDomain.replace(/^www\./, ''),
          expectedIP: '34.132.134.162'
        })
      });
      
      const result = await response.json();
      
      if (result.verified) {
        setVerificationStatus('verified');
        setVerificationMessage(result.message || 'DNS records verified successfully! Your domain is correctly configured.');
      } else {
        setVerificationStatus('failed');
        setVerificationMessage(result.message || 'DNS verification failed. Please check your DNS records.');
      }
    } catch (error: any) {
      setVerificationStatus('failed');
      setVerificationMessage('Unable to verify DNS. Please try again later.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 p-6 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Connect Custom Domain</h2>
              <p className="text-sm text-gray-600">{website.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Custom Domain
            </label>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value.toLowerCase().trim())}
              placeholder="example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Enter your domain without http:// or www (e.g., mycompany.com)</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-semibold mb-2">How to Connect Your Domain:</p>
            <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
              <li>Enter your domain name above (without www or http://)</li>
              <li>Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)</li>
              <li>Navigate to <strong>DNS Management</strong> or <strong>DNS Settings</strong></li>
              <li>Add ALL {dnsRecords.length} DNS records shown below exactly as displayed</li>
              <li>Wait 5-30 minutes for DNS propagation (can take up to 48 hours)</li>
              <li>Click "Verify DNS" to confirm your domain is connected</li>
            </ol>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-2">Add These DNS Records:</h3>
            <p className="text-xs text-gray-500 mb-4">Copy each record exactly as shown to your domain registrar's DNS settings</p>
            
            {/* DNS Records Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 rounded-t-lg text-xs font-semibold text-gray-600 uppercase">
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Name/Host</div>
              <div className="col-span-5">Value</div>
              <div className="col-span-2">TTL</div>
              <div className="col-span-1">Copy</div>
            </div>
            
            <div className="space-y-0 border border-gray-200 rounded-lg md:rounded-t-none overflow-hidden">
              {dnsRecords.map((record, idx) => (
                <div key={idx} className="border-b last:border-b-0 border-gray-200 p-4 hover:bg-gray-50 transition">
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        record.type === 'A' ? 'bg-green-100 text-green-700' :
                        record.type === 'CNAME' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>{record.type}</span>
                      <span className="font-mono text-gray-700">{record.name}</span>
                    </div>
                    <div className="bg-gray-100 rounded p-2">
                      <p className="text-xs text-gray-500 mb-1">Value:</p>
                      <p className="font-mono text-sm text-gray-800 break-all">{record.value}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">TTL: {record.ttl}</span>
                      <button
                        onClick={() => handleCopy(record.value, record.type + idx)}
                        className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 rounded text-indigo-700 text-xs font-medium flex items-center gap-1"
                      >
                        {copied === record.type + idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied === record.type + idx ? 'Copied!' : 'Copy Value'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 italic">{record.description}</p>
                  </div>
                  
                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        record.type === 'A' ? 'bg-green-100 text-green-700' :
                        record.type === 'CNAME' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>{record.type}</span>
                    </div>
                    <div className="col-span-2 font-mono text-gray-700">{record.name}</div>
                    <div className="col-span-5 font-mono text-gray-800 text-sm break-all">{record.value}</div>
                    <div className="col-span-2 text-gray-600 text-sm">{record.ttl}</div>
                    <div className="col-span-1">
                      <button
                        onClick={() => handleCopy(record.value, record.type + idx)}
                        className="p-1.5 hover:bg-indigo-100 rounded transition text-gray-500 hover:text-indigo-600"
                        title="Copy value"
                      >
                        {copied === record.type + idx ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 font-semibold mb-2">Important Notes:</p>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li><strong>@ symbol</strong> = Your root domain (some registrars use "." or leave blank)</li>
              <li><strong>TTL 3600</strong> = 1 hour (or select "Auto" if available)</li>
              <li><strong>DNS propagation</strong> takes 5-30 minutes, but can take up to 48 hours</li>
              <li><strong>Cloudflare users:</strong> Disable proxy (orange cloud) during setup</li>
            </ul>
          </div>

          {verificationStatus !== 'idle' && (
            <div className={`rounded-lg p-4 flex items-start gap-3 ${
              verificationStatus === 'verified' 
                ? 'bg-indigo-50 border border-indigo-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {verificationStatus === 'verified' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-semibold">DNS Verified Successfully!</p>
                    <p className="text-sm text-indigo-700 mt-1">{verificationMessage}</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-800 font-semibold">Verification Failed</p>
                    <p className="text-sm text-red-700 mt-1">{verificationMessage}</p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleVerifyDNS}
              disabled={verifying}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Verify DNS
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Done
            </button>
            <button
              onClick={() => window.open('https://www.youtube.com/results?search_query=how+to+add+dns+records', '_blank')}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-medium"
            >
              Watch Tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Connected Domains Tab Component
interface DomainRecord {
  id: number;
  domain: string;
  status: string;
  dns_verified: boolean;
  created_at: string;
  updated_at: string;
  expiry_date: string | null;
  registration_date: string | null;
  registrar: string | null;
  website_id: string | null;
}

const ConnectedDomainsTab = ({ savedWebsites }: { savedWebsites: SavedWebsite[] }) => {
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const loadDomains = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      
      const response = await fetch('/api/domains', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains || []);
      }
    } catch (error) {
      console.error('Failed to load domains:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, []);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    setAdding(true);
    
    try {
      const token = await getAuthToken();
      if (!token) return;
      
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain: newDomain })
      });
      
      if (response.ok) {
        setNewDomain('');
        setShowAddModal(false);
        loadDomains();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add domain');
      }
    } catch (error) {
      console.error('Failed to add domain:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleRefresh = async (id: number) => {
    setRefreshingId(id);
    try {
      const token = await getAuthToken();
      if (!token) return;
      
      const response = await fetch(`/api/domains/${id}/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        loadDomains();
      }
    } catch (error) {
      console.error('Failed to refresh domain:', error);
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      
      const response = await fetch(`/api/domains/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        loadDomains();
      }
    } catch (error) {
      console.error('Failed to delete domain:', error);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'text-red-600', bg: 'bg-red-100' };
    if (daysUntilExpiry < 30) return { status: 'expiring soon', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { status: 'active', color: 'text-green-600', bg: 'bg-green-100' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Custom Domains</h2>
          <p className="text-sm text-gray-500">Manage your custom domains and check their status</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Domain
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-200">
          <Loader className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-500">Loading domains...</span>
        </div>
      ) : domains.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-gray-400 text-6xl mb-4">🌐</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No domains added yet</h3>
          <p className="text-gray-500 mb-6">Add your custom domains to track their status and expiry</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Domain
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Domain</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Registrar</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Registered</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {domains.map((domain) => {
                  const expiryStatus = getExpiryStatus(domain.expiry_date);
                  return (
                    <tr key={domain.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-gray-400" />
                          <div>
                            <a 
                              href={`https://${domain.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-gray-900 hover:text-indigo-600 flex items-center gap-1"
                            >
                              {domain.domain}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <p className="text-xs text-gray-500">Added {formatDate(domain.created_at)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${domain.dns_verified ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className={`text-sm font-medium ${domain.dns_verified ? 'text-green-700' : 'text-red-700'}`}>
                            {domain.dns_verified ? 'Connected' : 'Not Connected'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Shield className="w-4 h-4 text-gray-400" />
                          {domain.registrar || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(domain.registration_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-600">{formatDate(domain.expiry_date)}</span>
                          {expiryStatus && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${expiryStatus.bg} ${expiryStatus.color}`}>
                              {expiryStatus.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleRefresh(domain.id)}
                            disabled={refreshingId === domain.id}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh Status"
                          >
                            <RefreshCw className={`w-4 h-4 ${refreshingId === domain.id ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(domain.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Domain</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Enter your domain name. We'll automatically check its DNS status and fetch registration details.
            </p>
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDomain}
                disabled={adding || !newDomain.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {adding ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Domain
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Domain</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to remove this domain? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface WebTemplatesProps {
  initialTab?: 'templates' | 'saved' | 'connected';
}

export const WebTemplates = ({ initialTab = 'templates' }: WebTemplatesProps) => {
  const [previewTemplate, setPreviewTemplate] = useState<TemplateData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [savedWebsites, setSavedWebsites] = useState<SavedWebsite[]>([]);
  const [editingWebsite, setEditingWebsite] = useState<SavedWebsite | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'saved' | 'connected'>(initialTab);
  const [listView, setListView] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');
  const [domainModalWebsite, setDomainModalWebsite] = useState<SavedWebsite | null>(null);
  
  // Update activeTab when initialTab prop changes (for menu navigation)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const templates = [
    {
      id: 'lawn-care',
      name: 'GreenEdge Lawn Care',
      category: 'Home Services',
      description: 'Professional lawn care and landscaping business template with hero, features, services, testimonials, and contact sections.',
      thumbnail: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
      color: 'green',
      data: lawnCareTemplate
    },
    {
      id: 'plumbing',
      name: 'AquaFlow Plumbing',
      category: 'Home Services',
      description: 'Professional plumbing services template with leak detection, pipe installation, and water heater services.',
      thumbnail: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop',
      color: 'blue',
      data: plumbingTemplate
    },
    {
      id: 'electrical',
      name: 'ElectroMax Electrical',
      category: 'Home Services',
      description: 'Licensed electrical services template featuring rewiring, panel upgrades, and lighting design.',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop',
      color: 'yellow',
      data: electricalTemplate
    },
    {
      id: 'hvac',
      name: 'ComfortZone HVAC',
      category: 'Home Services',
      description: 'Professional HVAC template with AC installation, furnace repair, and ductwork services.',
      thumbnail: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop',
      color: 'cyan',
      data: hvacTemplate
    },
    {
      id: 'cleaning',
      name: 'SparkleClean House Cleaning',
      category: 'Home Services',
      description: 'House cleaning services template with regular cleaning, deep cleaning, and move-in/out services.',
      thumbnail: 'https://images.unsplash.com/photo-1584854435991-93f3f0af2c4f?w=400&h=300&fit=crop',
      color: 'purple',
      data: cleaningTemplate
    },
    {
      id: 'painting',
      name: 'ColorWorks Home Painting',
      category: 'Home Services',
      description: 'Professional house painting template featuring interior, exterior, and deck staining services.',
      thumbnail: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=300&fit=crop',
      color: 'orange',
      data: paintingTemplate
    },
    {
      id: 'roofing',
      name: 'SkyGuard Roofing',
      category: 'Home Services',
      description: 'Roofing services template with roof replacement, repair, and professional inspection services.',
      thumbnail: 'https://images.unsplash.com/photo-1551216606-420f2687b398?w=400&h=300&fit=crop',
      color: 'gray',
      data: roofingTemplate
    },
    {
      id: 'carpentry',
      name: 'CraftWood Carpentry',
      category: 'Home Services',
      description: 'Expert carpentry template with custom cabinetry, deck building, and furniture repair services.',
      thumbnail: 'https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=400&h=300&fit=crop',
      color: 'brown',
      data: carpentryTemplate
    },
    {
      id: 'pest-control',
      name: 'BugShield Pest Control',
      category: 'Home Services',
      description: 'Professional pest control template with termite control, rodent removal, and insect treatment.',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
      color: 'red',
      data: pestControlTemplate
    },
    {
      id: 'home-inspection',
      name: 'InspectPro Home Inspections',
      category: 'Home Services',
      description: 'Professional home inspection template with general inspection, pest inspection, and radon testing.',
      thumbnail: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop',
      color: 'teal',
      data: homeInspectionTemplate
    },
    {
      id: 'handyman',
      name: 'FixIt Pro Handyman',
      category: 'Home Services',
      description: 'Local handyman services template with general repairs, home maintenance, and fixture installation.',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop',
      color: 'green',
      data: handymanTemplate
    },
    {
      id: 'dentist',
      name: 'BrightSmile Dental Clinic',
      category: 'Healthcare',
      description: 'Modern dental clinic template with appointment booking and patient care features.',
      thumbnail: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=300&fit=crop',
      color: 'cyan',
      data: dentistTemplate
    },
    {
      id: 'flooring',
      name: 'FloorCraft Flooring',
      category: 'Home Services',
      description: 'Professional flooring installation with hardwood, vinyl, and tile services.',
      thumbnail: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400&h=300&fit=crop',
      color: 'brown',
      data: flooringTemplate
    },
    {
      id: 'windows',
      name: 'ClearView Windows & Doors',
      category: 'Home Services',
      description: 'Window replacement and repair services with energy-efficient solutions.',
      thumbnail: 'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=400&h=300&fit=crop',
      color: 'blue',
      data: windowsTemplate
    },
    {
      id: 'movers',
      name: 'SwiftMove Movers & Packers',
      category: 'Home Services',
      description: 'Full-service moving company for local and long-distance relocations.',
      thumbnail: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=300&fit=crop',
      color: 'orange',
      data: moversTemplate
    },
    {
      id: 'pool-services',
      name: 'AquaCare Pool Services',
      category: 'Home Services',
      description: 'Professional pool maintenance, repair, and renovation services.',
      thumbnail: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400&h=300&fit=crop',
      color: 'blue',
      data: poolServicesTemplate
    },
    {
      id: 'travel-agency',
      name: 'Wanderlust Travel Agency',
      category: 'Travel',
      description: 'Travel agency with vacation packages and personalized trip planning.',
      thumbnail: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop',
      color: 'green',
      data: travelAgencyTemplate
    },
    {
      id: 'flight-booking',
      name: 'SkyWay Flights',
      category: 'Travel',
      description: 'Flight booking service comparing prices across major airlines.',
      thumbnail: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop',
      color: 'indigo',
      data: flightBookingTemplate
    },
    {
      id: 'cruise-booking',
      name: 'OceanVoyage Cruises',
      category: 'Travel',
      description: 'Luxury cruise booking for Caribbean, Mediterranean, and Alaska destinations.',
      thumbnail: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=300&fit=crop',
      color: 'cyan',
      data: cruiseBookingTemplate
    },
    {
      id: 'car-rental',
      name: 'DriveEasy Car Rentals',
      category: 'Travel',
      description: 'Car rental service with economy to luxury vehicles available.',
      thumbnail: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop',
      color: 'red',
      data: carRentalTemplate
    },
    {
      id: 'locksmith',
      name: 'SecureLock Locksmith',
      category: 'Home Services',
      description: '24/7 emergency locksmith services for homes, businesses, and vehicles.',
      thumbnail: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&h=300&fit=crop',
      color: 'blue',
      data: locksmithTemplate
    },
    {
      id: 'garage-door',
      name: 'DoorPro Garage Services',
      category: 'Home Services',
      description: 'Professional garage door repair, installation, and opener services.',
      thumbnail: 'https://images.unsplash.com/photo-1558767132-cb76ffe7ad00?w=400&h=300&fit=crop',
      color: 'orange',
      data: garageDoorTemplate
    },
    {
      id: 'appliance-repair',
      name: 'ApplianceFix Pro',
      category: 'Home Services',
      description: 'Expert repair for refrigerators, washers, dryers, and all major appliances.',
      thumbnail: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=300&fit=crop',
      color: 'cyan',
      data: applianceRepairTemplate
    },
    {
      id: 'pressure-washing',
      name: 'PowerWash Pro',
      category: 'Home Services',
      description: 'Professional pressure washing for driveways, homes, and decks.',
      thumbnail: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=400&h=300&fit=crop',
      color: 'blue',
      data: pressureWashingTemplate
    },
    {
      id: 'gutter-cleaning',
      name: 'GutterGuard Services',
      category: 'Home Services',
      description: 'Professional gutter cleaning, repair, and guard installation.',
      thumbnail: 'https://images.unsplash.com/photo-1551216606-420f2687b398?w=400&h=300&fit=crop',
      color: 'green',
      data: gutterCleaningTemplate
    },
    {
      id: 'fence-install',
      name: 'FenceBuilders Pro',
      category: 'Home Services',
      description: 'Quality fence installation for wood, vinyl, and chain link fencing.',
      thumbnail: 'https://images.unsplash.com/photo-1558618107-d49a9a2b2c53?w=400&h=300&fit=crop',
      color: 'brown',
      data: fenceInstallTemplate
    },
    {
      id: 'concrete',
      name: 'SolidGround Concrete',
      category: 'Home Services',
      description: 'Professional concrete work for driveways, patios, and sidewalks.',
      thumbnail: 'https://images.unsplash.com/photo-1590579491624-f98f36d4c763?w=400&h=300&fit=crop',
      color: 'gray',
      data: concreteTemplate
    },
    {
      id: 'tree-service',
      name: 'TreeCare Arborists',
      category: 'Home Services',
      description: 'Professional tree trimming, removal, and stump grinding services.',
      thumbnail: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop',
      color: 'green',
      data: treeServiceTemplate
    },
    {
      id: 'solar',
      name: 'SunPower Solar',
      category: 'Home Services',
      description: 'Professional solar panel installation for homes and businesses.',
      thumbnail: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop',
      color: 'yellow',
      data: solarTemplate
    },
    {
      id: 'home-security',
      name: 'SafeHome Security',
      category: 'Home Services',
      description: 'Professional home security systems with 24/7 monitoring.',
      thumbnail: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=300&fit=crop',
      color: 'indigo',
      data: homeSecurityTemplate
    },
    {
      id: 'insulation',
      name: 'InsulPro Insulation',
      category: 'Home Services',
      description: 'Professional insulation installation for attics, walls, and more.',
      thumbnail: 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=400&h=300&fit=crop',
      color: 'green',
      data: insulationTemplate
    },
    {
      id: 'chimney',
      name: 'ChimneyCare Services',
      category: 'Home Services',
      description: 'Professional chimney cleaning, repair, and inspection services.',
      thumbnail: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop',
      color: 'brown',
      data: chimneyTemplate
    },
    {
      id: 'water-damage',
      name: 'FloodFix Restoration',
      category: 'Home Services',
      description: '24/7 water damage restoration and flood cleanup services.',
      thumbnail: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop',
      color: 'blue',
      data: waterDamageTemplate
    },
    {
      id: 'mold-removal',
      name: 'MoldFree Solutions',
      category: 'Home Services',
      description: 'Professional mold testing, removal, and prevention services.',
      thumbnail: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=300&fit=crop',
      color: 'purple',
      data: moldRemovalTemplate
    },
    {
      id: 'wifi-printer-support',
      name: 'PrintConnect Pro',
      category: 'IT & Tech Services',
      description: 'WiFi printer setup, troubleshooting, and support for all brands.',
      thumbnail: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=300&fit=crop',
      color: 'blue',
      data: wifiPrinterSupportTemplate
    },
    {
      id: 'router-support',
      name: 'NetFix Router Services',
      category: 'IT & Tech Services',
      description: 'Professional router setup, WiFi optimization, and network troubleshooting.',
      thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=300&fit=crop',
      color: 'green',
      data: routerSupportTemplate
    },
    {
      id: 'smart-tv-support',
      name: 'SmartTV Experts',
      category: 'IT & Tech Services',
      description: 'Smart TV setup, streaming configuration, and troubleshooting services.',
      thumbnail: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop',
      color: 'purple',
      data: smartTvSupportTemplate
    },
    {
      id: 'it-services',
      name: 'TechPro IT Services',
      category: 'IT & Tech Services',
      description: 'Professional IT services, managed IT, and technical support for businesses.',
      thumbnail: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop',
      color: 'gray',
      data: itServicesTemplate
    },
    {
      id: 'smart-home-support',
      name: 'SmartHome Solutions',
      category: 'IT & Tech Services',
      description: 'Smart home device setup, integration, and troubleshooting for Alexa, Google Home, and more.',
      thumbnail: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=300&fit=crop',
      color: 'cyan',
      data: smartHomeSupportTemplate
    },
    {
      id: 'cctv-dvr-services',
      name: 'SecureView CCTV',
      category: 'IT & Tech Services',
      description: 'Professional CCTV installation, DVR setup, and video surveillance services.',
      thumbnail: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=300&fit=crop',
      color: 'red',
      data: cctvDvrTemplate
    }
  ];

  const categories = ['all', 'Home Services', 'IT & Tech Services', 'Travel', 'Healthcare'];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  useEffect(() => {
    setSavedWebsites(getSavedWebsites());
  }, []);

  const handleEditTemplate = (template: typeof templates[0]) => {
    const name = `${template.name} - Copy ${new Date().toLocaleDateString()}`;
    const savedWebsite = createSavedWebsite(template.id, name, template.data);
    setSavedWebsites(getSavedWebsites());
    setEditingWebsite(savedWebsite);
  };

  const handleEditSavedWebsite = (website: SavedWebsite) => {
    setEditingWebsite(website);
  };

  const handleDeleteSavedWebsite = (id: string) => {
    if (confirm('Are you sure you want to delete this saved website?')) {
      deleteSavedWebsite(id);
      setSavedWebsites(getSavedWebsites());
    }
  };

  const handleCloseEditor = () => {
    setEditingWebsite(null);
    setSavedWebsites(getSavedWebsites());
  };

  const handleSaveWebsite = (website: SavedWebsite) => {
    setSavedWebsites(getSavedWebsites());
  };

  const handleDownloadSavedWebsite = (website: SavedWebsite) => {
    downloadTemplate(website.data, `${website.name.toLowerCase().replace(/\s+/g, '-')}.html`);
  };

  if (editingWebsite) {
    return (
      <div className="h-screen w-screen fixed inset-0 z-50">
        <TemplateEditorBuilder 
          savedWebsite={editingWebsite}
          onClose={handleCloseEditor}
          onUpdate={handleSaveWebsite}
        />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Web Templates</h1>
          <p className="text-xs text-slate-500">Browse, edit with AI, and download customized websites</p>
        </div>
      </div>

      {/* Shell View - Two Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Card 1: Stats */}
        <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs text-slate-400 ml-2 font-mono">template_stats.sh</span>
          </div>
          <div className="p-4 font-mono">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-violet-400">{templates.length}</div>
                <div className="text-xs text-slate-400">Templates</div>
              </div>
              <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-emerald-400">{savedWebsites.length}</div>
                <div className="text-xs text-slate-400">Saved</div>
              </div>
              <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-amber-400">{savedWebsites.filter(w => (w as any).customDomain).length}</div>
                <div className="text-xs text-slate-400">Domains</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Config */}
        <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs text-slate-400 ml-2 font-mono">template_config.sh</span>
          </div>
          <div className="p-4 font-mono space-y-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500">categories:</span>
              <span className="text-cyan-400">{categories.length - 1}</span>
              <span className="text-slate-600 mx-1">|</span>
              <span className="text-slate-500">ai_editor:</span>
              <span className="text-green-400">ENABLED</span>
              <span className="text-slate-600 mx-1">|</span>
              <span className="text-slate-500">export:</span>
              <span className="text-pink-400">HTML, ZIP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">industries:</span>
              <span className="text-blue-400">Home Services, IT, Travel, Healthcare</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'templates'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Plus className="w-3 h-3" />
          Browse
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'saved'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FolderOpen className="w-3 h-3" />
          Saved ({savedWebsites.length})
        </button>
        <button
          onClick={() => setActiveTab('connected')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'connected'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Globe className="w-3 h-3" />
          Connected ({savedWebsites.filter(w => (w as any).customDomain).length})
        </button>
      </div>

      {activeTab === 'templates' && (
        <>
          {/* Category Filters */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group"
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                  <img
                    src={template.thumbnail || template.data?.hero_image || 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=300&fit=crop'}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = template.data?.hero_image || 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=300&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 gap-2">
                    <button
                      onClick={() => setPreviewTemplate(template.data)}
                      className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Template
                    </button>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                      template.color === 'green' ? 'bg-green-600' : 'bg-indigo-600'
                    }`}>
                      {template.category}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{template.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setPreviewTemplate(template.data)}
                      className="flex items-center gap-2 text-indigo-600 hover:text-green-700 font-medium text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Live
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-lg font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      Edit with AI
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No templates found</h3>
              <p className="text-gray-500">Try selecting a different category</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'saved' && (
        <div>
          {savedWebsites.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No saved websites yet</h3>
              <p className="text-gray-500 mb-6">Start by editing a template to create your first website</p>
              <button
                onClick={() => setActiveTab('templates')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Browse Templates
              </button>
            </div>
          ) : (
            <>
              {/* Search & Filter Bar */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search websites..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'recent' | 'name')}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="name">Alphabetical</option>
                    </select>
                    <button
                      onClick={() => setListView(!listView)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      {listView ? 'Grid' : 'List'}
                    </button>
                  </div>
                </div>
              </div>

              {/* List/Grid View */}
              {listView ? (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="divide-y divide-gray-200">
                    {savedWebsites
                      .filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.data.title.toLowerCase().includes(searchQuery.toLowerCase()))
                      .sort((a, b) => {
                        if (sortBy === 'recent') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                        return a.name.localeCompare(b.name);
                      })
                      .map((website) => (
                        <div key={website.id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-800">{website.name}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span>Template: {website.data.title}</span>
                              <span>Last edited: {new Date(website.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleEditSavedWebsite(website)}
                              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition-colors"
                            >
                              <Sparkles className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => setDomainModalWebsite(website)}
                              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                              title="Connect custom domain"
                            >
                              <Globe className="w-4 h-4" />
                              Domain
                            </button>
                            <button
                              onClick={() => handleDownloadSavedWebsite(website)}
                              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSavedWebsite(website.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedWebsites
                    .filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.data.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .sort((a, b) => {
                      if (sortBy === 'recent') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                      return a.name.localeCompare(b.name);
                    })
                    .map((website) => (
                      <div key={website.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <div className="text-center text-white">
                            <h3 className="font-bold text-lg">{website.data.title}</h3>
                            <p className="text-sm opacity-80">{website.templateSlug}</p>
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-lg text-gray-800 mb-1">{website.name}</h3>
                          <p className="text-gray-500 text-sm mb-4">
                            Last edited: {new Date(website.updatedAt).toLocaleDateString()}
                          </p>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleEditSavedWebsite(website)}
                              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2 rounded-lg font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition-colors w-full"
                            >
                              <Sparkles className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => setDomainModalWebsite(website)}
                              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors w-full"
                            >
                              <Globe className="w-4 h-4" />
                              Connect Domain
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDownloadSavedWebsite(website)}
                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-1"
                                title="Download"
                              >
                                <Download className="w-5 h-5 mx-auto" />
                              </button>
                              <button
                                onClick={() => handleDeleteSavedWebsite(website.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-1"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5 mx-auto" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'connected' && (
        <ConnectedDomainsTab savedWebsites={savedWebsites} />
      )}

      {previewTemplate && (
        <TemplatePreview 
          template={previewTemplate} 
          onClose={() => setPreviewTemplate(null)} 
        />
      )}

      {domainModalWebsite && (
        <CustomDomainModal
          website={domainModalWebsite}
          onClose={() => setDomainModalWebsite(null)}
        />
      )}
    </div>
  );
};
