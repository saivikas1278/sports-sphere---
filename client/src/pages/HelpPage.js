import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  Search, 
  Trophy, 
  Users, 
  Dumbbell, 
  Video,
  Mail,
  Phone,
  ChevronRight,
  ChevronDown,
  X,
  BookOpen
} from 'lucide-react';

const helpCategories = [
    {
      icon: Trophy,
      title: 'Tournaments',
      description: 'Learn how to create, join, and manage tournaments',
      articles: [
        {
          title: 'How to create a tournament',
          content: 'To create a tournament, go to the Tournaments page and click "Create Tournament". Fill in the tournament details including name, sport, format, dates, and registration requirements. You can set team size limits, entry fees, and prize information. Once created, teams can register for your tournament.',
          tags: ['create', 'tournament', 'setup']
        },
        {
          title: 'Joining a tournament',
          content: 'Browse available tournaments on the Tournaments page. Click on a tournament to view details including format, rules, and requirements. If you meet the criteria, click "Register" to join. You may need to form a team first if it\'s a team tournament.',
          tags: ['join', 'register', 'tournament']
        },
        {
          title: 'Tournament formats and rules',
          content: 'SportSphere supports various tournament formats including single elimination, double elimination, round robin, and Swiss system. Each format has specific rules for advancement and scoring. Tournament organizers can customize rules for their specific sport and competition level.',
          tags: ['formats', 'rules', 'elimination', 'round robin']
        },
        {
          title: 'Managing tournament brackets',
          content: 'Tournament organizers can manage brackets through the tournament dashboard. Update match results, handle disputes, and manage participant communications. The system automatically updates standings and advances teams based on the selected format.',
          tags: ['brackets', 'manage', 'results', 'standings']
        }
      ]
    },
    {
      icon: Users,
      title: 'Teams',
      description: 'Everything about team creation and management',
      articles: [
        {
          title: 'Creating your team',
          content: 'Create a team by going to the Teams page and clicking "Create Team". Choose a team name, sport, and description. Upload a team logo if desired. Set team visibility (public/private) and member requirements. Once created, you can invite players to join.',
          tags: ['create', 'team', 'setup', 'members']
        },
        {
          title: 'Inviting team members',
          content: 'Team captains can invite members through the team management page. Send invitations by email or username. Set member roles and permissions. Track invitation status and manage pending requests. Members can also request to join public teams.',
          tags: ['invite', 'members', 'join', 'permissions']
        },
        {
          title: 'Team roles and permissions',
          content: 'Teams have different roles: Captain (full control), Co-Captain (most permissions), and Member (basic access). Captains can assign roles, manage roster, and register for tournaments. Co-Captains can help with day-to-day management. Members can view team info and participate in activities.',
          tags: ['roles', 'permissions', 'captain', 'member']
        },
        {
          title: 'Team statistics',
          content: 'View comprehensive team statistics including win/loss records, recent matches, player performance, and tournament history. Track progress over time with charts and analytics. Compare your team\'s performance against other teams in your league or sport.',
          tags: ['statistics', 'performance', 'analytics', 'records']
        }
      ]
    },
    {
      icon: Dumbbell,
      title: 'Fitness',
      description: 'Fitness tracking and workout management',
      articles: [
        {
          title: 'Setting up fitness goals',
          content: 'Set personalized fitness goals in the Fitness section. Choose from weight loss, muscle gain, endurance, or custom goals. Set target dates and milestones. The system will suggest workout plans and track your progress toward achieving these goals.',
          tags: ['goals', 'fitness', 'setup', 'targets']
        },
        {
          title: 'Tracking workouts',
          content: 'Log your workouts using the workout tracker. Choose from pre-built exercises or create custom ones. Track sets, reps, weight, and duration. Add notes and photos. The system automatically calculates calories burned and progress metrics.',
          tags: ['workouts', 'tracking', 'exercises', 'logging']
        },
        {
          title: 'Nutrition logging',
          content: 'Track your nutrition intake with the food diary. Search from a database of foods or scan barcodes. Log meals, snacks, and hydration. View nutritional breakdowns including calories, macros, and micronutrients. Set nutrition goals aligned with your fitness objectives.',
          tags: ['nutrition', 'food', 'calories', 'diet']
        },
        {
          title: 'Progress monitoring',
          content: 'Monitor your fitness progress with detailed analytics. View charts showing strength gains, weight changes, and performance improvements. Take progress photos and body measurements. Generate reports to share with trainers or teammates.',
          tags: ['progress', 'analytics', 'monitoring', 'reports']
        }
      ]
    },
    {
      icon: Video,
      title: 'Posts & Media',
      description: 'Sharing content and managing posts',
      articles: [
        {
          title: 'Creating posts',
          content: 'Share your sports journey by creating posts. Add text, photos, and videos. Tag teammates and teams. Use hashtags to increase visibility. Choose audience (public, team members, or private). Schedule posts for optimal engagement times.',
          tags: ['posts', 'sharing', 'content', 'social']
        },
        {
          title: 'Uploading videos and photos',
          content: 'Upload high-quality photos and videos to showcase your activities. Supported formats include JPG, PNG for photos and MP4, MOV for videos. Add captions, tags, and location information. Create albums to organize your content.',
          tags: ['upload', 'photos', 'videos', 'media']
        },
        {
          title: 'Privacy settings',
          content: 'Control who can see your content with privacy settings. Set default visibility for posts (public, friends, team only). Manage who can comment and share your content. Block unwanted users and report inappropriate content.',
          tags: ['privacy', 'security', 'visibility', 'settings']
        },
        {
          title: 'Content guidelines',
          content: 'Follow community guidelines when posting content. Keep posts sports-related and family-friendly. Respect others and avoid offensive language. Don\'t share copyrighted material without permission. Report violations to maintain a positive community.',
          tags: ['guidelines', 'community', 'rules', 'moderation']
        }
      ]
    }
  ];

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Go to the login page and click "Forgot Password". Enter your email address and follow the instructions sent to your email. Make sure to check your spam folder if you don\'t receive the email within a few minutes.',
      tags: ['password', 'reset', 'login', 'email']
    },
    {
      question: 'Can I participate in multiple tournaments?',
      answer: 'Yes! You can join multiple tournaments as long as the schedules don\'t conflict. Check the tournament dates before registering. Some tournaments may have restrictions based on skill level or team requirements.',
      tags: ['tournaments', 'multiple', 'participate', 'schedule']
    },
    {
      question: 'How do I upgrade my account?',
      answer: 'Currently, all features are free to use. We may introduce premium features in the future with advanced analytics, priority support, and additional storage for media content.',
      tags: ['upgrade', 'premium', 'features', 'pricing']
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we take data security seriously. All data is encrypted in transit and at rest. We follow industry best practices for data protection. Check our Privacy Policy for detailed information about how we handle your data.',
      tags: ['security', 'data', 'privacy', 'encryption']
    },
    {
      question: 'How do I delete my account?',
      answer: 'To delete your account, go to Settings > Account > Delete Account. This action is permanent and will remove all your data including posts, team memberships, and tournament history. Consider downloading your data first.',
      tags: ['delete', 'account', 'remove', 'permanent']
    },
    {
      question: 'Can I change my username?',
      answer: 'Yes, you can change your username once every 30 days. Go to Settings > Profile > Edit Username. Choose a unique username that follows our naming guidelines. Your old username may become available for others to use.',
      tags: ['username', 'change', 'profile', 'settings']
    },
    {
      question: 'How do I report inappropriate content?',
      answer: 'Click the three dots menu on any post and select "Report". Choose the reason for reporting and provide additional details if needed. Our moderation team reviews all reports within 24 hours.',
      tags: ['report', 'inappropriate', 'content', 'moderation']
    },
    {
      question: 'Why can\'t I join a tournament?',
      answer: 'There could be several reasons: the tournament may be full, registration may be closed, you might not meet the requirements (skill level, age, team size), or there could be a scheduling conflict with another tournament you\'re already in.',
      tags: ['tournament', 'join', 'registration', 'requirements']
    }
  ];

const HelpPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [expandedFAQs, setExpandedFAQs] = useState({});

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return null;

    const results = [];
    const searchLower = searchTerm.toLowerCase();

    // Search through articles
    helpCategories.forEach(category => {
      category.articles.forEach(article => {
        const matchesTitle = article.title.toLowerCase().includes(searchLower);
        const matchesContent = article.content.toLowerCase().includes(searchLower);
        const matchesTags = article.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (matchesTitle || matchesContent || matchesTags) {
          results.push({
            type: 'article',
            category: category.title,
            categoryIcon: category.icon,
            ...article
          });
        }
      });
    });

    // Search through FAQs
    faqs.forEach(faq => {
      const matchesQuestion = faq.question.toLowerCase().includes(searchLower);
      const matchesAnswer = faq.answer.toLowerCase().includes(searchLower);
      const matchesTags = faq.tags.some(tag => tag.toLowerCase().includes(searchLower));
      
      if (matchesQuestion || matchesAnswer || matchesTags) {
        results.push({
          type: 'faq',
          ...faq
        });
      }
    });

    return results;
  }, [searchTerm]);

  const toggleFAQ = (index) => {
    setExpandedFAQs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const openArticle = (category, article) => {
    setSelectedCategory(category);
    setSelectedArticle(article);
  };

  const closeArticle = () => {
    setSelectedCategory(null);
    setSelectedArticle(null);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // If viewing an article, show article view
  if (selectedArticle) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-4xl">
        {/* Article Header */}
        <div className="p-4 md:p-8 rounded-[40px] glass-panel bg-white/40 mb-4 md:mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-6">
          <div className="flex items-center">
            <button
              onClick={closeArticle}
              className="mr-4 p-2 text-slate-400 hover:text-blue-500 rounded-full hover:bg-white/60 transition-all"
            >
              <ChevronRight className="transform rotate-180" size={24} />
            </button>
            <div className="flex items-center">
              <selectedCategory.icon className="text-xl md:text-3xl text-blue-500 mr-4 shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-1">{selectedCategory.title}</p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{selectedArticle.title}</h1>
              </div>
            </div>
          </div>
          <BookOpen className="text-slate-200 hidden md:block shrink-0" size={48} />
        </div>

        {/* Article Content */}
        <div className="p-4 md:p-8 md:p-12 rounded-[40px] glass-panel bg-white/60">
          <div className="prose max-w-none mb-4 md:mb-8">
            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              {selectedArticle.content}
            </p>
          </div>
          
          {/* Tags */}
          <div className="pt-4 md:pt-8 border-t border-white/60">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Related Tags</p>
            <div className="flex flex-wrap gap-2">
              {selectedArticle.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-4 py-1.5 bg-blue-50/80 text-blue-600 text-sm font-bold rounded-full border border-blue-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-4 md:mt-8 pt-4 md:pt-8 border-t border-white/60">
            <button
              onClick={closeArticle}
              className="inline-flex items-center px-4 md:px-6 py-3 bg-white text-slate-700 font-bold rounded-full border border-white/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <ChevronRight className="mr-2 transform rotate-180" size={18} />
              Back to Help Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-6xl">
      {/* Header */}
      <section className="mb-4 md:mb-6 md:mb-12">
        <div className="p-4 md:p-6 md:p-12 rounded-[40px] bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-[0_8px_30px_rgb(59,130,246,0.3)] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none"></div>
          
          <HelpCircle className="mx-auto mb-4 md:mb-6 text-white/80 relative z-10" size={64} />
          <h1 className="text-2xl md:text-4xl md:text-5xl font-extrabold mb-4 relative z-10 tracking-tight">
            How can we help you?
          </h1>
          <p className="text-xl text-blue-100 font-medium mb-4 md:mb-6 md:mb-10 max-w-2xl mx-auto relative z-10">
            Find answers to your questions and get the most out of SportSphere
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative z-10">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400" size={24} />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-14 py-4 rounded-full text-slate-800 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchResults && (
        <section className="mb-4 md:mb-8 md:mb-16">
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Search Results <span className="text-slate-400 ml-2">({searchResults.length})</span>
            </h2>
            <button
              onClick={clearSearch}
              className="text-blue-500 hover:text-blue-700 font-bold transition-colors"
            >
              Clear Search
            </button>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="text-center py-4 md:py-8 md:py-16 p-4 md:p-8 rounded-[40px] glass-panel bg-white/40 border border-dashed border-slate-300">
              <Search className="mx-auto text-slate-300 mb-4 md:mb-6" size={48} />
              <h3 className="text-xl font-bold text-slate-700 mb-2">No results found</h3>
              <p className="text-slate-500 font-medium">Try different keywords or browse categories below</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:gap-6">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-4 md:p-6 md:p-8 rounded-[32px] glass-panel bg-white/60 hover:shadow-lg transition-all"
                >
                  {result.type === 'article' ? (
                    <div>
                      <div className="flex items-center mb-3">
                        <result.categoryIcon className="text-blue-500 mr-2 shrink-0" size={20} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{result.category}</span>
                      </div>
                      <button
                        onClick={() => openArticle(
                          helpCategories.find(cat => cat.title === result.category),
                          result
                        )}
                        className="text-left w-full group"
                      >
                        <h3 className="text-xl font-extrabold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
                          {result.title}
                        </h3>
                        <p className="text-slate-600 font-medium text-sm line-clamp-2 leading-relaxed">
                          {result.content.substring(0, 200)}...
                        </p>
                      </button>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {result.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-3 py-1 bg-white/80 border border-slate-100 text-slate-600 text-xs font-bold rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center mb-3">
                        <HelpCircle className="text-green-500 mr-2 shrink-0" size={20} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">FAQ</span>
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-800 mb-3">
                        {result.question}
                      </h3>
                      <p className="text-slate-600 font-medium text-sm leading-relaxed">
                        {result.answer.substring(0, 150)}...
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {result.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-3 py-1 bg-white/80 border border-slate-100 text-slate-600 text-xs font-bold rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Help Categories */}
      {!searchResults && (
        <section className="mb-4 md:mb-8 md:mb-16">
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 mb-4 md:mb-8 text-center tracking-tight">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {helpCategories.map((category, index) => (
              <div
                key={index}
                className="p-4 md:p-8 rounded-[40px] glass-panel bg-white/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="flex items-center gap-4 mb-4 md:mb-6">
                  <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                    <category.icon className="text-blue-500" size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-800 mb-1">{category.title}</h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">{category.description}</p>
                  </div>
                </div>
                <ul className="space-y-3 mt-auto">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <button
                        onClick={() => openArticle(category, article)}
                        className="w-full flex items-center justify-between p-4 bg-white/60 rounded-2xl hover:bg-blue-50 text-slate-700 font-bold text-sm transition-all group"
                      >
                        <span className="text-left group-hover:text-blue-600 transition-colors">{article.title}</span>
                        <ChevronRight className="text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors" size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {!searchResults && (
        <section className="mb-4 md:mb-8 md:mb-16 max-w-4xl mx-auto">
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 mb-4 md:mb-8 text-center tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-[24px] glass-panel bg-white/60 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-4 md:p-6 text-left flex items-center justify-between hover:bg-white/80 transition-colors"
                >
                  <h3 className="text-lg font-bold text-slate-800 pr-6 leading-snug">
                    {faq.question}
                  </h3>
                  <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 transition-transform duration-300 ${expandedFAQs[index] ? 'rotate-180 bg-blue-100 text-blue-500' : 'text-slate-400'}`}>
                    <ChevronDown size={20} />
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedFAQs[index] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 md:p-6 pt-0 border-t border-slate-100/50 mt-2">
                    <p className="text-slate-600 font-medium leading-relaxed">
                      {faq.answer}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4 md:mt-6">
                      {faq.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-3 py-1 bg-white border border-slate-100 text-slate-500 text-xs font-bold rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact Support */}
      <section className="max-w-4xl mx-auto">
        <div className="p-4 md:p-6 md:p-12 rounded-[40px] glass-panel bg-white/40 text-center flex flex-col items-center">
          <div className="w-12 md:w-20 h-12 md:h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4 md:mb-6">
            <Mail size={40} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-3 tracking-tight">
            Still need help?
          </h2>
          <p className="text-slate-500 font-medium mb-4 md:mb-8 max-w-md">
            Can't find what you're looking for? Our support team is here to help you get back in the game.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/contact"
              className="flex items-center justify-center px-4 md:px-8 py-4 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:-translate-y-0.5 transition-all"
            >
              <Mail className="mr-2 shrink-0" size={20} />
              Contact Support
            </Link>
            <a
              href="mailto:leelamadhav.nulakani@gmail.com"
              className="flex items-center justify-center px-4 md:px-8 py-4 bg-white text-slate-700 font-bold rounded-full border border-white/40 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all"
            >
              <Phone className="mr-2 shrink-0 text-blue-500" size={20} />
              Email Us Directly
            </a>
          </div>
        </div>
      </section>
      
      <div className="h-12 md:h-20" />
    </div>
  );
};

export default HelpPage;
