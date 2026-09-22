import React, { useState } from 'react';
import PropTypes from 'prop-types';

const FootballScorecard = ({ scorecard, match, onUpdate, canEdit }) => {
  const [scores, setScores] = useState({
    team1Score: scorecard.team1Score || 0,
    team2Score: scorecard.team2Score || 0
  });

  const handleScoreChange = (team, value) => {
    if (!canEdit) return;
    const newScores = { ...scores };
    newScores[team] = Math.max(0, value);
    setScores(newScores);
    onUpdate(newScores);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <h3 className="font-bold">{match.team1.name}</h3>
          {canEdit ? (
            <input
              type="number"
              min="0"
              value={scores.team1Score}
              onChange={(e) => handleScoreChange('team1Score', parseInt(e.target.value))}
              className="w-12 md:w-20 text-center border rounded p-1"
            />
          ) : (
            <div className="text-2xl font-bold">{scores.team1Score}</div>
          )}
        </div>
        <div className="text-center self-center">
          <span className="text-xl font-bold">vs</span>
        </div>
        <div className="text-center">
          <h3 className="font-bold">{match.team2.name}</h3>
          {canEdit ? (
            <input
              type="number"
              min="0"
              value={scores.team2Score}
              onChange={(e) => handleScoreChange('team2Score', parseInt(e.target.value))}
              className="w-12 md:w-20 text-center border rounded p-1"
            />
          ) : (
            <div className="text-2xl font-bold">{scores.team2Score}</div>
          )}
        </div>
      </div>
    </div>
  );
};

FootballScorecard.propTypes = {
  scorecard: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired
};

export default FootballScorecard;
