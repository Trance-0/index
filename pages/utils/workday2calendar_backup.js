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

  const parseExcelFile = async () => {
    if (!file) return;

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
          'Start Date': row.startDate,
          'End Date': row.endDate,
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
      const eventStart = new Date(startDate);
      eventStart.setHours(startTime.hours, startTime.minutes, 0, 0);
      
      const eventEnd = new Date(startDate);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Workday Schedule to Calendar Converter</h1>
          
          <div className="max-w-4xl mx-auto">
            {/* File Upload Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Upload Excel File</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-gray-600">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">Only .xlsx files are accepted</p>
                  </div>
                </label>
              </div>
              
              {file && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800">File selected: {file.name}</p>
                  <button
                    onClick={parseExcelFile}
                    disabled={isProcessing}
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Parse Excel File'}
                  </button>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800">{error}</p>
                </div>
              )}
            </div>

            {/* Parsing Process Section */}
            {parsingSteps.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Parsing Process</h2>
                <div
                  ref={logContainerRef}
                  className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50"
                  style={{ minHeight: '3.5rem', maxHeight: '10.5rem' }} // 5 lines at ~2.1rem/line
                >
                  {parsingSteps.map((step) => (
                    <div key={step.id} className="flex items-center space-x-3 p-2 bg-white rounded shadow-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">{step.timestamp}</span>
                      <span className="text-gray-800">{step.step}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-1">Showing last {Math.min(5, parsingSteps.length)} of {parsingSteps.length} steps. Scroll to view more.</div>
              </div>
            )}

            {/* Parsed Data Section */}
            {parsedData && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Parsed Course Data</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">Course</th>
                        <th className="px-4 py-2 text-left">Instructor</th>
                        <th className="px-4 py-2 text-left">Schedule</th>
                        <th className="px-4 py-2 text-left">Location</th>
                        <th className="px-4 py-2 text-left">Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.map((course, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2">
                            <div className="font-medium">{course['Course Code']}</div>
                            <div className="text-sm text-gray-600">{course['Course Title']}</div>
                          </td>
                          <td className="px-4 py-2">{course['Instructor']}</td>
                          <td className="px-4 py-2">
                            <div>{course['Days']}</div>
                            <div className="text-sm text-gray-600">{course['Start Time']} - {course['End Time']}</div>
                          </td>
                          <td className="px-4 py-2">{course['Location']}</td>
                          <td className="px-4 py-2">{course['Credits']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ICS Download Section */}
            {icsContent && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Calendar File Ready</h2>
                <p className="text-gray-600 mb-4">
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
