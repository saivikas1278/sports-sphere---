import React, { useState, useEffect } from 'react';
import tournamentService from '../../services/tournamentService';

const TournamentTest = () => {
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const testApiCall = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[TournamentTest] Making API call...');
      
      const response = await tournamentService.getTournaments();
      console.log('[TournamentTest] Raw API Response:', response);
      
      setApiResponse(response);
    } catch (err) {
      console.error('[TournamentTest] API Error:', err);
      setError(err.message || 'Failed to fetch tournaments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testApiCall();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Tournament API Test</h1>
      
      <button 
        onClick={testApiCall}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600"
        disabled={loading}
      >
        {loading ? 'Testing...' : 'Test API Call'}
      </button>

      {loading && <div>Loading...</div>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {apiResponse && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">API Response:</h2>
          <pre className="bg-white p-4 rounded text-sm overflow-auto">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
          
          <div className="mt-4">
            <h3 className="font-semibold">Response Analysis:</h3>
            <ul className="list-disc list-inside mt-2">
              <li>Response type: {typeof apiResponse}</li>
              <li>Has success property: {apiResponse.hasOwnProperty('success') ? 'Yes' : 'No'}</li>
              <li>Has data property: {apiResponse.hasOwnProperty('data') ? 'Yes' : 'No'}</li>
              <li>Data is array: {Array.isArray(apiResponse.data) ? 'Yes' : 'No'}</li>
              <li>Data length: {apiResponse.data ? apiResponse.data.length : 'N/A'}</li>
              <li>Success value: {apiResponse.success ? 'true' : 'false'}</li>
            </ul>
          </div>

          {apiResponse.data && Array.isArray(apiResponse.data) && (
            <div className="mt-4">
              <h3 className="font-semibold">Tournament Data:</h3>
              {apiResponse.data.map((tournament, index) => (
                <div key={index} className="bg-white p-2 rounded mt-2">
                  <div>Name: {tournament.name}</div>
                  <div>Sport: {tournament.sport}</div>
                  <div>Status: {tournament.status}</div>
                  <div>ID: {tournament._id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentTest;
