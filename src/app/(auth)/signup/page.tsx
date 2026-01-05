'use client';

import Link from 'next/link';
import { User, Palette, Scissors, ArrowRight, Sparkles } from 'lucide-react';

export default function SignupSelectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-50 flex items-center justify-center p-4 overflow-x-hidden">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-800 rounded-2xl mb-6 shadow-lg">
            <Sparkles className="w-8 h-8 text-amber-100" />
          </div>
          <h1 className="font-serif text-4xl text-stone-900 mb-4">
            Begin Your Journey
          </h1>
          <p className="text-lg text-stone-700 max-w-7xl mx-auto">
            Choose your role and join the Neural Threads community. Connect with fashion professionals and bring your style vision to life.
          </p>
        </div>

        {/* Signup Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Customer Option */}
          <Link
            href="/signup/customer"
            className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-stone-200 hover:border-stone-400"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-stone-100/50 to-amber-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-stone-700 to-stone-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-serif text-2xl text-stone-900 mb-3">Customer</h3>
              <p className="text-stone-700 mb-6 leading-relaxed">
                Find talented designers and skilled tailors. Get personalized style recommendations and bring your fashion dreams to life.
              </p>
              <div className="flex items-center text-stone-700 font-semibold group-hover:text-stone-900 group-hover:translate-x-2 transition-all">
                <span>Sign up as Customer</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
          </Link>

          {/* Designer Option */}
          <Link
            href="/signup/designer"
            className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-stone-200 hover:border-rose-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-rose-100/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-rose-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-serif text-2xl text-stone-900 mb-3">Designer</h3>
              <p className="text-stone-700 mb-6 leading-relaxed">
                Showcase your creativity and connect with customers. Build your portfolio and grow your fashion design business.
              </p>
              <div className="flex items-center text-rose-600 font-semibold group-hover:text-rose-700 group-hover:translate-x-2 transition-all">
                <span>Sign up as Designer</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
          </Link>

          {/* Tailor Option */}
          <Link
            href="/signup/tailor"
            className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-stone-200 hover:border-amber-400"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-amber-100/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Scissors className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-serif text-2xl text-stone-900 mb-3">Tailor</h3>
              <p className="text-stone-700 mb-6 leading-relaxed">
                Offer your tailoring services to customers. Manage alteration requests and showcase your craftsmanship.
              </p>
              <div className="flex items-center text-amber-700 font-semibold group-hover:text-amber-800 group-hover:translate-x-2 transition-all">
                <span>Sign up as Tailor</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
          </Link>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-stone-700">
            Already have an account?{' '}
            <Link href="/login" className="text-stone-900 font-semibold hover:text-stone-700 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

