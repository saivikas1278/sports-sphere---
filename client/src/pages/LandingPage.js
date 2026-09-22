import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Trophy, 
  Video, 
  Activity, 
  Users, 
  Clock, 
  Dumbbell,
  ArrowRight,
  Sparkles,
  MapPin,
  Search
} from 'lucide-react';
import FloatingElements from '../components/UI/FloatingElements';

const LandingPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const sports = [
    'Football', 'Basketball', 'Tennis', 'Volleyball', 'Baseball', 'Soccer',
    'Cricket', 'Badminton', 'Table Tennis', 'Hockey', 'Rugby', 'Wrestling'
  ];


  const features = [
    {
      icon: Trophy,
      title: 'Tournament Management',
      description: 'Create and manage tournaments with automatic bracket generation, live scoring, and real-time updates.',
    },
    {
      icon: Video,
      title: 'Video Sharing',
      description: 'Share highlight reels, training videos, and match recordings with the community.',
    },
    {
      icon: Activity,
      title: 'Fitness Tracking',
      description: 'Track workouts, monitor progress, and access personalized fitness content and nutrition guides.',
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Build and manage teams, invite players, and coordinate team activities and schedules.',
    },
    {
      icon: Clock,
      title: 'Live Scoring',
      description: 'Real-time match scoring with live updates, statistics tracking, and instant notifications.',
    },
    {
      icon: Dumbbell,
      title: 'Multi-Sport Support',
      description: 'Support for multiple sports including football, basketball, tennis, volleyball, and more.',
    },
  ];

  const stats = [
    { number: '10K+', label: 'Active Users' },
    { number: '500+', label: 'Tournaments' },
    { number: '50+', label: 'Sports Supported' },
    { number: '1M+', label: 'Matches Played' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingElements />
      

      {/* Trending Near You Section */}
      <section className="py-4 md:py-6 md:py-12 relative z-10 pt-4 md:pt-8 md:pt-16 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-4 md:mb-8">
            <div>
              <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                Trending Tournaments
              </h2>
              <p className="text-slate-500 font-medium mt-1">Popular events happening right now</p>
            </div>
            <Link to="/tournaments" className="hidden sm:flex text-blue-500 font-bold items-center gap-1 hover:text-blue-700 transition-colors">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {[
              { title: "Summer Classic 5v5", sport: "Basketball", location: "Downtown Arena, NY", date: "Aug 15 - Aug 20", fee: "$50/team", prize: "$1000", image: "https://images.unsplash.com/photo-1542652694-40abf526446e?w=800&q=80", color: "from-orange-500 to-red-500" },
              { title: "City League Championship", sport: "Soccer", location: "Central Park Fields, NY", date: "Sep 01 - Sep 10", fee: "$100/team", prize: "$2500", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80", color: "from-green-500 to-emerald-500" },
              { title: "Pro-Am Open", sport: "Tennis", location: "Memorial Courts, NY", date: "Aug 25 - Aug 28", fee: "$30/player", prize: "$500", image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80", color: "from-blue-500 to-indigo-500" },
            ].map((t, idx) => (
              <Link key={idx} to={`/tournaments?location=NY&sport=${t.sport}`} className="group relative rounded-2xl md:rounded-3xl overflow-hidden glass-panel border border-white shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 block">
                <div className="h-48 w-full relative">
                  <img src={t.image} alt={t.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-extrabold text-white bg-gradient-to-r ${t.color}`}>
                    {t.sport}
                  </div>
                </div>
                <div className="p-4 md:p-6 bg-white/60">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 truncate group-hover:text-blue-600 transition-colors">{t.title}</h3>
                  <div className="flex items-center text-slate-500 text-sm font-medium mb-3">
                    <MapPin size={14} className="mr-1 text-slate-400" />
                    <span className="truncate">{t.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-200/60">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Date</span>
                      <span className="font-semibold text-slate-700">{t.date}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Prize</span>
                      <span className="font-extrabold text-blue-600">{t.prize}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 md:mt-6 sm:hidden text-center">
            <Link to="/tournaments" className="inline-flex text-blue-500 font-bold items-center gap-1 hover:text-blue-700 transition-colors">
              View All Tournaments <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-4 md:py-6 md:py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="p-4 md:p-8 rounded-[32px] glass-panel text-center hover:-translate-y-1 transition-transform">
                <div className="text-2xl md:text-4xl md:text-5xl font-extrabold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-4 md:py-6 md:py-12 md:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4 md:mb-8 md:mb-16">
            <h2 className="text-xl md:text-3xl md:text-4xl font-bold text-slate-800 mb-4 tracking-tight">
              Everything You Need
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              From organizing tournaments to tracking fitness goals, we provide all the tools in one unified, beautiful platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-4 md:p-8 rounded-[32px] glass-panel flex flex-col items-start gap-4 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgb(0,0,255,0.08)] transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-white/70 shadow-sm flex items-center justify-center text-blue-500 mb-2">
                    <Icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sports Categories */}
      <section className="py-4 md:py-6 md:py-10 md:py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl md:text-3xl font-bold text-slate-800 mb-4 md:mb-6 md:mb-12 tracking-tight">Supported Sports</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {sports.map((sport, index) => (
              <div key={index} className="px-4 md:px-6 py-3 rounded-full glass-pill text-slate-700 font-medium hover:bg-white/80 hover:text-blue-600 transition-colors cursor-default">
                {sport}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-4 md:p-6 md:p-12 md:p-16 rounded-[40px] glass-panel bg-white/40">
            <h2 className="text-2xl md:text-4xl md:text-5xl font-extrabold mb-4 md:mb-6 text-slate-800 tracking-tight">
              Ready to Play?
            </h2>
            <p className="text-xl text-slate-500 mb-4 md:mb-6 md:mb-10 max-w-2xl mx-auto">
              Join thousands of athletes, teams, and organizers who are already using SportSphere to manage their sports activities.
            </p>
            
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <button className="w-full sm:w-auto px-4 md:px-8 py-4 rounded-full bg-blue-500 text-white font-bold shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:scale-105 transition-transform">
                    Sign Up Free
                  </button>
                </Link>
                <Link to="/contact">
                  <button className="w-full sm:w-auto px-4 md:px-8 py-4 rounded-full glass-panel text-slate-700 font-semibold hover:bg-white/80 hover:scale-105 transition-transform">
                    Contact Us
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
