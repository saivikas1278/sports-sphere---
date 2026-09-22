import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, Trophy, Flame, Clock, Scale, ChevronDown } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const ProgressTracker = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('7days'); // '7days', '30days', '90days', '1year'
  const [selectedMetric, setSelectedMetric] = useState('workouts');
  const [progressData, setProgressData] = useState({});
  const [bodyMeasurements, setBodyMeasurements] = useState([]);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const { default: fitnessService } = await import('../../services/fitnessService');
        const response = await fitnessService.getUserStats();
        const data = response.data?.data;
        
        if (data) {
          setProgressData({
            workouts: data.workouts,
            calories: data.calories,
            duration: data.duration,
            workoutTypes: data.workoutTypes
          });
          
          setBodyMeasurements(data.bodyMeasurements || []);
          setPersonalRecords(data.personalRecords || []);
        }
      } catch (error) {
        console.error('Failed to load progress data', error);
        
        // Mock data with smooth curves
        setProgressData({
          workouts: { 
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 
            datasets: [{
              label: 'Workouts',
              data: [1, 0, 1, 1, 0, 2, 1],
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4
            }] 
          },
          calories: { 
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 
            datasets: [{
              label: 'Calories',
              data: [350, 0, 420, 310, 0, 550, 280],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4
            }] 
          },
          duration: { 
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 
            datasets: [{
              label: 'Duration (mins)',
              data: [45, 0, 60, 40, 0, 90, 30],
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4
            }] 
          },
          workoutTypes: { 
            labels: ['Strength', 'Cardio', 'HIIT', 'Flexibility'], 
            datasets: [{
              data: [40, 30, 20, 10],
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
              borderWidth: 0,
              hoverOffset: 4
            }] 
          }
        });
        
        setBodyMeasurements([
          { id: 1, date: 'Today', weight: 74.8, bodyFat: 15.2, muscle: 35.1 },
          { id: 2, date: '1 Week Ago', weight: 75.1, bodyFat: 15.5, muscle: 35.0 },
          { id: 3, date: '1 Month Ago', weight: 76.5, bodyFat: 16.8, muscle: 34.5 }
        ]);
        
        setPersonalRecords([
          { id: 1, exercise: 'Bench Press', date: '2 days ago', weight: 85, improvement: '+5kg' },
          { id: 2, exercise: '5K Run', date: '1 week ago', time: '23:45', improvement: '-15s' },
          { id: 3, exercise: 'Deadlift', date: '2 weeks ago', weight: 120, improvement: '+10kg' }
        ]);
      }
    };

    fetchProgressData();
  }, [timeRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13, weight: 'bold' }
      }
    },
    scales: selectedMetric !== 'workoutTypes' ? {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.5)',
          drawBorder: false,
        },
        ticks: {
          font: { family: "'Inter', sans-serif", weight: 'bold' },
          color: '#94a3b8'
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: { family: "'Inter', sans-serif", weight: 'bold' },
          color: '#64748b'
        }
      }
    } : undefined,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 6,
        hoverBorderWidth: 3,
        backgroundColor: '#fff'
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { family: "'Inter', sans-serif", weight: 'bold', size: 12 },
          color: '#64748b'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12
      }
    },
    cutout: '75%',
  };

  const getCurrentData = () => {
    return progressData[selectedMetric] || { labels: [], datasets: [] };
  };

  const renderChart = () => {
    const data = getCurrentData();
    if (!data || !data.datasets || data.datasets.length === 0) return null;
    
    if (selectedMetric === 'workoutTypes') {
      return <Doughnut data={data} options={doughnutOptions} />;
    } else if (selectedMetric === 'workouts') {
      return <Line data={data} options={chartOptions} />;
    } else {
      return <Line data={data} options={chartOptions} />; // Defaulting to smooth lines
    }
  };

  const metricLabels = {
    workouts: 'Workouts',
    calories: 'Calories',
    duration: 'Duration',
    workoutTypes: 'Workout Types'
  };

  const timeRangeLabels = {
    '7days': '7 Days',
    '30days': '30 Days',
    '90days': '90 Days',
    '1year': '1 Year'
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-7xl animate-fade-in">
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
            <BarChart2 className="text-blue-500" size={32} />
            Progress Tracker
          </h1>
          <p className="text-slate-500 font-medium">Monitor your fitness journey</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
        
        <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 md:w-24 h-16 md:h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-1">Workouts</p>
              <h3 className="text-2xl md:text-4xl font-black text-blue-500 mb-2">127</h3>
              <p className="text-sm font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">+8 this week</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-500">
              <Trophy size={24} />
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 md:w-24 h-16 md:h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-1">Calories</p>
              <h3 className="text-2xl md:text-4xl font-black text-emerald-500 mb-2">45k</h3>
              <p className="text-sm font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">+1.8k this week</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-500">
              <Flame size={24} />
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 md:w-24 h-16 md:h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-1">Time</p>
              <h3 className="text-2xl md:text-4xl font-black text-purple-500 mb-2">89<span className="text-2xl">h</span></h3>
              <p className="text-sm font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">+5h this week</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-500">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 md:w-24 h-16 md:h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-1">Weight</p>
              <h3 className="text-2xl md:text-4xl font-black text-amber-500 mb-2">74.8<span className="text-2xl">kg</span></h3>
              <p className="text-sm font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">-0.7kg month</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-500">
              <Scale size={24} />
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/60 border border-white shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 gap-4">
              <h2 className="text-xl font-extrabold text-slate-800">Activity Overview</h2>
              
              <div className="flex space-x-3">
                {/* Custom Metric Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsChartDropdownOpen(!isChartDropdownOpen)}
                    className="px-4 py-2 bg-white/80 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm flex items-center hover:bg-white transition-colors shadow-sm"
                  >
                    {metricLabels[selectedMetric]}
                    <ChevronDown size={14} className="ml-2 text-slate-400" />
                  </button>
                  {isChartDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border border-white rounded-2xl shadow-xl z-20 overflow-hidden">
                      {Object.entries(metricLabels).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => { setSelectedMetric(key); setIsChartDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${selectedMetric === key ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Custom Time Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                    disabled={selectedMetric === 'workoutTypes'}
                    className={`px-4 py-2 bg-white/80 border border-slate-200 rounded-xl font-bold text-sm flex items-center transition-colors shadow-sm ${selectedMetric === 'workoutTypes' ? 'text-slate-400 bg-slate-50' : 'text-slate-600 hover:bg-white'}`}
                  >
                    {timeRangeLabels[timeRange]}
                    <ChevronDown size={14} className={`ml-2 ${selectedMetric === 'workoutTypes' ? 'text-slate-300' : 'text-slate-400'}`} />
                  </button>
                  {isTimeDropdownOpen && selectedMetric !== 'workoutTypes' && (
                    <div className="absolute top-full right-0 mt-2 w-32 bg-white/90 backdrop-blur-xl border border-white rounded-2xl shadow-xl z-20 overflow-hidden">
                      {Object.entries(timeRangeLabels).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => { setTimeRange(key); setIsTimeDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${timeRange === key ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="h-[350px] relative w-full">
              {renderChart()}
            </div>
          </div>

          {/* Personal Records */}
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Trophy className="text-amber-500" size={20} />
                Personal Records
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {personalRecords.map(record => (
                <div key={record.id} className="p-5 bg-white/60 rounded-2xl border border-white shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-3">
                    <Trophy className="text-amber-500" size={20} />
                  </div>
                  <h3 className="font-extrabold text-slate-800 mb-1">{record.exercise}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{record.date}</p>
                  
                  <div className="mt-auto">
                    <span className="text-2xl font-black text-blue-600 block leading-none mb-1">
                      {record.weight ? `${record.weight}kg` : record.time}
                    </span>
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded text-center inline-block">
                      {record.improvement}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Goal Progress */}
          <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h2 className="text-lg font-extrabold text-slate-800 mb-4 md:mb-6">Active Goals</h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-slate-700">Lose 5kg</span>
                  <span className="text-xl font-black text-blue-500">60%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner mb-1.5">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <p className="text-xs font-bold text-slate-400 text-right">3kg lost, 2kg to go</p>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-slate-700">Run 5K</span>
                  <span className="text-xl font-black text-emerald-500">75%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner mb-1.5">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <p className="text-xs font-bold text-slate-400 text-right">Current best: 24:30</p>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-slate-700">Bench 80kg</span>
                  <span className="text-xl font-black text-amber-500">100%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner mb-1.5">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <p className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded inline-block float-right">Goal achieved! 🎉</p>
                <div className="clear-both"></div>
              </div>
            </div>
          </div>

          {/* Body Measurements */}
          <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-lg font-extrabold text-slate-800">Body Stats</h2>
            </div>
            
            <div className="space-y-4">
              {bodyMeasurements.map((measurement, index) => (
                <div key={measurement.id} className={`p-4 rounded-2xl transition-colors ${index === 0 ? 'bg-white/80 border-2 border-blue-100 shadow-sm' : 'bg-white/40 border border-white'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-xs font-extrabold uppercase tracking-widest ${index === 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                      {measurement.date}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 divide-x divide-slate-100">
                    <div className="text-center px-1">
                      <p className="text-lg font-black text-slate-800">{measurement.weight}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">kg</p>
                    </div>
                    <div className="text-center px-1">
                      <p className="text-lg font-black text-slate-800">{measurement.bodyFat}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">% Fat</p>
                    </div>
                    <div className="text-center px-1">
                      <p className="text-lg font-black text-slate-800">{measurement.muscle}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">kg Musc</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-xl transition-colors">
              Log New Stats
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
