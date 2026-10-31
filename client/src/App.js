import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Theme Provider
import { ThemeProvider } from './context/ThemeContext';

// Layout Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import LoadingSpinner from './components/UI/LoadingSpinner';
import { RouteLoadingFallback } from './components/UI/SkeletonLoader';
import FloatingBottomNavigation from './components/UI/FloatingBottomNavigation';
import ProtectedRoute from './components/Routing/ProtectedRoute';
import { loadUser } from './redux/slices/authSlice';
import { initializeSocket, disconnectSocket } from './services/socket';

// Pages (Lazy-loaded for optimal initial bundle performance)
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const LoginPage = React.lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/Auth/RegisterPage'));
const VerifyEmail = React.lazy(() => import('./pages/Auth/VerifyEmail'));
const GoogleCallback = React.lazy(() => import('./pages/Auth/GoogleCallback'));
const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'));
const TournamentHub = React.lazy(() => import('./pages/Tournament/TournamentHub'));
const TournamentDetails = React.lazy(() => import('./pages/Tournament/TournamentDetails'));
const TournamentCreatePage = React.lazy(() => import('./pages/Tournament/TournamentCreatePage'));
const LiveTournamentBoard = React.lazy(() => import('./pages/Tournament/LiveTournamentBoard'));
const ScoringPage = React.lazy(() => import('./pages/Tournament/ScoringPage'));
const TournamentDashboard = React.lazy(() => import('./pages/Tournament/TournamentDashboard'));
const ParticipantManagement = React.lazy(() => import('./pages/Tournament/ParticipantManagement'));
const CommunicationCenter = React.lazy(() => import('./pages/Tournament/CommunicationCenter'));
const TournamentBracket = React.lazy(() => import('./pages/Tournament/TournamentBracket'));
const ScoreEntry = React.lazy(() => import('./pages/Tournament/ScoreEntry'));
const FinancialReports = React.lazy(() => import('./pages/Tournament/FinancialReports'));
const PostsHub = React.lazy(() => import('./pages/Posts/PostsHub'));
const PostDetails = React.lazy(() => import('./pages/Posts/PostDetails'));
const FitnessHub = React.lazy(() => import('./pages/Fitness/FitnessHub'));
const FitnessDetails = React.lazy(() => import('./pages/Fitness/FitnessDetails'));
const WorkoutBuilder = React.lazy(() => import('./pages/Fitness/WorkoutBuilder'));
const WorkoutTimer = React.lazy(() => import('./pages/Fitness/WorkoutTimer'));
const ProgressTracker = React.lazy(() => import('./pages/Fitness/ProgressTracker'));
const NutritionTracker = React.lazy(() => import('./pages/Fitness/NutritionTracker'));
const NutritionGuide = React.lazy(() => import('./pages/Fitness/NutritionGuide'));
const BrowseWorkout = React.lazy(() => import('./pages/Fitness/BrowseWorkout'));
const WorkoutDetails = React.lazy(() => import('./pages/Fitness/WorkoutDetails'));
const ProfilePage = React.lazy(() => import('./pages/Profile/ProfilePage'));
const SettingsPage = React.lazy(() => import('./pages/Settings/SettingsPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const HelpPage = React.lazy(() => import('./pages/HelpPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const TeamsPage = React.lazy(() => import('./pages/Team/TeamsPage'));
const TeamCreatePage = React.lazy(() => import('./pages/Team/TeamCreatePage'));
const TeamDetails = React.lazy(() => import('./pages/Team/TeamDetails'));
const CricketHub = React.lazy(() => import('./pages/Cricket/CricketHub'));
const CricketCreateMatch = React.lazy(() => import('./pages/Cricket/CricketCreateMatch'));

// Match pages
const CreateMatch = React.lazy(() => import('./pages/Matches/CreateMatch'));
const TeamSelection = React.lazy(() => import('./pages/Matches/TeamSelection'));
const CricketScoring = React.lazy(() => import('./pages/Matches/Scoring/CricketScoring'));
const BadmintonScoring = React.lazy(() => import('./pages/Matches/Scoring/BadmintonScoring'));
const VolleyballScoring = React.lazy(() => import('./pages/Matches/Scoring/VolleyballScoring'));
const KabaddiScoring = React.lazy(() => import('./pages/Matches/Scoring/KabaddiScoring'));
const MatchesHub = React.lazy(() => import('./pages/Matches/MatchesHub'));
const MatchDetails = React.lazy(() => import('./pages/Matches/MatchDetails'));

// Dashboard Subpages
const MyRegistrations = React.lazy(() => import('./pages/Dashboard/MyRegistrations'));

// Team Subpages
const TeamChat = React.lazy(() => import('./pages/Team/TeamChat'));
const PlayerStats = React.lazy(() => import('./pages/Team/PlayerStats'));

// Messages
const ChatHub = React.lazy(() => import('./pages/Chat/ChatHub'));

// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/Admin/AdminDashboard'));
const UserManagement = React.lazy(() => import('./pages/Admin/UserManagement'));
const TournamentVerification = React.lazy(() => import('./pages/Admin/TournamentVerification'));
const ContentModeration = React.lazy(() => import('./pages/Admin/ContentModeration'));
const GlobalAnalytics = React.lazy(() => import('./pages/Admin/GlobalAnalytics'));
const PlatformSettings = React.lazy(() => import('./pages/Admin/PlatformSettings'));



// Custom redirect component for dynamic paths
const DynamicRedirect = ({ pattern, replacement }) => {
  const location = useLocation();
  const id = location.pathname.split('/').pop();
  const to = replacement.replace(':id', id);
  return <Navigate to={to} replace />;
};

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Load user on app start
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    // Initialize socket connection (authenticates with token if present, or connects as public spectator)
    initializeSocket();

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen transition-colors duration-300 bg-transparent">
        <Navbar />
        <main className="flex-1 pb-24">
          <React.Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            
            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/register" 
              element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} 
            />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/registrations" element={<ProtectedRoute><MyRegistrations /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/verification" element={<ProtectedRoute allowedRoles={['admin']}><TournamentVerification /></ProtectedRoute>} />
            <Route path="/admin/moderation" element={<ProtectedRoute allowedRoles={['admin']}><ContentModeration /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><GlobalAnalytics /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><PlatformSettings /></ProtectedRoute>} />
            
            {/* Tournament Routes */}
            <Route path="/tournaments" element={<TournamentHub />} />
            <Route path="/tournaments/create" element={<ProtectedRoute><TournamentCreatePage /></ProtectedRoute>} />
            <Route path="/tournaments/:id" element={<TournamentDetails />} />
            <Route path="/tournaments/:id/dashboard" element={<TournamentDashboard />} />
            <Route path="/tournaments/:id/participants" element={<ProtectedRoute><ParticipantManagement /></ProtectedRoute>} />
            <Route path="/tournaments/:id/communication" element={<ProtectedRoute><CommunicationCenter /></ProtectedRoute>} />
            <Route path="/tournaments/:id/brackets" element={<ProtectedRoute><TournamentBracket /></ProtectedRoute>} />
            <Route path="/tournaments/:id/scoring" element={<ProtectedRoute><ScoreEntry /></ProtectedRoute>} />
            <Route path="/tournaments/:id/financials" element={<ProtectedRoute><FinancialReports /></ProtectedRoute>} />
            <Route path="/tournaments/:id/live" element={<LiveTournamentBoard />} />
            <Route path="/tournaments/:id/matches/:matchId/score" element={<ScoringPage />} />
            
            {/* Team Routes */}
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/create" element={<ProtectedRoute><TeamCreatePage /></ProtectedRoute>} />
            <Route path="/teams/:id" element={<TeamDetails />} />
            <Route path="/teams/:id/chat" element={<ProtectedRoute><TeamChat /></ProtectedRoute>} />
            <Route path="/teams/:teamId/players/:playerId" element={<PlayerStats />} />
            
            {/* Messages */}
            <Route path="/chat" element={<ProtectedRoute><ChatHub /></ProtectedRoute>} />
            
            {/* Match Routes */}
            <Route path="/matches" element={<MatchesHub />} />
            <Route path="/matches/:matchId" element={<MatchDetails />} />
            <Route path="/matches/create" element={<CreateMatch />} />
            <Route path="/matches/create/:sportId/teams" element={<TeamSelection />} />
            <Route path="/matches/score/cricket/:matchId" element={<CricketScoring />} />
            <Route path="/matches/score/badminton/:matchId" element={<BadmintonScoring />} />
            <Route path="/matches/score/volleyball/:matchId" element={<VolleyballScoring />} />
            <Route path="/matches/score/kabaddi/:matchId" element={<KabaddiScoring />} />
            
            {/* Posts Routes */}
            <Route path="/posts" element={<PostsHub />} />
            <Route path="/posts/:id" element={<PostDetails />} />
            
            {/* Legacy Routes - Redirect to new Posts routes */}
            <Route path="/videos" element={<Navigate to="/posts?type=video" replace />} />
            <Route path="/videos/:id" element={<DynamicRedirect pattern="/videos/:id" replacement="/posts/:id" />} />
            <Route path="/photos" element={<Navigate to="/posts?type=photo" replace />} />
            <Route path="/photos/:id" element={<DynamicRedirect pattern="/photos/:id" replacement="/posts/:id" />} />
            
            {/* Fitness Routes */}
            <Route path="/fitness" element={<FitnessHub />} />
            <Route path="/fitness/browse-workouts" element={<BrowseWorkout />} />
            <Route path="/fitness/workout/:id" element={<WorkoutDetails />} />
            <Route path="/fitness/workout-builder" element={<WorkoutBuilder />} />
            <Route path="/fitness/timer" element={<WorkoutTimer />} />
            <Route path="/fitness/progress" element={<ProgressTracker />} />
            <Route path="/fitness/nutrition" element={<NutritionTracker />} />
            <Route path="/fitness/nutrition-guide" element={<NutritionGuide />} />
            <Route path="/fitness/:id" element={<FitnessDetails />} />
            
            {/* User Routes */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Cricket Routes */}
            <Route path="/cricket" element={<CricketHub />} />
            <Route path="/cricket/create" element={<CricketCreateMatch />} />
            <Route path="/cricket/create-match" element={<CricketCreateMatch />} />
            <Route path="/cricket/:matchId" element={<MatchDetails />} />
            <Route path="/cricket/:matchId/score" element={<CricketScoring />} />
            <Route path="/cricket/:id/edit" element={<CricketCreateMatch />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          </React.Suspense>
        </main>
        {location.pathname !== '/login' && <Footer />}
        <FloatingBottomNavigation />
        
        {/* Toast notifications */}
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
