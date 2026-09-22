import React, { useState } from 'react';
import PropTypes from 'prop-types';

const BadmintonScorecard = ({ scorecard, match, onUpdate, canEdit }) => {
  const [scores, setScores] = useState({
    team1Sets: scorecard.team1Sets || 0,
    team2Sets: scorecard.team2Sets || 0,
    currentSetTeam1: scorecard.currentSetTeam1 || 0,
    currentSetTeam2: scorecard.currentSetTeam2 || 0,
    sets: scorecard.sets || []
  });

  const handleScoreChange = (field, value) => {
    if (!canEdit) return;
    const newScores = { ...scores };
    newScores[field] = Math.max(0, value);
    setScores(newScores);
    onUpdate(newScores);
  };

  const handleSetComplete = () => {
    if (!canEdit) return;
    const newScores = { ...scores };
    
    // Save current set
    newScores.sets.push({
      team1: scores.currentSetTeam1,
      team2: scores.currentSetTeam2
    });
    
    // Update sets won
    if (scores.currentSetTeam1 > scores.currentSetTeam2) {
      newScores.team1Sets += 1;
    } else {
      newScores.team2Sets += 1;
    }
    
    // Reset current set scores
    newScores.currentSetTeam1 = 0;
    newScores.currentSetTeam2 = 0;
    
    setScores(newScores);
    onUpdate(newScores);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <h3 className="font-bold">{match.team1.name}</h3>
          <div className="mb-2">
            <label className="block text-sm">Sets Won</label>
            <div className="text-2xl font-bold">{scores.team1Sets}</div>
          </div>
          <div>
            <label className="block text-sm">Current Set Points</label>
            {canEdit ? (
              <input
                type="number"
                min="0"
                value={scores.currentSetTeam1}
                onChange={(e) => handleScoreChange('currentSetTeam1', parseInt(e.target.value))}
                className="w-12 md:w-20 text-center border rounded p-1"
              />
            ) : (
              <div className="text-2xl font-bold">{scores.currentSetTeam1}</div>
            )}
          </div>
        </div>
        <div className="text-center self-center">
          <span className="text-xl font-bold">vs</span>
          {canEdit && (
            <button
              onClick={handleSetComplete}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Complete Set
            </button>
          )}
        </div>
        <div className="text-center">
          <h3 className="font-bold">{match.team2.name}</h3>
          <div className="mb-2">
            <label className="block text-sm">Sets Won</label>
            <div className="text-2xl font-bold">{scores.team2Sets}</div>
          </div>
          <div>
            <label className="block text-sm">Current Set Points</label>
            {canEdit ? (
              <input
                type="number"
                min="0"
                value={scores.currentSetTeam2}
                onChange={(e) => handleScoreChange('currentSetTeam2', parseInt(e.target.value))}
                className="w-12 md:w-20 text-center border rounded p-1"
              />
            ) : (
              <div className="text-2xl font-bold">{scores.currentSetTeam2}</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Previous Sets */}
      {scores.sets.length > 0 && (
        <div className="mt-4">
          <h4 className="font-bold mb-2">Previous Sets</h4>
          <div className="grid grid-cols-3 gap-2">
            {scores.sets.map((set, index) => (
              <div key={index} className="text-center bg-gray-50 p-2 rounded">
                <div className="text-sm">Set {index + 1}</div>
                <div className="font-bold">{set.team1} - {set.team2}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

BadmintonScorecard.propTypes = {
  scorecard: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired
};

export default BadmintonScorecard;
