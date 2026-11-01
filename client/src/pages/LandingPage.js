import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Trophy, 
  Video, 
  Activity, 
  Users, 
  Clock, 
  Dumbbell, 
  ArrowRight, 
  MapPin, 
  Sparkles, 
  Play, 
  Flame, 
  User as UserIcon
} from 'lucide-react';
import FloatingElements from '../components/UI/FloatingElements';

const LandingPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const sports = [
    'Football', 'Basketball', 'Tennis', 'Volleyball', 'Baseball', 'Soccer',
    'Cricket', 'Badminton', 'Table Tennis', 'Hockey', 'Rugby', 'Wrestling'
  ];

  const features = [
    {
      icon: Trophy,
      title: 'Tournament Management',
      description: 'Create and run tournaments with automatic single and double elimination brackets, seedings, and live standing updates.',
    },
    {
      icon: Clock,
      title: 'Multi-Sport Live Scoring',
      description: 'Real-time ball-by-ball and point scoring for Cricket, Badminton, Volleyball, and Kabaddi with WebSocket live sync.',
    },
    {
      icon: Activity,
      title: 'Fitness & Workout Hub',
      description: 'Personalized workout planner, interactive timers, nutrition guides, and athletic progress tracking.',
    },
    {
      icon: Users,
      title: 'Squad & Team Roster',
      description: 'Build teams, recruit athletes, manage match lineups, and coordinate with integrated squad chat.',
    },
    {
      icon: Video,
      title: 'Community & Media Feed',
      description: 'Share game highlights, celebrate victories, stream recorded match videos, and discover trending plays.',
    },
    {
      icon: Dumbbell,
      title: 'Multi-Sport Engine',
      description: 'Engineered specifically for athletes and organizers across 12+ competitive sporting disciplines.',
    },
  ];

  const stats = [
    { number: '10K+', label: 'Active Athletes' },
    { number: '500+', label: 'Tournaments Run' },
    { number: '12+', label: 'Sports Supported' },
    { number: '1M+', label: 'Scored Matches' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingElements />

      {/* Hero Section */}
      <section className="relative z-10 pt-6 md:pt-12 pb-8 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Top Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-pill bg-blue-50/80 border border-blue-200/60 text-blue-600 text-xs sm:text-sm font-bold shadow-sm mb-6 animate-pulse-slow">
              <Sparkles size={16} className="text-blue-500" />
              <span>The Modern Operating System for Competitive Sports</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-800 tracking-tight leading-[1.1] mb-6">
              Connect, Compete & <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">Conquer</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8 font-medium">
              Join tournaments, track ball-by-ball live match scoring, train with dedicated athletic workouts, and manage championship squads all in one place.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              <Link
                to="/tournaments"
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-blue-500 text-white font-bold shadow-[0_6px_20px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:-translate-y-0.5 transition-all text-sm sm:text-base"
              >
                <Trophy size={18} />
                <span>Explore Tournaments</span>
              </Link>

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full glass-panel bg-white/80 border border-white text-slate-700 font-bold hover:text-blue-600 hover:bg-white transition-all text-sm sm:text-base shadow-sm"
                >
                  <UserIcon size={18} className="text-blue-500" />
                  <span>Athlete Dashboard</span>
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full glass-panel bg-white/80 border border-white text-slate-700 font-bold hover:text-blue-600 hover:bg-white transition-all text-sm sm:text-base shadow-sm"
                >
                  <span>Sign Up Free</span>
                  <ArrowRight size={16} />
                </Link>
              )}

              <Link
                to="/matches"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full glass-panel bg-white/50 hover:bg-white/80 border border-white/60 text-slate-600 hover:text-slate-800 font-bold transition-all text-sm sm:text-base"
              >
                <Play size={16} className="text-emerald-500 fill-emerald-500" />
                <span>Live Matches</span>
              </Link>
            </div>

            {/* Authenticated Athlete Quick Bar */}
            {isAuthenticated && (
              <div className="max-w-2xl mx-auto p-4 rounded-3xl glass-panel bg-white/70 border border-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white font-bold flex items-center justify-center shadow-[0_4px_12px_rgb(59,130,246,0.35)]">
                    {user?.firstName ? user.firstName[0].toUpperCase() : 'A'}
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Logged In As</div>
                    <div className="text-sm font-extrabold text-slate-800">
                      {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Athlete'}
                      <span className="ml-2 px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-blue-100 text-blue-600 border border-blue-200">
                        {user?.role || 'Athlete'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Link
                    to="/dashboard"
                    className="flex-1 sm:flex-initial text-center px-4 py-2 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                  >
                    Passport & Stats
                  </Link>
                  <Link
                    to="/tournaments/create"
                    className="flex-1 sm:flex-initial text-center px-4 py-2 text-xs font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                  >
                    + Host Event
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Highlights Banner */}
      <section className="py-4 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: Trophy, title: 'Brackets & Tournaments', subtitle: 'Automated Single/Double Elim', color: 'text-amber-500', bg: 'bg-amber-50' },
              { icon: Play, title: 'Live Ball Scoring', subtitle: 'Real-time WebSocket match sync', color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { icon: Users, title: 'Squad Management', subtitle: 'Roster creation & player invites', color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: Flame, title: 'Fitness Training', subtitle: 'Guided workouts & tracking', color: 'text-rose-500', bg: 'bg-rose-50' }
            ].map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div key={idx} className="p-4 rounded-2xl md:rounded-3xl glass-panel bg-white/60 border border-white flex items-center gap-3 shadow-sm hover:-translate-y-0.5 transition-all">
                  <div className={`w-11 h-11 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0 shadow-inner`}>
                    <ItemIcon size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 truncate font-medium">{item.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending Tournaments Section */}
      <section className="py-8 md:py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                Trending Tournaments
              </h2>
              <p className="text-slate-500 font-medium text-sm mt-1">Popular athletic events open for registration right now</p>
            </div>
            <Link to="/tournaments" className="hidden sm:flex text-blue-500 font-bold items-center gap-1 hover:text-blue-700 transition-colors text-sm">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
      <section className="py-6 md:py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="p-4 md:p-6 rounded-[28px] glass-panel bg-white/60 border border-white text-center hover:-translate-y-1 transition-transform shadow-sm">
                <div className="text-2xl md:text-4xl font-extrabold text-blue-600 mb-1">
                  {stat.number}
                </div>
                <div className="text-slate-500 font-semibold text-xs md:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 md:py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">
              Engineered For Modern Sports
            </h2>
            <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto font-medium">
              From organizing professional tournaments to daily athletic training, everything is seamlessly integrated.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-6 md:p-8 rounded-[32px] glass-panel bg-white/60 border border-white flex flex-col items-start gap-4 hover:-translate-y-1.5 hover:shadow-[0_12px_36px_rgb(59,130,246,0.12)] transition-all">
                  <div className="w-13 h-13 p-3 rounded-2xl bg-blue-50 text-blue-600 shadow-sm flex items-center justify-center">
                    <Icon size={26} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Supported Sports Categories */}
      <section className="py-8 md:py-14 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-6 tracking-tight">Supported Sports</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {sports.map((sport, index) => (
              <div key={index} className="px-5 py-2.5 rounded-full glass-pill bg-white/70 border border-white/60 text-slate-700 font-bold text-xs sm:text-sm hover:bg-white hover:text-blue-600 transition-colors shadow-sm cursor-default">
                {sport}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 relative z-10 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 md:p-14 rounded-[40px] glass-panel bg-white/60 border border-white shadow-[0_12px_40px_rgb(59,130,246,0.08)]">
            <h2 className="text-2xl md:text-4xl font-extrabold mb-4 text-slate-800 tracking-tight">
              Ready to Compete & Lead?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-2xl mx-auto font-medium">
              Join thousands of athletes, teams, and tournament organizers who rely on SportSphere every day.
            </p>
            
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-500 text-white font-bold shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:scale-105 transition-all">
                    Sign Up Free
                  </button>
                </Link>
                <Link to="/tournaments">
                  <button className="w-full sm:w-auto px-8 py-4 rounded-full glass-panel bg-white/80 border border-white text-slate-700 font-semibold hover:bg-white hover:scale-105 transition-all">
                    Browse Tournaments
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/tournaments">
                  <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-500 text-white font-bold shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:scale-105 transition-all">
                    View Live Tournaments
                  </button>
                </Link>
                <Link to="/dashboard">
                  <button className="w-full sm:w-auto px-8 py-4 rounded-full glass-panel bg-white/80 border border-white text-slate-700 font-semibold hover:bg-white hover:scale-105 transition-all">
                    Go To My Dashboard
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
