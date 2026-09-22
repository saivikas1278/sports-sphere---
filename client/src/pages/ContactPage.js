import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Headset,
  HelpCircle,
  Bug,
  Lightbulb,
  UserCheck,
  Handshake,
  Send,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { FaTwitter, FaFacebook, FaLinkedin, FaInstagram } from 'react-icons/fa';
import contactService from '../services/contactService';
import { showToast } from '../utils/toast';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
    priority: 'medium'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const contactMethods = [
    {
      icon: <Mail size={32} />,
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      contact: 'leelamadhav.nulakani@gmail.com',
      action: 'mailto:leelamadhav.nulakani@gmail.com',
      color: 'text-blue-500'
    },
    {
      icon: <Phone size={32} />,
      title: 'Phone Support',
      description: 'Speak directly with our team',
      contact: '+1 (555) 123-4567',
      action: 'tel:+15551234567',
      color: 'text-green-500'
    },
    {
      icon: <Headset size={32} />,
      title: 'Live Chat',
      description: 'Real-time support chat',
      contact: 'Available 9 AM - 6 PM EST',
      action: '#',
      color: 'text-purple-500'
    },
    {
      icon: <MapPin size={32} />,
      title: 'Visit Us',
      description: 'Come to our headquarters',
      contact: '123 Sports Ave, Tech City, TC 12345',
      action: '#',
      color: 'text-orange-500'
    }
  ];

  const supportCategories = [
    { icon: <HelpCircle size={20} />, label: 'General Questions', value: 'general' },
    { icon: <Headset size={20} />, label: 'Technical Support', value: 'technical' },
    { icon: <Bug size={20} />, label: 'Bug Report', value: 'bug' },
    { icon: <Lightbulb size={20} />, label: 'Feature Request', value: 'feature' },
    { icon: <UserCheck size={20} />, label: 'Sales Inquiry', value: 'sales' },
    { icon: <Handshake size={20} />, label: 'Partnership', value: 'partnership' }
  ];

  const officeLocations = [
    {
      city: 'New York',
      address: '123 Sports Ave, New York, NY 10001',
      phone: '+1 (555) 123-4567',
      hours: 'Mon-Fri: 9 AM - 6 PM EST'
    },
    {
      city: 'Los Angeles',
      address: '456 Athletic Blvd, Los Angeles, CA 90210',
      phone: '+1 (555) 987-6543',
      hours: 'Mon-Fri: 9 AM - 6 PM PST'
    },
    {
      city: 'London',
      address: '789 Sport Lane, London, UK SW1A 1AA',
      phone: '+44 20 7946 0958',
      hours: 'Mon-Fri: 9 AM - 5 PM GMT'
    }
  ];

  const faqItems = [
    {
      question: 'How do I create a tournament?',
      answer: 'Navigate to the Tournaments section and click "Create Tournament". Follow the step-by-step wizard to set up your tournament structure, rules, and participants.'
    },
    {
      question: 'Can I track multiple sports?',
      answer: 'Yes! SportSphere supports 25+ sports including cricket, football, basketball, tennis, and more. You can manage multiple sports within a single account.'
    },
    {
      question: 'Is there a mobile app?',
      answer: 'Our platform is fully responsive and works perfectly on mobile browsers. A dedicated mobile app is coming soon!'
    },
    {
      question: 'How does the fitness tracking work?',
      answer: 'Our fitness module includes workout builders, progress tracking, nutrition monitoring, and detailed analytics to help you achieve your fitness goals.'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError(null);

    // Basic client-side validation
    if (!formData.name || formData.name.trim().length < 2) {
      setSubmitError('Name must be at least 2 characters long');
      setIsLoading(false);
      showToast('Name must be at least 2 characters long', 'error');
      return;
    }

    if (!formData.email || !formData.email.includes('@')) {
      setSubmitError('Please provide a valid email address');
      setIsLoading(false);
      showToast('Please provide a valid email address', 'error');
      return;
    }

    if (!formData.subject || formData.subject.trim().length < 5) {
      setSubmitError('Subject must be at least 5 characters long');
      setIsLoading(false);
      showToast('Subject must be at least 5 characters long', 'error');
      return;
    }

    if (!formData.message || formData.message.trim().length < 10) {
      setSubmitError('Message must be at least 10 characters long');
      setIsLoading(false);
      showToast('Message must be at least 10 characters long', 'error');
      return;
    }

    try {
      const response = await contactService.sendContactForm(formData);
      
      if (response && response.success) {
        setIsSubmitted(true);
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: 'general',
          message: '',
          priority: 'medium'
        });
        showToast('Message sent successfully! We will get back to you soon.', 'success');
      } else {
        throw new Error(response?.message || 'Failed to send message');
      }
    } catch (error) {
      // Handle validation errors specifically
      if (error.errors && Array.isArray(error.errors)) {
        const validationErrors = error.errors.map(err => err.msg).join(', ');
        setSubmitError(validationErrors);
        showToast(`Validation error: ${validationErrors}`, 'error');
      } else {
        const errorMessage = error.message || 'Failed to send message. Please try again.';
        setSubmitError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10">
      
      {/* Hero Section */}
      <section className="mb-4 md:mb-6 md:mb-12">
        <div className="max-w-5xl mx-auto text-center p-4 md:p-6 md:p-12 rounded-[40px] glass-panel bg-white/40 overflow-hidden relative">
          <div className="absolute top-[-50%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <h1 className="text-xl md:text-3xl md:text-5xl md:text-6xl font-extrabold text-slate-800 mb-4 md:mb-6 tracking-tight relative z-10">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Touch</span>
          </h1>
          <p className="text-xl text-slate-600 mb-4 md:mb-8 max-w-3xl mx-auto font-medium relative z-10">
            We're here to help! Reach out to us for support, partnerships, or just to say hello.
            Our team is ready to assist you with any questions about SportSphere.
          </p>
          <div className="flex justify-center space-x-4 relative z-10">
            <button className="w-12 h-12 bg-white/60 hover:bg-white rounded-full flex items-center justify-center text-slate-600 hover:text-blue-500 transition-all shadow-sm" aria-label="Follow us on Twitter">
              <FaTwitter size={20} />
            </button>
            <button className="w-12 h-12 bg-white/60 hover:bg-white rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all shadow-sm" aria-label="Follow us on Facebook">
              <FaFacebook size={20} />
            </button>
            <button className="w-12 h-12 bg-white/60 hover:bg-white rounded-full flex items-center justify-center text-slate-600 hover:text-blue-700 transition-all shadow-sm" aria-label="Connect with us on LinkedIn">
              <FaLinkedin size={20} />
            </button>
            <button className="w-12 h-12 bg-white/60 hover:bg-white rounded-full flex items-center justify-center text-slate-600 hover:text-pink-500 transition-all shadow-sm" aria-label="Follow us on Instagram">
              <FaInstagram size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="mb-4 md:mb-8 md:mb-16 max-w-6xl mx-auto">
        <div className="text-center mb-4 md:mb-6 md:mb-10">
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 mb-4">How Can We Help?</h2>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Choose your preferred way to get in touch with our team
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {contactMethods.map((method, index) => (
            <a 
              key={index}
              href={method.action}
              className="p-4 md:p-8 rounded-[32px] glass-panel hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center"
            >
              <div className={`w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center ${method.color} mb-4 md:mb-6 shadow-sm border border-slate-100`}>
                {method.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{method.title}</h3>
              <p className="text-slate-500 font-medium text-sm mb-4">{method.description}</p>
              <p className="text-sm font-bold text-slate-700">{method.contact}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="mb-4 md:mb-8 md:mb-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 items-start">
          
          {/* Contact Form */}
          <div className="p-4 md:p-8 md:p-10 rounded-[40px] glass-panel bg-white/40 border border-white/60 shadow-[0_8px_30px_rgb(0,0,255,0.04)]">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-4 md:mb-8">Send us a Message</h2>
            
            {isSubmitted ? (
              <div className="text-center py-4 md:py-6 md:py-12">
                <div className="w-12 md:w-20 h-12 md:h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800 mb-3">Message Sent!</h3>
                <p className="text-slate-500 font-medium mb-4">Thank you for contacting us. We'll get back to you within 24 hours.</p>
                <p className="text-sm text-slate-400 mb-4 md:mb-8 font-medium">
                  You should receive a confirmation email shortly.
                </p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="px-4 md:px-8 py-3 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {submitError && (
                  <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-4">
                    <p className="text-red-600 font-medium text-sm">{submitError}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      minLength={2}
                      maxLength={100}
                      className="w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    minLength={5}
                    maxLength={200}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
                    placeholder="Brief description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="appearance-none w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all cursor-pointer"
                    >
                      {supportCategories.map(category => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="appearance-none w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={5}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all resize-none"
                    placeholder="Please provide as much detail as possible..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-500 text-white font-bold rounded-2xl shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Support Categories & FAQ */}
          <div className="space-y-6">
            <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40">
              <h3 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6">Support Categories</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {supportCategories.map((category, index) => (
                  <div key={index} className="flex items-center p-4 bg-white/60 rounded-2xl hover:bg-blue-50 hover:shadow-sm border border-transparent hover:border-blue-100 transition-all cursor-pointer group">
                    <div className="text-slate-400 group-hover:text-blue-500 mr-4 transition-colors">
                      {category.icon}
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{category.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40">
              <h3 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6">Quick Answers</h3>
              <div className="space-y-4">
                {faqItems.map((faq, index) => (
                  <details key={index} className="bg-white/60 rounded-2xl group border border-white">
                    <summary className="p-4 cursor-pointer font-bold text-slate-700 list-none flex justify-between items-center outline-none">
                      {faq.question}
                      <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="p-4 pt-0 text-slate-500 font-medium text-sm leading-relaxed border-t border-slate-100 mt-2">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="mb-4 md:mb-8 md:mb-16 max-w-6xl mx-auto">
        <div className="text-center mb-4 md:mb-6 md:mb-10">
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 mb-4">Our Offices</h2>
          <p className="text-lg text-slate-500 font-medium">
            Visit us at any of our global locations
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
          {officeLocations.map((office, index) => (
            <div key={index} className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6">{office.city}</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="text-blue-500 shrink-0 mt-0.5 mr-4" size={18} />
                  <span className="text-sm font-medium text-slate-600 leading-relaxed">{office.address}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="text-green-500 shrink-0 mr-4" size={18} />
                  <span className="text-sm font-medium text-slate-600">{office.phone}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="text-orange-500 shrink-0 mr-4" size={18} />
                  <span className="text-sm font-medium text-slate-600">{office.hours}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Response Time Guarantee */}
      <section className="max-w-4xl mx-auto">
        <div className="p-5 md:p-10 rounded-[40px] bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none"></div>
          <div className="relative z-10 text-center mb-4 md:mb-6 md:mb-10">
            <h2 className="text-xl md:text-3xl font-extrabold mb-4">Our Response Commitment</h2>
            <p className="text-blue-100 font-medium text-lg">
              We're committed to providing exceptional support to our users
            </p>
          </div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 text-center">
            <div className="p-4 bg-white/10 rounded-2xl md:rounded-3xl border border-white/20">
              <div className="text-2xl md:text-4xl font-extrabold mb-2">&lt; 1 Hour</div>
              <div className="text-blue-100 font-bold uppercase tracking-wider text-sm">Urgent Issues</div>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl md:rounded-3xl border border-white/20">
              <div className="text-2xl md:text-4xl font-extrabold mb-2">&lt; 24h</div>
              <div className="text-blue-100 font-bold uppercase tracking-wider text-sm">General Support</div>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl md:rounded-3xl border border-white/20">
              <div className="text-2xl md:text-4xl font-extrabold mb-2">99.9%</div>
              <div className="text-blue-100 font-bold uppercase tracking-wider text-sm">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>
      
      <div className="h-12 md:h-20" />
    </div>
  );
};

export default ContactPage;
