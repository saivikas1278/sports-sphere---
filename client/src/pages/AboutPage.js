import React from 'react';
import { 
  Trophy, 
  Users, 
  LineChart, 
  Smartphone, 
  ShieldCheck, 
  Globe, 
  Heart, 
  Rocket, 
  Lightbulb, 
  Star, 
  Quote 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  const stats = [
    { icon: <Users size={32} />, number: '50K+', label: 'Active Users' },
    { icon: <Trophy size={32} />, number: '10K+', label: 'Tournaments' },
    { icon: <LineChart size={32} />, number: '1M+', label: 'Matches Tracked' },
    { icon: <Globe size={32} />, number: '25+', label: 'Countries' }
  ];

  const features = [
    {
      icon: <Trophy size={32} />,
      title: 'Tournament Management',
      description: 'Create, organize, and manage tournaments with ease. From brackets to live scoring, we handle it all.'
    },
    {
      icon: <LineChart size={32} />,
      title: 'Performance Analytics',
      description: 'Track your progress with detailed analytics and insights to improve your game performance.'
    },
    {
      icon: <Heart size={32} />,
      title: 'Fitness Tracking',
      description: 'Comprehensive fitness tools including workout builders, nutrition tracking, and progress monitoring.'
    },
    {
      icon: <Users size={32} />,
      title: 'Team Collaboration',
      description: 'Connect with teammates, share strategies, and build stronger sporting communities.'
    },
    {
      icon: <Smartphone size={32} />,
      title: 'Mobile Optimized',
      description: 'Access all features seamlessly across desktop, tablet, and mobile devices.'
    },
    {
      icon: <ShieldCheck size={32} />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security ensuring your data is safe and always accessible.'
    }
  ];

  const teamMembers = [
    {
      name: 'Alex Johnson',
      role: 'CEO & Founder',
      bio: 'Former professional athlete with 15+ years in sports technology.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face'
    },
    {
      name: 'Sarah Chen',
      role: 'CTO',
      bio: 'Tech visionary with expertise in scalable sports platforms.',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Head of Product',
      bio: 'UX expert passionate about creating intuitive sports experiences.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face'
    },
    {
      name: 'Emily Foster',
      role: 'Head of Design',
      bio: 'Creative director bringing beautiful designs to sports technology.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face'
    }
  ];

  const testimonials = [
    {
      quote: "SportSphere transformed how we manage our league. The tournament system is incredibly intuitive!",
      author: "Mike Thompson",
      role: "League Commissioner",
      rating: 5
    },
    {
      quote: "The fitness tracking features helped me achieve my personal bests. Highly recommended!",
      author: "Jessica Williams",
      role: "Amateur Athlete",
      rating: 5
    },
    {
      quote: "Perfect platform for organizing our company sports events. Everything we need in one place.",
      author: "David Park",
      role: "HR Manager",
      rating: 5
    }
  ];

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10">
      
      {/* Hero Section */}
      <section className="mb-4 md:mb-6 md:mb-12">
        <div className="max-w-5xl mx-auto text-center p-4 md:p-6 md:p-12 rounded-[40px] glass-panel bg-white/40 overflow-hidden relative">
          <div className="absolute top-[-50%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-50%] right-[-10%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <h1 className="text-xl md:text-3xl md:text-5xl md:text-6xl font-extrabold text-slate-800 mb-4 md:mb-6 tracking-tight relative z-10">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">SportSphere</span>
          </h1>
          <p className="text-xl text-slate-600 mb-4 md:mb-8 max-w-3xl mx-auto font-medium relative z-10">
            Empowering athletes, teams, and sports enthusiasts worldwide with cutting-edge technology 
            that makes sports management effortless and engaging.
          </p>
          <div className="flex flex-wrap justify-center gap-4 relative z-10">
            <span className="px-4 md:px-6 py-2 glass-pill text-sm font-bold text-slate-700 flex items-center gap-2">
              <Trophy size={16} className="text-yellow-500" /> Award Winning
            </span>
            <span className="px-4 md:px-6 py-2 glass-pill text-sm font-bold text-slate-700 flex items-center gap-2">
              <Rocket size={16} className="text-blue-500" /> Fast Growing
            </span>
            <span className="px-4 md:px-6 py-2 glass-pill text-sm font-bold text-slate-700 flex items-center gap-2">
              <Globe size={16} className="text-green-500" /> Global Platform
            </span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mb-4 md:mb-6 md:mb-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="p-4 md:p-6 rounded-[32px] glass-panel text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4 border border-white">
                {stat.icon}
              </div>
              <div className="text-xl md:text-3xl font-extrabold text-slate-800 mb-1">{stat.number}</div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mb-4 md:mb-8 md:mb-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="p-4 md:p-8 md:p-12 rounded-[40px] glass-panel bg-gradient-to-br from-blue-50/50 to-white/50 border-white/60">
            <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 mb-4 md:mb-6">Our Mission</h2>
            <p className="text-lg text-slate-600 mb-4 md:mb-6 font-medium leading-relaxed">
              To democratize sports management by providing accessible, powerful tools that connect 
              athletes, coaches, and organizers in a unified ecosystem.
            </p>
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/60 shadow-sm">
              <Rocket className="text-blue-500 shrink-0" size={24} />
              <span className="text-slate-700 font-bold">Innovation-driven solutions for modern sports</span>
            </div>
          </div>
          <div className="p-4 md:p-8 md:p-12 rounded-[40px] glass-panel bg-gradient-to-br from-purple-50/50 to-white/50 border-white/60">
            <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 mb-4 md:mb-6">Our Vision</h2>
            <p className="text-lg text-slate-600 mb-4 md:mb-6 font-medium leading-relaxed">
              To become the world's leading platform where every athlete, from amateur to professional, 
              can achieve their sporting goals through seamless technology.
            </p>
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/60 shadow-sm">
              <Lightbulb className="text-amber-500 shrink-0" size={24} />
              <span className="text-slate-700 font-bold">Inspiring excellence through data-driven insights</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="mb-4 md:mb-8 md:mb-16 max-w-6xl mx-auto">
        <div className="text-center mb-4 md:mb-6 md:mb-10">
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 mb-4">What Makes Us Special</h2>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Our comprehensive platform combines tournament management, fitness tracking, 
            and community building in one seamless experience.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {features.map((feature, index) => (
            <div key={index} className="p-4 md:p-8 rounded-[32px] glass-panel hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-white/80 rounded-2xl flex items-center justify-center text-blue-500 mb-4 md:mb-6 shadow-sm border border-slate-100">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="mb-4 md:mb-8 md:mb-16 max-w-6xl mx-auto">
        <div className="text-center mb-4 md:mb-6 md:mb-10">
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 mb-4">Meet Our Team</h2>
          <p className="text-lg text-slate-500 font-medium">
            Passionate individuals dedicated to revolutionizing sports technology
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {teamMembers.map((member, index) => (
            <div key={index} className="rounded-[32px] glass-panel overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,255,0.08)] transition-all duration-300 flex flex-col">
              <div className="h-48 w-full p-2">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover rounded-[24px]"
                />
              </div>
              <div className="p-4 md:p-6 pt-4 flex-1 flex flex-col text-center">
                <h3 className="text-lg font-bold text-slate-800">{member.name}</h3>
                <p className="text-blue-500 font-extrabold text-xs uppercase tracking-wider mb-3">{member.role}</p>
                <p className="text-slate-500 text-sm font-medium flex-1">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mb-4 md:mb-8 md:mb-16 max-w-6xl mx-auto">
        <div className="text-center mb-4 md:mb-6 md:mb-10">
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 mb-4">What Our Users Say</h2>
          <p className="text-lg text-slate-500 font-medium">
            Real feedback from our amazing community
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="p-4 md:p-8 rounded-[32px] glass-panel relative flex flex-col">
              <Quote className="absolute top-6 right-6 text-blue-100" size={48} />
              <div className="flex mb-4 md:mb-6 relative z-10">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="text-amber-400 fill-amber-400 mr-1" />
                ))}
              </div>
              <p className="text-slate-600 font-medium italic mb-4 md:mb-6 flex-1 relative z-10 leading-relaxed">"{testimonial.quote}"</p>
              <div className="relative z-10 pt-4 border-t border-white/40">
                <p className="font-bold text-slate-800">{testimonial.author}</p>
                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-4xl mx-auto">
        <div className="p-4 md:p-6 md:p-12 rounded-[40px] bg-gradient-to-br from-blue-500 to-cyan-400 shadow-[0_8px_30px_rgb(59,130,246,0.3)] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
          <h2 className="text-xl md:text-3xl md:text-4xl font-extrabold text-white mb-4 relative z-10">Ready to Join SportSphere?</h2>
          <p className="text-blue-50 text-lg font-medium mb-4 md:mb-8 max-w-2xl mx-auto relative z-10">
            Join thousands of athletes and teams who are already transforming their sports experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link to="/register" className="px-4 md:px-8 py-3 bg-white text-blue-600 font-bold rounded-full shadow-lg hover:scale-105 transition-all">
              Get Started Free
            </Link>
            <Link to="/contact" className="px-4 md:px-8 py-3 border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-all">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
      
      <div className="h-12 md:h-20" />
    </div>
  );
};

export default AboutPage;
