import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchMatches, selectLiveMatches, selectMatchLoading, selectMatchError } from '../../redux/slices/matchSlice';
import ScorecardPanel from '../Scorecard/ScorecardPanel';
import LoadingSpinner from '../UI/LoadingSpinner';

const MatchDashboard = () => {
  const dispatch = useDispatch();
  const { tournamentId } = useParams();
  const activeMatches = useSelector(selectLiveMatches);
  const loading = useSelector(selectMatchLoading);
  const error = useSelector(selectMatchError);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (tournamentId) {
      dispatch(fetchMatches({ status: 'live', tournament: tournamentId }));
    }
  }, [dispatch, tournamentId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <h1 className="text-xl md:text-3xl font-bold mb-4 md:mb-6">Live Matches</h1>
      
      {activeMatches.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-4 md:p-8 text-center">
          <p className="text-gray-600">No active matches at the moment.</p>
          {user?.role === 'organizer' && (
            <button className="mt-4 px-4 md:px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Schedule New Match
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          {activeMatches.map((match) => (
            <div key={match._id} className="col-span-1">
              <ScorecardPanel matchId={match._id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchDashboard;
