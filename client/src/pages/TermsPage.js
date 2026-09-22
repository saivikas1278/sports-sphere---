import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Gavel, AlertTriangle, Handshake, Users, ShieldAlert } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-4xl">
      {/* Header */}
      <section className="mb-4 md:mb-6 md:mb-12">
        <div className="p-4 md:p-6 md:p-12 rounded-[40px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_8px_30px_rgb(99,102,241,0.3)] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none"></div>
          
          <FileText className="mx-auto mb-4 md:mb-6 text-white/80 relative z-10" size={64} />
          <h1 className="text-2xl md:text-4xl md:text-5xl font-extrabold mb-4 relative z-10 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xl text-indigo-100 font-medium mb-4 max-w-2xl mx-auto relative z-10">
            Please read these terms carefully before using SportSphere
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="space-y-8">
        
        {/* Last Updated */}
        <div className="p-4 md:p-6 rounded-[24px] glass-panel bg-indigo-50/60 border border-indigo-100 flex items-center justify-center">
          <p className="text-sm font-bold text-indigo-800 uppercase tracking-wider">
            Last updated: <span className="text-indigo-600">August 15, 2025</span>
          </p>
        </div>

        {/* Introduction */}
        <div className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/60">
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            Welcome to SportSphere! These Terms of Service ("Terms") govern your use of our platform and services. 
            By accessing or using SportSphere, you agree to be bound by these Terms.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          
          {/* Acceptance of Terms */}
          <section className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/40 hover:bg-white/60 transition-colors">
            <div className="flex items-center mb-4 md:mb-8">
              <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <Handshake size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Acceptance of Terms</h2>
            </div>
            
            <p className="text-slate-600 font-medium mb-4 md:mb-6">
              By creating an account or using SportSphere, you confirm that:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['You are at least 13 years old', 'You have the legal capacity to enter into these Terms', 'You will comply with all applicable laws and regulations', 'All information you provide is accurate and current'].map((item, i) => (
                <div key={i} className="p-4 bg-white/60 rounded-2xl border border-white/40 flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 shrink-0"></span>
                  <span className="text-slate-600 font-medium text-sm">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Platform Use */}
          <section className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/40 hover:bg-white/60 transition-colors">
            <div className="flex items-center mb-4 md:mb-8">
              <div className="w-12 h-12 bg-green-100 text-green-500 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <Users size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Platform Use</h2>
            </div>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Permitted Uses
                </h3>
                <ul className="space-y-3 ml-4">
                  {['Create and manage sports tournaments', 'Form and join teams', 'Track fitness activities and goals', 'Share sports-related content', 'Connect with other sports enthusiasts'].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-3 mt-2 shrink-0"></span>
                      <span className="text-slate-600 font-medium leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Prohibited Activities
                </h3>
                <ul className="space-y-3 ml-4">
                  {['Harassment, bullying, or threatening behavior', 'Sharing inappropriate or offensive content', 'Attempting to hack or compromise platform security', 'Creating fake accounts or impersonating others', 'Violating any applicable laws or regulations'].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-3 mt-2 shrink-0"></span>
                      <span className="text-slate-600 font-medium leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* User Content */}
          <section className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/40 hover:bg-white/60 transition-colors">
            <div className="flex items-center mb-4 md:mb-8">
              <div className="w-12 h-12 bg-purple-100 text-purple-500 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <ShieldAlert size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">User Content</h2>
            </div>
            <p className="text-slate-600 font-medium mb-4 md:mb-6">
              You retain ownership of content you post, but grant SportSphere a license to:
            </p>
            <div className="flex flex-wrap gap-3 mb-4 md:mb-6">
              {['Display your content on the platform', 'Moderate content for community guidelines', 'Use content for platform improvement and marketing'].map((item, i) => (
                <span key={i} className="px-4 py-2 bg-white/80 border border-slate-100 text-slate-600 font-bold text-sm rounded-full">
                  {item}
                </span>
              ))}
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              You are responsible for ensuring your content doesn't violate any rights or laws.
            </p>
          </section>

          {/* Privacy */}
          <section className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/40 hover:bg-white/60 transition-colors">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-4 tracking-tight">Privacy</h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Your privacy is important to us. Our collection and use of personal information is governed by our{' '}
              <Link to="/privacy" className="text-indigo-500 hover:text-indigo-700 font-bold underline decoration-indigo-200 underline-offset-4 transition-colors">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference.
            </p>
          </section>

          {/* Disclaimers */}
          <section className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/40 hover:bg-white/60 transition-colors">
            <div className="flex items-center mb-4 md:mb-8">
              <div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Disclaimers</h2>
            </div>
            <ul className="space-y-4">
              {[
                { title: 'Platform Availability', desc: 'We strive for 99.9% uptime but cannot guarantee uninterrupted service' },
                { title: 'User-Generated Content', desc: 'We are not responsible for content posted by users' },
                { title: 'Third-Party Links', desc: 'External links are provided for convenience; we don\'t endorse linked content' },
                { title: 'Fitness Information', desc: 'Fitness content is for informational purposes only, not medical advice' }
              ].map((item, i) => (
                <li key={i} className="flex flex-col sm:flex-row sm:items-center p-4 bg-white/60 rounded-2xl border border-white/40">
                  <span className="font-extrabold text-slate-700 sm:w-1/3 shrink-0 mb-1 sm:mb-0">{item.title}</span>
                  <span className="text-slate-600 font-medium text-sm">{item.desc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/40 hover:bg-white/60 transition-colors">
            <div className="flex items-center mb-4 md:mb-8">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <Gavel size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Limitation of Liability</h2>
            </div>
            <p className="text-slate-600 font-medium mb-4 md:mb-6">
              To the maximum extent permitted by law, SportSphere shall not be liable for:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Indirect, incidental, or consequential damages', 'Loss of profits, data, or business opportunities', 'Damages arising from user interactions or content', 'Service interruptions or technical issues'].map((item, i) => (
                <div key={i} className="p-4 bg-white/60 rounded-2xl border border-white/40 flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3 mt-2 shrink-0"></span>
                  <span className="text-slate-600 font-medium text-sm">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Termination & Changes & Governing Law */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
            <section className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 flex flex-col">
              <h2 className="text-xl font-extrabold text-slate-800 mb-4 tracking-tight">Account Termination</h2>
              <ul className="space-y-3 mt-auto">
                {['You may delete your account at any time', 'We may suspend or terminate accounts for Terms violations', 'We may discontinue the service with reasonable notice'].map((item, i) => (
                  <li key={i} className="flex items-start text-sm">
                    <span className="text-slate-400 mr-2 font-bold">•</span>
                    <span className="text-slate-600 font-medium leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            
            <section className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 flex flex-col">
              <h2 className="text-xl font-extrabold text-slate-800 mb-4 tracking-tight">Changes to Terms</h2>
              <p className="text-slate-600 font-medium text-sm leading-relaxed mt-auto">
                We may update these Terms from time to time. Material changes will be communicated through 
                the platform or via email. Continued use after changes constitutes acceptance.
              </p>
            </section>
            
            <section className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 flex flex-col">
              <h2 className="text-xl font-extrabold text-slate-800 mb-4 tracking-tight">Governing Law</h2>
              <p className="text-slate-600 font-medium text-sm leading-relaxed mt-auto">
                These Terms are governed by the laws of the jurisdiction where SportSphere operates. 
                Any disputes will be resolved through binding arbitration.
              </p>
            </section>
          </div>

          {/* Contact Information */}
          <section className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-indigo-50/80 border border-indigo-100">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-4 tracking-tight">Questions About Terms</h2>
            <p className="text-slate-600 font-medium mb-4 md:mb-6 leading-relaxed">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-white/60 rounded-2xl p-4 md:p-6 border border-white/40">
              <p className="text-slate-700 font-bold mb-2">Email: <span className="text-indigo-500 font-medium">legal@sportsphere.com</span></p>
              <p className="text-slate-700 font-bold mb-4 md:mb-6">Address: <span className="text-slate-600 font-medium">SportSphere Legal Team</span></p>
              <Link to="/contact" className="inline-flex items-center px-4 md:px-6 py-3 bg-indigo-500 text-white font-bold rounded-full shadow-sm hover:bg-indigo-600 hover:-translate-y-0.5 transition-all">
                Contact Support
              </Link>
            </div>
          </section>
        </div>

        {/* Agreement Notice */}
        <div className="p-4 md:p-6 rounded-[24px] glass-panel bg-green-50/60 border border-green-200 text-center">
          <p className="text-sm font-extrabold text-green-800 leading-relaxed uppercase tracking-wide">
            By using SportSphere, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
      
      <div className="h-12 md:h-20" />
    </div>
  );
};

export default TermsPage;
