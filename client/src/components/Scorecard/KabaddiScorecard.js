import React, { useState } from 'react';
import PropTypes from 'prop-types';

const KabaddiScorecard = ({ scorecard, match, onUpdate, canEdit }) => {
  const [scores, setScores] = useState({
    team1Score: scorecard.team1Score || 0,
    team2Score: scorecard.team2Score || 0,
    team1RaidPoints: scorecard.team1RaidPoints || 0,
    team2RaidPoints: scorecard.team2RaidPoints || 0,
    team1TacklePoints: scorecard.team1TacklePoints || 0,
    team2TacklePoints: scorecard.team2TacklePoints || 0
  });

  const handleScoreChange = (field, value) => {
    if (!canEdit) return;
    const newScores = { ...scores };
    newScores[field] = Math.max(0, value);
    
    // Update total scores
    if (field.includes('team1')) {
      newScores.team1Score = newScores.team1RaidPoints + newScores.team1TacklePoints;
    } else if (field.includes('team2')) {
      newScores.team2Score = newScores.team2RaidPoints + newScores.team2TacklePoints;
    }
    
    setScores(newScores);
    onUpdate(newScores);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <h3 className="font-bold">{match.team1.name}</h3>
          <div className="mb-2">
            <label className="block text-sm">Total Score</label>
            <div className="text-2xl font-bold">{scores.team1Score}</div>
          </div>
          <div className="mb-2">
            <label className="block text-sm">Raid Points</label>
            {canEdit ? (
              <input
                type="number"
                min="0"
                value={scores.team1RaidPoints}
                onChange={(e) => handleScoreChange('team1RaidPoints', parseInt(e.target.value))}
                className="w-12 md:w-20 text-center border rounded p-1"
              />
            ) : (
              <div className="text-xl">{scores.team1RaidPoints}</div>
            )}
          </div>
          <div>
            <label className="block text-sm">Tackle Points</label>
            {canEdit ? (
              <input
                type="number"
                min="0"
                value={scores.team1TacklePoints}
                onChange={(e) => handleScoreChange('team1TacklePoints', parseInt(e.target.value))}
                className="w-12 md:w-20 text-center border rounded p-1"
              />
            ) : (
              <div className="text-xl">{scores.team1TacklePoints}</div>
            )}
          </div>
        </div>
        <div className="text-center self-center">
          <span className="text-xl font-bold">vs</span>
        </div>
        <div className="text-center">
          <h3 className="font-bold">{match.team2.name}</h3>
          <div className="mb-2">
            <label className="block text-sm">Total Score</label>
            <div className="text-2xl font-bold">{scores.team2Score}</div>
          </div>
          <div className="mb-2">
            <label className="block text-sm">Raid Points</label>
            {canEdit ? (
              <input
                type="number"
                min="0"
                value={scores.team2RaidPoints}
                onChange={(e) => handleScoreChange('team2RaidPoints', parseInt(e.target.value))}
                className="w-12 md:w-20 text-center border rounded p-1"
              />
            ) : (
              <div className="text-xl">{scores.team2RaidPoints}</div>
            )}
          </div>
          <div>
            <label className="block text-sm">Tackle Points</label>
            {canEdit ? (
              <input
                type="number"
                min="0"
                value={scores.team2TacklePoints}
                onChange={(e) => handleScoreChange('team2TacklePoints', parseInt(e.target.value))}
                className="w-12 md:w-20 text-center border rounded p-1"
              />
            ) : (
              <div className="text-xl">{scores.team2TacklePoints}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

KabaddiScorecard.propTypes = {
  scorecard: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired
};

export default KabaddiScorecard;
