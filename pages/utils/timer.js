'use client'

import { useState, useEffect } from 'react';
import Navbar from '../navbar';
import Footer from '../footer';

export default function Timer() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0); 
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullWindow, setIsFullWindow] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning && totalSeconds > 0) {
      interval = setInterval(() => {
        setTotalSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsTimeUp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, totalSeconds]);

  const enterFullWindow = () => {
    setIsFullWindow(true);
  };

  const exitFullWindow = () => {
    setIsFullWindow(false);
  };

  const startTimer = () => {
    const total = hours * 3600 + minutes * 60 + seconds;
    if (total > 0) {
      setTotalSeconds(total);
      setIsRunning(true);
      setHasStarted(true);
      enterFullWindow();
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resumeTimer = () => {
    setIsRunning(true);
  };

  const cancelTimer = () => {
    setIsRunning(false);
    setHasStarted(false);
    setTotalSeconds(0);
    setHours(0);
    setMinutes(0);
    setSeconds(0);
    setIsTimeUp(false);
    exitFullWindow();
  };

  const formatTime = (time) => {
    return time.toString().padStart(2, '0');
  };

  const displayTime = () => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${formatTime(h)}:${formatTime(m)}:${formatTime(s)}`;
  };

  return (
    <div className={`min-h-screen flex flex-col ${isFullWindow ? 'bg-black' : ''}`}>
      {!isFullWindow && <Navbar />}
      
      <main className={`flex-grow ${isFullWindow ? 'bg-black' : 'bg-gray-100'}`}>
        <div className="container mx-auto px-4 py-8">
          {!isFullWindow && <h1 className="text-3xl font-bold mb-8 text-gray-800">Timer</h1>}
          
          <div className={`${isFullWindow ? 'h-screen flex flex-col items-center justify-center' : 'bg-white rounded-lg shadow-md p-6 max-w-md mx-auto'}`}>
            <div className={`text-center ${isFullWindow ? 'text-9xl text-white' : 'text-4xl'} font-mono ${isFullWindow ? 'mb-16' : 'mb-8'}`}>
              {isTimeUp ? "Time's Up!" : hasStarted ? displayTime() : "00:00:00"}
            </div>
            
            {!hasStarted ? (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            ) : null}
            
            <div className={`flex justify-center gap-8 ${isFullWindow ? 'mt-8' : ''}`}>
              {!hasStarted ? (
                <button
                  onClick={startTimer}
                  className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                >
                  Start
                </button>
              ) : isTimeUp ? (
                <button
                  onClick={cancelTimer}
                  className={`${isFullWindow ? 'text-2xl px-8 py-4' : ''} bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600`}
                >
                  Close
                </button>
              ) : (
                <>
                  {isRunning ? (
                    <button
                      onClick={pauseTimer}
                      className={`${isFullWindow ? 'text-2xl px-8 py-4' : ''} bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600`}
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={resumeTimer}
                      className={`${isFullWindow ? 'text-2xl px-8 py-4' : ''} bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600`}
                    >
                      Resume
                    </button>
                  )}
                  <button
                    onClick={cancelTimer}
                    className={`${isFullWindow ? 'text-2xl px-8 py-4' : ''} bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600`}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {!isFullWindow && <Footer />}
    </div>
  );
}
