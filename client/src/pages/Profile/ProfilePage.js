import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProfilePage (Unified with Dashboard)
 * Redirects seamlessly to the unified Athlete & Organizer Command Center Profile tab.
 */
const ProfilePage = () => {
  return <Navigate to="/dashboard?tab=profile" replace />;
};

export default ProfilePage;
