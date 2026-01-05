'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ChevronDown,
  Users,
  Scissors,
  MessageCircle,
  Globe,
  Shield,
  Star,
  MapPin,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react';

// Language options
const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
];

// Features data
const features = [
  {
    icon: Users,
    title: 'Elite Designers',
    description: 'Connect with verified fashion designers who bring your vision to life with unmatched creativity.',
    gradient: 'from-warm-coral to-warm-rose',
  },
  {
    icon: Scissors,
    title: 'Master Tailors',
    description: 'Find skilled tailors in your area who deliver precision craftsmanship for the perfect fit.',
    gradient: 'from-warm-rose to-warm-taupe',
  },
  {
    icon: MessageCircle,
    title: 'Real-Time Chat',
    description: 'Communicate directly with designers and tailors. Share ideas, images, and feedback instantly.',
    gradient: 'from-warm-apricot to-warm-coral',
  },
  {
    icon: Sparkles,
    title: 'AI Stylist',
    description: 'Get personalized style recommendations powered by AI that understands your unique preferences.',
    gradient: 'from-warm-taupe to-warm-rose',
  },
  {
    icon: Globe,
    title: 'Multilingual',
    description: 'Experience the platform in your preferred language. We support English, Hindi, Kannada & more.',
    gradient: 'from-warm-rose to-warm-coral',
  },
  {
    icon: Shield,
    title: 'Secure & Verified',
    description: 'Every designer and tailor is verified. Your transactions and data are always protected.',
    gradient: 'from-warm-coral to-warm-taupe',
  },
];

// Sample designers
const designers = [
  {
    name: 'Priya Mehta',
    specialty: 'Bridal Couture',
    experience: 12,
    location: 'MG Road',
    rating: 4.9,
    designs: 340,
    gradient: 'from-warm-light via-warm-apricot to-warm-coral',
    accentColor: 'text-warm-rose',
  },
  {
    name: 'Arjun Reddy',
    specialty: 'Contemporary Casual',
    experience: 8,
    location: 'Commercial Street',
    rating: 4.8,
    designs: 215,
    gradient: 'from-stone-300 via-warm-light to-warm-apricot',
    accentColor: 'text-warm-taupe',
  },
  {
    name: 'Ananya Singh',
    specialty: 'Fusion Wear',
    experience: 10,
    location: 'MG Road',
    rating: 4.9,
    designs: 280,
    gradient: 'from-warm-apricot via-warm-light to-warm-coral',
    accentColor: 'text-warm-rose',
  },
];

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8DED0' }}>
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-lg border-b border-stone-200'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Logo - Clean serif style */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-warm-taupe rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-warm-light" />
              </div>
              <div>
                <h1 className="font-serif text-2xl text-stone-900 tracking-tight">
                  Neural Threads
                </h1>
                <p className="text-[10px] text-stone-500 tracking-widest uppercase">
                  Cognitive Couture
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-2 text-sm text-stone-600 bg-transparent border-none focus:outline-none hover:text-stone-900 transition-colors"
                >
                  <span className="text-lg">{selectedLang.flag}</span>
                  <span>{selectedLang.code}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-200 py-2 animate-fade-up">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setSelectedLang(lang);
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors ${
                          selectedLang.code === lang.code ? 'bg-stone-50 text-stone-900' : 'text-stone-600'
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-sm font-medium">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Auth Buttons */}
              <Link
                href="/login"
                className="text-sm text-stone-700 hover:text-stone-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-full hover:bg-stone-800 transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-stone-100 transition-colors text-stone-700"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-stone-200 animate-fade-in">
            <div className="px-4 py-6 space-y-4">
              {/* Language Options */}
              <div className="pb-4 border-b border-stone-200">
                <p className="text-sm text-stone-500 mb-3">Select Language</p>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLang(lang)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedLang.code === lang.code
                          ? 'bg-stone-100 text-stone-900'
                          : 'bg-stone-50 text-stone-700'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auth Links */}
              <Link
                href="/login"
                className="block w-full py-3 text-center font-medium text-stone-700 hover:text-stone-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block w-full py-3 text-center font-semibold text-white bg-stone-900 rounded-full hover:bg-stone-800 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-warm-light via-stone-50 to-warm-apricot/30 relative overflow-hidden pt-32 lg:pt-40 pb-20 lg:pb-32">
        {/* Decorative circles (subtle) */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-warm-apricot/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-warm-coral/20 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full border border-stone-300 animate-fade-up">
                <Sparkles className="w-3.5 h-3.5 text-warm-coral" />
                <span className="text-xs text-stone-800 font-medium tracking-wide">
                  The Future of Fashion is Here
                </span>
              </div>
              {/* Main heading - Elegant serif, neutral colors */}
              <h1 className="font-serif text-6xl lg:text-7xl leading-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
                <span className="text-stone-400">Where </span>
                <span className="text-stone-900 italic">Creativity</span>
                <br />
                <span className="text-stone-400">Meets</span>
                <br />
                <span className="text-stone-900 font-semibold">Craftsmanship</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-stone-600 leading-relaxed max-w-xl animate-fade-up" style={{ animationDelay: '0.2s' }}>
                Connect with elite designers and master tailors. Your vision, perfectly realized through the perfect blend of technology and artistry.
              </p>
              {/* Buttons - Elegant style */}
              <div className="flex flex-wrap gap-4 pt-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all font-semibold shadow-lg shadow-stone-900/20 inline-flex items-center gap-2 text-base"
                >
                  <span>Begin Your Journey</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/designers"
                  className="px-8 py-4 border-2 border-stone-400 text-stone-900 rounded-full hover:border-stone-900 hover:bg-stone-100 transition-all font-semibold text-base"
                >
                  Explore Collections
                </Link>
              </div>

              {/* Stats - Elegant layout */}
              <div className="flex items-center gap-12 pt-8 border-t border-stone-300 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                <div>
                  <p className="font-serif text-4xl text-warm-rose">500+</p>
                  <p className="text-sm text-stone-700 mt-1 font-medium">Verified Designers</p>
                </div>
                <div>
                  <p className="font-serif text-4xl text-warm-rose">200+</p>
                  <p className="text-sm text-stone-700 mt-1 font-medium">Expert Tailors</p>
                </div>
                <div>
                  <p className="font-serif text-4xl text-warm-taupe">50k+</p>
                  <p className="text-sm text-stone-700 mt-1 font-medium">Designs Created</p>
                </div>
              </div>
            </div>

            {/* Right: Visual card - Soft colors */}
            <div className="relative animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <div className="relative bg-white rounded-3xl p-8 border-2 border-stone-200 shadow-2xl shadow-stone-300/20">
                {/* Top section */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 to-stone-300"></div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-300 to-amber-200"></div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-200 to-stone-200"></div>
                    </div>
                    <span className="text-sm text-stone-700 font-medium">2.5k+ Active</span>
                  </div>
                  
                  <div className="px-3 py-1.5 bg-stone-100 text-stone-800 text-xs font-medium rounded-full flex items-center space-x-1 border border-stone-300">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span>Verified</span>
                  </div>
                </div>
                {/* Center icon - Neutral colors */}
                <div className="w-24 h-24 bg-gradient-to-br from-warm-taupe to-warm-rose rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-xl">
                  <Sparkles className="w-12 h-12 text-warm-light" />
                </div>
                {/* Text */}
                <h3 className="font-serif text-2xl text-stone-900 text-center mb-2">
                  Fashion Reimagined
                </h3>
                <p className="text-sm text-stone-600 text-center font-medium">
                  AI-Powered Style
                </p>
                {/* Background gradient - Soft warm tones */}
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-br from-warm-apricot via-warm-light to-warm-apricot/50 rounded-full -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          {/* Heading */}
          <div className="text-center mb-16">
            <h2 className="font-serif text-5xl text-stone-900 mb-4">
              Everything You Need to <span className="italic text-amber-600">Create Magic</span>
            </h2>
            <p className="text-lg text-stone-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with traditional craftsmanship to deliver an unparalleled fashion experience.
            </p>
          </div>
          {/* Feature cards - 3x2 grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const isChat = feature.title === 'Real-Time Chat';
              return (
                <div
                  key={feature.title}
                  className={`group relative rounded-3xl p-8 border transition-all ${
                    isChat 
                      ? 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200 hover:shadow-xl hover:shadow-rose-200/50' 
                      : 'bg-stone-50 border-stone-200 hover:shadow-xl hover:shadow-stone-200/50'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-serif text-2xl text-stone-900 mb-3">{feature.title}</h3>
                  <p className={`leading-relaxed ${isChat ? 'text-stone-700' : 'text-stone-600'}`}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Designer Spotlight */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-5xl text-stone-900 mb-4">
              Meet Our <span className="italic text-amber-700">Featured Designers</span>
            </h2>
            <p className="text-lg text-stone-700">
              Discover talented designers who are transforming fashion with their unique vision and exceptional skill.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {designers.map((designer, index) => (
              <div
                key={designer.name}
                className="group relative bg-white rounded-3xl overflow-hidden border border-stone-200 hover:shadow-2xl hover:shadow-stone-300/30 transition-all"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Gradient Header */}
                <div className={`h-48 bg-gradient-to-br ${designer.gradient} relative`}>
                  <div className="absolute top-4 left-4 w-16 h-16 bg-white rounded-2xl flex items-center justify-center border-2 border-white shadow-lg">
                    <span className="font-serif text-2xl text-stone-900">
                      {designer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 w-8 h-8 bg-stone-700 rounded-full flex items-center justify-center border-2 border-white">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-serif text-2xl text-stone-900 mb-1">{designer.name}</h3>
                  <p className={`${designer.accentColor || 'text-amber-600'} font-medium mb-3`}>{designer.specialty}</p>

                  <div className="flex items-center text-sm text-stone-600 space-x-4 mb-3">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{designer.rating}</span>
                    </div>
                    <span>•</span>
                    <span>{designer.experience} years exp.</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-stone-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{designer.location}</span>
                    </div>
                    <span className={`${designer.accentColor || 'text-amber-600'} font-medium`}>{designer.designs} designs</span>
                  </div>

                  <button className="w-full py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all font-medium">
                    Start Conversation
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/designers"
              className="inline-flex items-center gap-2 text-stone-700 font-semibold hover:text-stone-900 transition-colors"
            >
              View All Designers
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-amber-100 via-stone-100 to-rose-100 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl"></div>
        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <h2 className="font-serif text-6xl text-stone-900 mb-6">
            Ready to Transform Your <span className="italic text-amber-700">Wardrobe</span>?
          </h2>
          <p className="text-xl text-stone-700 mb-10 leading-relaxed">
            Join thousands of fashion enthusiasts who have discovered their perfect style through Neural Threads.
          </p>
          <Link
            href="/signup"
            className="px-12 py-5 bg-white text-stone-900 rounded-full font-semibold text-lg shadow-2xl shadow-stone-900/10 hover:shadow-3xl hover:scale-105 transition-all inline-flex items-center space-x-2"
          >
            <span>Create Your Account - It&apos;s Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-stone-500 mt-6">
            No credit card required • Setup in 2 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-serif text-2xl">Neural Threads</span>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed">
                Connecting creative minds with skilled hands. Where technology meets tradition to bring your fashion dreams to life.
              </p>
            </div>
            {/* Platform */}
            <div>
              <h3 className="font-semibold mb-4 text-amber-400">Platform</h3>
              <ul className="space-y-2 text-sm text-stone-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/designers" className="hover:text-white transition-colors">Designers</Link></li>
                <li><Link href="/tailors" className="hover:text-white transition-colors">Tailors</Link></li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4 text-amber-400">Legal</h3>
              <ul className="space-y-2 text-sm text-stone-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            {/* Newsletter */}
            <div>
              <h3 className="font-semibold mb-4 text-amber-400">Stay Updated</h3>
              <p className="text-sm text-stone-400 mb-4">
                Get the latest fashion trends and updates.
              </p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="flex-1 px-4 py-2 bg-stone-800 border border-stone-700 rounded-l-full text-sm focus:outline-none focus:border-amber-600"
                />
                <button className="px-6 py-2 bg-amber-600 hover:bg-amber-700 rounded-r-full transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-800 pt-8 text-center text-sm text-stone-500">
            © {new Date().getFullYear()} Neural Threads. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
