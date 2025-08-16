'use client'

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Navbar from '../navbar';
import Footer from '../footer';

export default function Workday2Calendar() {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [icsContent, setIcsContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [parsingSteps, setParsingSteps] = useState([]);
  const [firstDayOfClass, setFirstDayOfClass] = useState('2025-08-25');
  const [lastDayOfClass, setLastDayOfClass] = useState('2025-12-07');
  const fileInputRef = useRef(null);
  const logContainerRef = useRef(null);

  // Scroll to bottom when new log is added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [parsingSteps]);

  const addParsingStep = (step) => {
    setParsingSteps(prev => [...prev, { id: Date.now() + Math.random(), step, timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
        setError('');
        setParsedData(null);
        setIcsContent('');
        setParsingSteps([]);
        addParsingStep(`File selected: ${selectedFile.name}`);
      } else {
        setError('Please select a valid .xlsx file');
        setFile(null);
      }
    }
  };

  const canParseFile = () => {
    return file && firstDayOfClass && lastDayOfClass;
  };

  const parseExcelFile = async () => {
    if (!canParseFile()) return;

    setIsProcessing(true);
    setParsingSteps([]);
    addParsingStep('Starting Excel file parsing...');

    try {
      // We'll use a simple text-based approach since we can't use external libraries
      // In a real implementation, you'd use a library like SheetJS or similar
      addParsingStep('Reading file content...');
      
      const text = await file.text();
      addParsingStep('File content read successfully');
      
      // Extract course information from the file
      const courses = await extractCourseData(text);
      addParsingStep(`Extracted ${courses.length} courses`);
      
      setParsedData(courses);
      addParsingStep('Data parsing completed successfully');
      
      // Generate ICS content
      addParsingStep('Generating ICS calendar format...');
      const ics = generateICS(courses);
      setIcsContent(ics);
      addParsingStep('ICS generation completed');
      
    } catch (err) {
      addParsingStep(`Error: ${err.message}`);
      setError('Failed to parse Excel file. Please ensure it\'s a valid .xlsx file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Implementation using SheetJS (xlsx) library
  // Make sure to install 'xlsx' via npm/yarn and import it at the top of your file:

  const extractCourseData = async (fileContent) => {
    // Convert fileContent (string) to ArrayBuffer for SheetJS
    let workbook;
    let jsonData = [];
    try {
      const arrayBuffer = await file.arrayBuffer();
      workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Access the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      console.log(worksheet,sheetName);
      // Parse course data from the worksheet
      // The data starts from row 4 (index 3) and contains course information
      // Columns: B=Course, E=Credits, G=Section, K=Meeting Patterns, L=Instructor, M=Start Date, N=End Date
      
      const courseRows = [];
      
      // Find the data range by looking for rows with course information
      for (let rowNum = 4; rowNum <= 20; rowNum++) { // Assuming max 20 courses
        const courseCell = worksheet[`B${rowNum}`];
        if (courseCell && courseCell.v && typeof courseCell.v === 'string' && courseCell.v.includes(' - ')) {
          const row = {
            course: worksheet[`B${rowNum}`]?.v || '',
            credits: worksheet[`E${rowNum}`]?.v || '',
            section: worksheet[`G${rowNum}`]?.v || '',
            meetingPatterns: worksheet[`K${rowNum}`]?.v || '',
            instructor: worksheet[`L${rowNum}`]?.v || '',
            startDate: worksheet[`M${rowNum}`]?.v || '',
            endDate: worksheet[`N${rowNum}`]?.v || ''
          };
          
          // Only add if we have essential course information
          if (row.course && row.meetingPatterns) {
            courseRows.push(row);
          }
        }
      }
      
      console.log('Extracted course rows:', courseRows);
      
      // Transform the raw data to match the expected format
      for (let i = 0; i < courseRows.length; i++) {
        const row = courseRows[i];
        console.log('row',i,row);
        // Parse course code and title from "CSE 5100 - Deep Reinforcement Learning" format
        const courseMatch = row.course.match(/^([A-Z]+\s+\d+)\s*-\s*(.+)$/);
        const courseCode = courseMatch ? courseMatch[1] : row.course;
        const courseTitle = courseMatch ? courseMatch[2] : '';
        
        // Parse meeting patterns like "Tue/Thu | 10:00 AM - 11:20 AM | EADS, Room 00216"
        const meetingMatch = row.meetingPatterns.match(/^([^|]+)\s*\|\s*([^|]+)\s*\|\s*(.+)$/);
        const days = meetingMatch ? meetingMatch[1].trim() : '';
        const timeRange = meetingMatch ? meetingMatch[2].trim() : '';
        const location = meetingMatch ? meetingMatch[3].trim() : '';
        
        // Parse time range like "10:00 AM - 11:20 AM"
        const timeMatch = timeRange.match(/^(.+?)\s*-\s*(.+)$/);
        const startTime = timeMatch ? timeMatch[1].trim() : '';
        const endTime = timeMatch ? timeMatch[2].trim() : '';
        
        // Skip invalid rows - require course code and meeting patterns
        if (!courseCode || !meetingMatch || !days || !startTime || !endTime) {
          continue;
        }
        
        jsonData.push({
          'Course Code': courseCode,
          'Course Title': courseTitle,
          'Days': days,
          'Start Time': startTime,
          'End Time': endTime,
          'Location': location,
          'Instructor': row.instructor,
          'Credits': row.credits,
          'Start Date': firstDayOfClass,
          'End Date': lastDayOfClass,
          'Section': row.section
        });
      }
      console.log('jsonData',jsonData); // This will contain the parsed data from the Excel sheet

    } catch (e) {
      throw new Error('Failed to parse Excel file: ' + e.message);
    }
    return jsonData;
  };

  const generateICS = (courses) => {
    let ics = 'BEGIN:VCALENDAR\r\n';
    ics += 'VERSION:2.0\r\n';
    ics += 'PRODID:-//Workday2Calendar//EN\r\n';
    ics += 'CALSCALE:GREGORIAN\r\n';
    ics += 'METHOD:PUBLISH\r\n';

    courses.forEach((course, index) => {
      const startDate = new Date(course['Start Date']);
      const endDate = new Date(course['End Date']);
      
      // Parse days
      const dayMap = {
        'Mon': 'MO',
        'Tue': 'TU', 
        'Wed': 'WE',
        'Thu': 'TH',
        'Fri': 'FR',
        'Sat': 'SA',
        'Sun': 'SU'
      };
      
      let days = [];
      if (course['Days'].includes('|')) {
        const dayGroups = course['Days'].split('|');
        dayGroups.forEach(group => {
          if (group.includes('/')) {
            group.split('/').forEach(day => days.push(dayMap[day.trim()]));
          } else {
            days.push(dayMap[group.trim()]);
          }
        });
      } else if (course['Days'].includes('/')) {
        course['Days'].split('/').forEach(day => days.push(dayMap[day.trim()]));
      } else {
        days.push(dayMap[course['Days'].trim()]);
      }

      // Parse time
      const startTime = parseTime(course['Start Time']);
      const endTime = parseTime(course['End Time']);
      
      // Generate recurring events for each week
      const eventStart = parseDate(firstDayOfClass,days[0]);

      eventStart.setHours(startTime.hours, startTime.minutes, 0, 0);
      
      const eventEnd = parseDate(firstDayOfClass,days[0]);
      eventEnd.setHours(endTime.hours, endTime.minutes, 0, 0);

      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${course['Course Code'].replace(/\s+/g, '')}-${index}@workday2calendar\r\n`;
      ics += `SUMMARY:${course['Course Code']} - ${course['Course Title']}\r\n`;
      ics += `DESCRIPTION:Instructor: ${course['Instructor']}\\nCredits: ${course['Credits']}\\nLocation: ${course['Location']}\r\n`;
      ics += `LOCATION:${course['Location']}\r\n`;
      ics += `DTSTART:${formatDateForICS(eventStart)}\r\n`;
      ics += `DTEND:${formatDateForICS(eventEnd)}\r\n`;
      ics += `RRULE:FREQ=WEEKLY;BYDAY=${days.join(',')};UNTIL=${formatDateForICS(endDate)}\r\n`;
      ics += 'END:VEVENT\r\n';
    });

    ics += 'END:VCALENDAR\r\n';
    return ics;
  };

  const parseDate = (dateStr, day) => {
    const date = new Date(dateStr);
    const dayIndex = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].indexOf(day);
    date.setDate(date.getDate() + dayIndex);
    return date;
  };

  const parseTime = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return { hours, minutes };
  };

  const formatDateForICS = (date) => {
    
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const downloadICS = () => {
    if (!icsContent) return;
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course_schedule.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFile(null);
    setParsedData(null);
    setIcsContent('');
    setError('');
    setParsingSteps([]);
    setFirstDayOfClass('2025-08-25');
    setLastDayOfClass('2025-12-07');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100">Workday Schedule to Calendar Converter</h1>
          <div className="max-w-4xl mx-auto">
            {/* Tutorial Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Tutorial</h2>
              
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>Open <a href="https://www.myworkday.com/wustl/" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300" target="_blank" rel="noopener noreferrer">Workday</a> and navigate to your "Current Classes" page</li>
                  <li>Click <strong>Export to Excel</strong> and download the exported file</li>
                  <li>Upload the downloaded file above</li>
                  <li>Set the semester dates, default date is filled for Fall 2025 in WUSTL</li>
                  <li>Click <strong>Parse Excel File</strong> to generate your class events and review them for accuracy</li>
                  <li>Once you've confirmed the events, you can download the ICS file and import it to your calendar app
                  </li>
                  <li className="flex items-start space-x-2">
                    <div>
                      <div className="mt-2">
                        <img 
                          src="/instructions.jpg" 
                          alt="Visual guide for exporting from Workday" 
                          className="max-w-full h-auto border border-gray-300 dark:border-gray-600 rounded"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Credit: <a href="https://andr3wtn.github.io/workday2calendar/assets/Instructions.jpg" className="text-blue-500 hover:underline dark:text-blue-400" target="_blank" rel="noopener noreferrer">Original instructions</a>
                        </p>
                      </div>
                    </div>
                  </li>
                </ol>
            </div>
            {/* File Upload Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Upload Excel File</h2>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-gray-600 dark:text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Only .xlsx files are accepted</p>
                  </div>
                </label>
              </div>
              
              {file && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded">
                  <p className="text-green-800 dark:text-green-200">File selected: {file.name}</p>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}
            </div>

            {/* Semester Dates Section */}
            {file && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Semester Dates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first-day" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Day of Class
                    </label>
                    <input
                      id="first-day"
                      type="date"
                      value={firstDayOfClass}
                      onChange={(e) => setFirstDayOfClass(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="last-day" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Day of Class
                    </label>
                    <input
                      id="last-day"
                      type="date"
                      value={lastDayOfClass}
                      onChange={(e) => setLastDayOfClass(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={parseExcelFile}
                    disabled={isProcessing || !canParseFile()}
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Parse Excel File'}
                  </button>
                </div>
              </div>
            )}

            {/* Parsing Process Section */}
            {parsingSteps.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Parsing Process</h2>
                <div
                  ref={logContainerRef}
                  className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded p-2 bg-gray-50 dark:bg-gray-900"
                  style={{ minHeight: '3.5rem', maxHeight: '10.5rem' }} // 5 lines at ~2.1rem/line
                >
                  {parsingSteps.map((step) => (
                    <div key={step.id} className="flex items-center space-x-3 p-2 bg-white dark:bg-gray-700 rounded shadow-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{step.timestamp}</span>
                      <span className="text-gray-800 dark:text-gray-200">{step.step}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Showing last {Math.min(5, parsingSteps.length)} of {parsingSteps.length} steps. Scroll to view more.</div>
              </div>
            )}

            {/* Parsed Data Section */}
            {parsedData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Parsed Course Data</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">Course</th>
                        <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">Instructor</th>
                        <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">Schedule</th>
                        <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">Location</th>
                        <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.map((course, index) => (
                        <tr key={index} className="border-b border-gray-200 dark:border-gray-600">
                          <td className="px-4 py-2">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{course['Course Code']}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{course['Course Title']}</div>
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{course['Instructor']}</td>
                          <td className="px-4 py-2">
                            <div className="text-gray-900 dark:text-gray-100">{course['Days']}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{course['Start Time']} - {course['End Time']}</div>
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{course['Location']}</td>
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{course['Credits']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ICS Download Section */}
            {icsContent && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Calendar File Ready</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your course schedule has been converted to ICS format. Click the button below to download the file.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={downloadICS}
                    className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                  >
                    Download ICS File
                  </button>
                  <button
                    onClick={resetForm}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Description</h2>
              <div className="text-gray-600 dark:text-gray-400 mb-4">
                <p>This tool is designed to convert your Workday schedule to a calendar format that can be imported into most calendar applications. Please note that this tool is not affiliated with the University of Virginia and is provided for educational purposes only.</p>
                <p>The tool is inspired by <a href="https://github.com/andr3wtn/workday2calendar" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300" target="_blank" rel="noopener noreferrer">Workday2Calendar Repo</a> and <a href="https://andr3wtn.github.io/workday2calendar/" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300" target="_blank" rel="noopener noreferrer">Workday2Calendar</a>. It is suffering to read pure html code and I use my own method to parse the excel file.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
