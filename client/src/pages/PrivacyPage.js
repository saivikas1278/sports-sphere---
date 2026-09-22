import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Database, Cookie, Eye, UserCheck, Lock } from 'lucide-react';

const PrivacyPage = () => {
  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-4xl">
      {/* Header */}
      <section className="mb-4 md:mb-6 md:mb-12">
        <div className="p-4 md:p-6 md:p-12 rounded-[40px] bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_8px_30px_rgb(59,130,246,0.3)] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none"></div>
          
          <Shield className="mx-auto mb-4 md:mb-6 text-white/80 relative z-10" size={64} />
          <h1 className="text-2xl md:text-4xl md:text-5xl font-extrabold mb-4 relative z-10 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xl text-blue-100 font-medium mb-4 max-w-2xl mx-auto relative z-10">
            Your privacy matters to us. Learn how we protect and handle your data.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="space-y-8">
        
        {/* Last Updated */}
        <div className="p-4 md:p-6 rounded-[24px] glass-panel bg-blue-50/60 border border-blue-100 flex items-center justify-center">
          <p className="text-sm font-bold text-blue-800 uppercase tracking-wider">
            Last updated: <span className="text-blue-600">August 15, 2025</span>
          </p>
        </div>

        {/* Introduction */}
        <div className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/60">
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            At SportSphere, we are committed to protecting your privacy and ensuring the security of your personal information. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </p>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-6">
          
          {/* Information We Collect */}
          <section className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/40 hover:bg-white/60 transition-colors">
            <div className="flex items-center mb-4 md:mb-8">
              <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <Database size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Information We Collect</h2>
            </div>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Personal Information
                </h3>
                <ul className="space-y-3 ml-4">
                  {['Name, email address, and profile information', 'Sports preferences and fitness goals', 'Team and tournament participation data', 'Workout and activity tracking information'].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-3 mt-2 shrink-0"></span>
                      <span className="text-slate-600 font-medium leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                  Usage Information
                </h3>
                <ul className="space-y-3 ml-4">
                  {['How you interact with our platform', 'Device information and IP address', 'Browser type and operating system', 'Pages visited and time spent on the platform'].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-3 mt-2 shrink-0"></span>
                      <span className="text-slate-600 font-medium leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/40 hover:bg-white/60 transition-colors">
            <div className="flex items-center mb-4 md:mb-8">
              <div className="w-12 h-12 bg-green-100 text-green-500 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <Eye size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">How We Use Your Information</h2>
            </div>
            <ul className="space-y-4 ml-2">
              {['Provide and maintain our services', 'Personalize your experience and recommendations', 'Process tournament registrations and team formations', 'Send important notifications about your activities', 'Improve our platform and develop new features', 'Ensure platform security and prevent fraud'].map((item, i) => (
                <li key={i} className="flex items-center p-3 bg-white/60 rounded-xl border border-white/40">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-4 shrink-0"></span>
                  <span className="text-slate-600 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Data Security */}
          <section className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/40 hover:bg-white/60 transition-colors">
            <div className="flex items-center mb-4 md:mb-8">
              <div className="w-12 h-12 bg-purple-100 text-purple-500 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <Lock size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Data Security</h2>
            </div>
            <p className="text-slate-600 font-medium mb-4 md:mb-6 leading-relaxed">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Encryption of data in transit and at rest', 'Regular security audits and updates', 'Access controls and authentication measures', 'Secure hosting infrastructure'].map((item, i) => (
                <div key={i} className="p-4 bg-white/60 rounded-2xl border border-white/40 flex items-start">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2 shrink-0"></span>
                  <span className="text-slate-600 font-medium text-sm">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Cookies */}
          <section className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/40 hover:bg-white/60 transition-colors">
            <div className="flex items-center mb-4 md:mb-8">
              <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <Cookie size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Cookies and Tracking</h2>
            </div>
            <p className="text-slate-600 font-medium mb-4 md:mb-6 leading-relaxed">
              We use cookies and similar technologies to enhance your experience:
            </p>
            <ul className="space-y-4 ml-2 mb-4 md:mb-6">
              {['Essential cookies for platform functionality', 'Analytics cookies to understand usage patterns', 'Preference cookies to remember your settings'].map((item, i) => (
                <li key={i} className="flex items-center p-3 bg-white/60 rounded-xl border border-white/40">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-4 shrink-0"></span>
                  <span className="text-slate-600 font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              You can control cookie preferences through your browser settings.
            </p>
          </section>

          {/* Your Rights */}
          <section className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/40 hover:bg-white/60 transition-colors">
            <div className="flex items-center mb-4 md:mb-8">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <UserCheck size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Your Rights</h2>
            </div>
            <p className="text-slate-600 font-bold mb-4 md:mb-6">You have the right to:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Access your personal data', 'Correct inaccurate information', 'Delete your account and data', 'Export your data', 'Opt-out of marketing communications', 'Object to data processing'].map((item, i) => (
                <div key={i} className="p-4 bg-white/60 rounded-2xl border border-white/40 flex items-start">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3 mt-2 shrink-0"></span>
                  <span className="text-slate-600 font-medium text-sm">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/40 hover:bg-white/60 transition-colors">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-4 md:mb-6 tracking-tight">Third-Party Services</h2>
            <p className="text-slate-600 font-medium mb-4 md:mb-6 leading-relaxed">
              We may use third-party services for:
            </p>
            <div className="flex flex-wrap gap-3 mb-4 md:mb-6">
              {['Analytics and performance monitoring', 'Cloud storage and hosting', 'Payment processing', 'Email delivery services'].map((item, i) => (
                <span key={i} className="px-4 py-2 bg-white/80 border border-slate-100 text-slate-600 font-bold text-sm rounded-full">
                  {item}
                </span>
              ))}
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              These services have their own privacy policies and we encourage you to review them.
            </p>
          </section>

          {/* Contact Information */}
          <section className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-blue-50/80 border border-blue-100">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-4 tracking-tight">Contact Us</h2>
            <p className="text-slate-600 font-medium mb-4 md:mb-6 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-white/60 rounded-2xl p-4 md:p-6 border border-white/40">
              <p className="text-slate-700 font-bold mb-2">Email: <span className="text-blue-500 font-medium">privacy@sportsphere.com</span></p>
              <p className="text-slate-700 font-bold mb-4 md:mb-6">Address: <span className="text-slate-600 font-medium">SportSphere Privacy Team</span></p>
              <Link to="/contact" className="inline-flex items-center px-4 md:px-6 py-3 bg-blue-500 text-white font-bold rounded-full shadow-sm hover:bg-blue-600 hover:-translate-y-0.5 transition-all">
                Contact Support
              </Link>
            </div>
          </section>
        </div>

        {/* Changes to Policy */}
        <div className="p-4 md:p-6 rounded-[24px] glass-panel bg-amber-50/60 border border-amber-100">
          <p className="text-sm font-medium text-amber-800 leading-relaxed">
            <strong className="font-extrabold block mb-1">Changes to this Policy:</strong> 
            We may update this Privacy Policy from time to time. 
            We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </div>
      </div>
      
      <div className="h-12 md:h-20" />
    </div>
  );
};

export default PrivacyPage;
