import React, { useState } from 'react';
import PropTypes from 'prop-types';

const VolleyballScorecard = ({ scorecard, match, onUpdate, canEdit }) => {
  const [scores, setScores] = useState({
    team1Sets: scorecard.team1Sets || 0,
    team2Sets: scorecard.team2Sets || 0,
    currentSetTeam1: scorecard.currentSetTeam1 || 0,
    currentSetTeam2: scorecard.currentSetTeam2 || 0
  });

  const handleScoreChange = (field, value) => {
    if (!canEdit) return;
    const newScores = { ...scores };
    newScores[field] = Math.max(0, value);
    setScores(newScores);
    onUpdate(newScores);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <h3 className="font-bold">{match.team1.name}</h3>
          <div className="mb-2">
            <label className="block text-sm">Sets</label>
            {canEdit ? (
              <input
                type="number"
                min="0"
                max="3"
                value={scores.team1Sets}
                onChange={(e) => handleScoreChange('team1Sets', parseInt(e.target.value))}
                className="w-12 md:w-20 text-center border rounded p-1"
              />
            ) : (
              <div className="text-2xl font-bold">{scores.team1Sets}</div>
            )}
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
        </div>
        <div className="text-center">
          <h3 className="font-bold">{match.team2.name}</h3>
          <div className="mb-2">
            <label className="block text-sm">Sets</label>
            {canEdit ? (
              <input
                type="number"
                min="0"
                max="3"
                value={scores.team2Sets}
                onChange={(e) => handleScoreChange('team2Sets', parseInt(e.target.value))}
                className="w-12 md:w-20 text-center border rounded p-1"
              />
            ) : (
              <div className="text-2xl font-bold">{scores.team2Sets}</div>
            )}
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
    </div>
  );
};

VolleyballScorecard.propTypes = {
  scorecard: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired
};

export default VolleyballScorecard;
