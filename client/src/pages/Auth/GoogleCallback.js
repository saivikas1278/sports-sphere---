import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { googleLogin } from '../../redux/slices/authSlice';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          setError('Google authentication failed');
          return;
        }

        if (!code) {
          setError('No authorization code received');
          return;
        }

        // Handle the Google OAuth callback
        const result = await dispatch(googleLogin());
        
        if (googleLogin.fulfilled.match(result)) {
          navigate('/dashboard', { replace: true });
        } else {
          setError('Failed to authenticate with Google');
        }
      } catch (err) {
        setError('An error occurred during authentication');
      }
    };

    handleGoogleCallback();
  }, [searchParams, dispatch, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-4 md:p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Authentication Failed</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <div className="mt-4 md:mt-6">
              <button
                onClick={() => navigate('/login')}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-4 md:p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <LoadingSpinner size="md" color="blue" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Authenticating...</h3>
          <p className="mt-2 text-sm text-gray-500">Please wait while we complete your Google sign-in.</p>
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;
