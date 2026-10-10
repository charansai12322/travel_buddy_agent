import React from 'react';
import { MapPin, Plane, Sparkles } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="text-center pt-8 pb-4 sm:pt-12 sm:pb-6">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60 mb-4 shadow-xs">
        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
        <span>Powered by Gemini & Real-time Travel Tools</span>
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
        Where will your next adventure take you?
      </h1>

      <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Tell Travel Buddy what you're planning. Get AI-powered travel guidance, destination research, and flight-search assistance.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-5 text-xs sm:text-sm text-slate-500 font-medium">
        <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          Destinations & Culture
        </span>
        <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
          <Plane className="w-3.5 h-3.5 text-blue-600" />
          Flight Options & Schedules
        </span>
        <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Curated Recommendations
        </span>
      </div>
    </section>
  );
};
