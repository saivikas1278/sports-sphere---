import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw,
  Timer,
  Zap,
  Flame,
  Dumbbell,
  Settings
} from 'lucide-react';

const WorkoutTimer = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work'); // 'work', 'rest'
  const [workTime, setWorkTime] = useState(300); // 5 minutes
  const [restTime, setRestTime] = useState(60); // 1 minute
  const [rounds, setRounds] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [timerType, setTimerType] = useState('simple'); // 'simple', 'interval', 'tabata'

  useEffect(() => {
    const handleTimerComplete = () => {
      if ('Notification' in window) {
        new Notification('Timer Complete!', {
          body: mode === 'work' ? 'Rest time!' : 'Work time!',
          icon: '/favicon.ico'
        });
      }

      if (timerType === 'interval') {
        if (mode === 'work') {
          setMode('rest');
          setTimeLeft(restTime);
        } else {
          if (currentRound < rounds) {
            setCurrentRound(currentRound + 1);
            setMode('work');
            setTimeLeft(workTime);
          } else {
            setIsRunning(false);
            alert('Workout Complete! Great job!');
          }
        }
      } else {
        setIsRunning(false);
        alert('Timer Complete!');
      }
    };

    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, restTime, workTime, timerType, currentRound, rounds]);

  const startTimer = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsRunning(true);
  };

  const pauseTimer = () => setIsRunning(false);

  const resetTimer = () => {
    setIsRunning(false);
    setCurrentRound(1);
    setMode('work');
    setTimeLeft(workTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const setPreset = (preset) => {
    setIsRunning(false);
    setCurrentRound(1);
    setMode('work');
    
    switch (preset) {
      case 'tabata':
        setTimerType('interval');
        setWorkTime(20);
        setRestTime(10);
        setRounds(8);
        setTimeLeft(20);
        break;
      case 'hiit':
        setTimerType('interval');
        setWorkTime(45);
        setRestTime(15);
        setRounds(12);
        setTimeLeft(45);
        break;
      case 'strength':
        setTimerType('interval');
        setWorkTime(120);
        setRestTime(60);
        setRounds(6);
        setTimeLeft(120);
        break;
      default:
        setTimerType('simple');
        setWorkTime(600);
        setTimeLeft(600);
    }
  };

  // Compute progress percentage
  const totalDuration = mode === 'work' ? workTime : restTime;
  const progressPercentage = ((totalDuration - timeLeft) / totalDuration) * 100;
  
  // Dynamic colors
  const activeColor = mode === 'work' ? 'text-blue-500' : 'text-emerald-500';
  const activeBg = mode === 'work' ? 'bg-blue-500' : 'bg-emerald-500';
  const activeRing = mode === 'work' ? 'ring-blue-200' : 'ring-emerald-200';

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-4xl animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center mb-4 md:mb-8">
        <button 
          onClick={() => navigate('/fitness')}
          className="w-10 h-10 rounded-full bg-white/60 border border-white flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-white transition-colors shadow-sm mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Timer className="text-blue-500" size={32} />
            Smart Timer
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
        
        {/* Main Timer */}
        <div className="lg:col-span-8">
          <div className={`p-4 md:p-8 md:p-12 rounded-[40px] glass-panel bg-white/60 border-2 transition-all duration-500 flex flex-col items-center justify-center text-center shadow-lg ${isRunning ? 'border-transparent ring-4 ' + activeRing : 'border-white'}`}>
            
            {/* Status & Round (for interval) */}
            <div className="h-12 mb-4">
              {timerType === 'interval' && (
                <div className="animate-fade-in">
                  <span className={`text-xl font-black uppercase tracking-widest ${activeColor}`}>
                    {mode === 'work' ? 'WORK' : 'REST'}
                  </span>
                  <div className="text-slate-500 font-bold mt-1">
                    Round {currentRound} of {rounds}
                  </div>
                </div>
              )}
            </div>

            {/* Giant Time Display */}
            <div className={`text-[6rem] md:text-[8rem] font-black tracking-tighter leading-none mb-4 md:mb-6 md:mb-10 transition-colors duration-500 ${activeColor}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(timeLeft)}
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner mb-4 md:mb-6 md:mb-12">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${activeBg}`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 md:gap-6">
              <button
                onClick={resetTimer}
                className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm"
              >
                <RotateCcw size={24} />
              </button>
              
              <button
                onClick={isRunning ? pauseTimer : startTimer}
                className={`w-16 md:w-24 h-16 md:h-24 rounded-full flex items-center justify-center text-white transition-all shadow-lg hover:scale-105 active:scale-95 ${
                  isRunning 
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' 
                    : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30'
                }`}
              >
                {isRunning ? (
                  <Pause size={40} className="fill-current" />
                ) : (
                  <Play size={40} className="fill-current ml-2" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Settings & Presets */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Presets */}
          <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4">Quick Presets</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPreset('tabata')}
                className="p-3 bg-white/60 rounded-2xl border border-white hover:border-blue-300 hover:shadow-md transition-all text-center group"
              >
                <Zap className="mx-auto mb-2 text-indigo-500 group-hover:scale-110 transition-transform" size={20} />
                <div className="font-bold text-slate-800 text-sm">Tabata</div>
                <div className="text-[10px] font-bold text-slate-400">20s/10s × 8</div>
              </button>
              <button
                onClick={() => setPreset('hiit')}
                className="p-3 bg-white/60 rounded-2xl border border-white hover:border-blue-300 hover:shadow-md transition-all text-center group"
              >
                <Flame className="mx-auto mb-2 text-orange-500 group-hover:scale-110 transition-transform" size={20} />
                <div className="font-bold text-slate-800 text-sm">HIIT</div>
                <div className="text-[10px] font-bold text-slate-400">45s/15s × 12</div>
              </button>
              <button
                onClick={() => setPreset('strength')}
                className="p-3 bg-white/60 rounded-2xl border border-white hover:border-blue-300 hover:shadow-md transition-all text-center group"
              >
                <Dumbbell className="mx-auto mb-2 text-slate-600 group-hover:scale-110 transition-transform" size={20} />
                <div className="font-bold text-slate-800 text-sm">Strength</div>
                <div className="text-[10px] font-bold text-slate-400">2m/1m × 6</div>
              </button>
              <button
                onClick={() => setPreset('custom')}
                className="p-3 bg-white/60 rounded-2xl border border-white hover:border-blue-300 hover:shadow-md transition-all text-center group"
              >
                <Timer className="mx-auto mb-2 text-blue-500 group-hover:scale-110 transition-transform" size={20} />
                <div className="font-bold text-slate-800 text-sm">Classic</div>
                <div className="text-[10px] font-bold text-slate-400">10 mins</div>
              </button>
            </div>
          </div>

          {/* Custom Settings */}
          <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
              <Settings className="mr-2" size={14} /> Custom Setup
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Type</label>
                <div className="flex bg-white/60 p-1 rounded-2xl border border-white">
                  <button
                    onClick={() => setTimerType('simple')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${timerType === 'simple' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Simple
                  </button>
                  <button
                    onClick={() => setTimerType('interval')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${timerType === 'interval' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Interval
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  {timerType === 'simple' ? 'Duration (sec)' : 'Work Time (sec)'}
                </label>
                <input
                  type="number"
                  value={workTime}
                  onChange={(e) => setWorkTime(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-4 py-3 bg-white/80 border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-slate-700"
                />
              </div>

              {timerType === 'interval' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Rest Time (sec)</label>
                    <input
                      type="number"
                      value={restTime}
                      onChange={(e) => setRestTime(parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-4 py-3 bg-white/80 border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Rounds</label>
                    <input
                      type="number"
                      value={rounds}
                      onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-4 py-3 bg-white/80 border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-slate-700"
                    />
                  </div>
                </>
              )}

              <button
                onClick={resetTimer}
                className="w-full py-3 mt-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-2xl transition-colors border border-blue-200"
              >
                Apply Settings
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WorkoutTimer;
