import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadUser } from '../../redux/slices/authSlice';
import { saveToken } from '../../utils/auth';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const errParam = searchParams.get('error');

        if (errParam) {
          if (errParam === 'oauth_not_configured') {
            setError('Google OAuth is not configured on the server. Please sign in with email and password.');
          } else if (errParam === 'oauth_failed') {
            setError('Google authentication was cancelled or failed.');
          } else {
            setError(`Authentication failed: ${errParam}`);
          }
          return;
        }

        if (!token) {
          setError('No authentication token received from Google callback.');
          return;
        }

        // Store token identical to normal login flow
        saveToken(token);

        // Fetch user profile and populate auth state
        const result = await dispatch(loadUser());

        if (loadUser.fulfilled.match(result) && result.payload?.user) {
          const user = result.payload.user;
          // Redirect by role
          if (user.role === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else {
          setError('Failed to load user profile after Google sign-in.');
        }
      } catch (err) {
        console.error('Google Callback Error:', err);
        setError('An unexpected error occurred during Google authentication.');
      }
    };

    handleGoogleCallback();
  }, [searchParams, dispatch, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-slate-200 p-6 md:p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-rose-50 text-rose-500 mb-4 border border-rose-100">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800">Authentication Failed</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-slate-200 p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-blue-50 text-blue-600 mb-4">
          <LoadingSpinner size="md" color="blue" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Completing Sign-In...</h3>
        <p className="mt-2 text-sm text-slate-500">
          Please wait while we verify your Google credentials and set up your session.
        </p>
      </div>
    </div>
  );
};

export default GoogleCallback;
