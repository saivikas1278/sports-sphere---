import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error

  useEffect(() => {
    const verifyUserEmail = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/verify-email/${token}`);
        if (res.data.success) {
          setStatus('success');
          toast.success('Email verified successfully!');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        toast.error(error.response?.data?.error || 'Verification failed. Link may be invalid or expired.');
      }
    };

    verifyUserEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-blue-50/50 -z-10 backdrop-blur-3xl" />
      
      <div className="max-w-md w-full space-y-8 bg-white/80 p-8 md:p-10 rounded-[2rem] shadow-xl border border-white/50 backdrop-blur-xl text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Verifying Email...</h2>
            <p className="mt-2 text-gray-600">Please wait while we verify your email address.</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
            <p className="mt-2 text-gray-600">Your account has been successfully verified. You will be redirected to the login page shortly.</p>
            <Link to="/login" className="mt-6 text-blue-500 hover:text-blue-700 font-bold">
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
            <p className="mt-2 text-gray-600">The verification link is invalid or has expired.</p>
            <Link to="/register" className="mt-6 text-blue-500 hover:text-blue-700 font-bold">
              Return to Registration
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
