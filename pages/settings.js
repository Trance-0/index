'use client'
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Navbar from './navbar' 
import Footer from './footer'

export default function Settings() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [recentSearches, setRecentSearches] = useState([]);
  const [importStatus, setImportStatus] = useState('');
  const [searchEngine, setSearchEngine] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [passwordLength, setPasswordLength] = useState(16);
  const [passwordCharset, setPasswordCharset] = useState('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/');
  const [passwordAlgorithm, setPasswordAlgorithm] = useState('blake3');
  const [passwordSeed, setPasswordSeed] = useState('');
  const [passwordEmail, setPasswordEmail] = useState('');
  const [bookmarks, setBookmarks] = useState([
    {
      title: 'Canvas (WUSTL)',
      url: 'https://wustl.instructure.com/',
      description: 'Daily assignments'
    },
    {
      title: 'WebStac (WUSTL)', 
      url: 'https://webstac.wustl.edu/',
      description: 'Task manager'
    },
    {
      title: 'LeetCode',
      url: 'https://leetcode.com/',
      description: 'Gym for coding'
    },
    {
      title: 'Gmail',
      url: 'https://gmail.com',
      description: 'Email service (Personal)'
    },
    {
      title: 'Outlook',
      url: 'https://outlook.com',
      description: 'Email service (Work)'
    },
    {
      title: 'GitHub',
      url: 'https://github.com',
      description: 'Development platform'
    },
    {
      title: 'Cloudflare',
      url: 'https://cloudflare.com',
      description: 'Web infrastructure & security'
    },
    {
      title: 'Vercel',
      url: 'https://vercel.com',
      description: 'Deployment & hosting platform'
    }
  ]);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    const savedBookmarks = localStorage.getItem('bookmarks');
    const savedSearchEngine = localStorage.getItem('searchEngine');
    const savedBackgroundImage = localStorage.getItem('backgroundImage') || '';
    const savedPasswordLength = parseInt(localStorage.getItem('passwordLength')) || 16;
    const savedPasswordCharset = localStorage.getItem('passwordCharset') || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const savedPasswordAlgorithm = localStorage.getItem('passwordAlgorithm') || 'blake3';
    const savedPasswordSeed = localStorage.getItem('passwordSeed') || '';
    const savedPasswordEmail = localStorage.getItem('passwordEmail') || '';
    
    setBackgroundImage(savedBackgroundImage);
    setPasswordLength(savedPasswordLength);
    setPasswordCharset(savedPasswordCharset);
    setPasswordAlgorithm(savedPasswordAlgorithm);
    setPasswordSeed(savedPasswordSeed);
    setPasswordEmail(savedPasswordEmail);
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
    if (savedSearchEngine) {
      setSearchEngine(savedSearchEngine);
    } else {
      setSearchEngine('https://www.google.com/search?q={searchTerms}');
      localStorage.setItem('searchEngine', 'https://www.google.com/search?q={searchTerms}');
    }
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    } else {
      localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    }
  }, []);

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
  };

  const handleBackgroundImageChange = (e) => {
    const newImage = e.target.value;
    setBackgroundImage(newImage);
    localStorage.setItem('backgroundImage', newImage);
  };

  const handleSearchEngineChange = (e) => {
    const newEngine = e.target.value;
    setSearchEngine(newEngine);
    localStorage.setItem('searchEngine', newEngine);
  };

  const handlePasswordLengthChange = (e) => {
    const newLength = parseInt(e.target.value);
    setPasswordLength(newLength);
    localStorage.setItem('passwordLength', newLength);
  };

  const handlePasswordCharsetChange = (e) => {
    const newCharset = e.target.value;
    setPasswordCharset(newCharset);
    localStorage.setItem('passwordCharset', newCharset);
  };

  const handlePasswordAlgorithmChange = (e) => {
    const newAlgorithm = e.target.value;
    setPasswordAlgorithm(newAlgorithm);
    localStorage.setItem('passwordAlgorithm', newAlgorithm);
  };

  const handlePasswordSeedChange = (e) => {
    const newSeed = e.target.value;
    setPasswordSeed(newSeed);
    localStorage.setItem('passwordSeed', newSeed);
  };

  const handlePasswordEmailChange = (e) => {
    const newEmail = e.target.value;
    setPasswordEmail(newEmail);
    localStorage.setItem('passwordEmail', newEmail);
  };

  const handleBookmarkChange = (index, field, value) => {
    const newBookmarks = [...bookmarks];
    newBookmarks[index][field] = value;
    setBookmarks(newBookmarks);
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
  };

  const addBookmark = () => {
    const newBookmarks = [...bookmarks, {
      title: '',
      url: '',
      description: ''
    }];
    setBookmarks(newBookmarks);
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
  };

  const removeBookmark = (index) => {
    const newBookmarks = bookmarks.filter((_, i) => i !== index);
    setBookmarks(newBookmarks);
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const exportSettings = () => {
    const settings = {
      theme: currentTheme,
      bookmarks: bookmarks,
      recentSearches: recentSearches,
      searchEngine: searchEngine,
      backgroundImage: backgroundImage,
      passwordLength: passwordLength,
      passwordCharset: passwordCharset,
      passwordAlgorithm: passwordAlgorithm,
      passwordSeed: passwordSeed,
      passwordEmail: passwordEmail
    };
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INDEX_${Date.now()}_settings.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportStatus('Importing...');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target.result);
          if (settings.theme) {
            setTheme(settings.theme);
          }
          if (settings.bookmarks) {
            setBookmarks(settings.bookmarks);
            localStorage.setItem('bookmarks', JSON.stringify(settings.bookmarks));
          }
          if (settings.recentSearches) {
            setRecentSearches(settings.recentSearches);
            localStorage.setItem('recentSearches', JSON.stringify(settings.recentSearches));
          }
          if (settings.searchEngine) {
            setSearchEngine(settings.searchEngine);
            localStorage.setItem('searchEngine', settings.searchEngine);
          }
          if (settings.backgroundImage) {
            setBackgroundImage(settings.backgroundImage);
            localStorage.setItem('backgroundImage', settings.backgroundImage);
          }
          if (settings.passwordLength) {
            setPasswordLength(settings.passwordLength);
            localStorage.setItem('passwordLength', settings.passwordLength);
          }
          if (settings.passwordCharset) {
            setPasswordCharset(settings.passwordCharset);
            localStorage.setItem('passwordCharset', settings.passwordCharset);
          }
          if (settings.passwordAlgorithm) {
            setPasswordAlgorithm(settings.passwordAlgorithm);
            localStorage.setItem('passwordAlgorithm', settings.passwordAlgorithm);
          }
          if (settings.passwordSeed) {
            setPasswordSeed(settings.passwordSeed);
            localStorage.setItem('passwordSeed', settings.passwordSeed);
          }
          if (settings.passwordEmail) {
            setPasswordEmail(settings.passwordEmail);
            localStorage.setItem('passwordEmail', settings.passwordEmail);
          }
          setImportStatus('Settings imported successfully!');
          setTimeout(() => setImportStatus(''), 3000);
        } catch (error) {
          console.error('Error importing settings:', error);
          setImportStatus('Error: Invalid settings file');
          setTimeout(() => setImportStatus(''), 3000);
        }
      };
      reader.onerror = () => {
        setImportStatus('Error: Failed to read file');
        setTimeout(() => setImportStatus(''), 3000);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  All settings are saved automatically when changed. There is no undo functionality for settings changes.
                  Please export and backup your settings before making significant changes.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Theme Settings</h2>
            <div className="flex items-center">
              <label htmlFor="theme" className="mr-4">Theme:</label>
              <select
                id="theme"
                className="border rounded px-3 py-1"
                value={currentTheme}
                onChange={handleThemeChange}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Bookmark Settings</h2>
            <div className="space-y-4">
              {bookmarks.map((bookmark, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Bookmark {index + 1}</h3>
                    <button
                      onClick={() => removeBookmark(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={bookmark.title}
                      onChange={(e) => handleBookmarkChange(index, 'title', e.target.value)}
                      placeholder="Title"
                      className="w-full px-3 py-2 border rounded"
                    />
                    <input
                      type="url"
                      value={bookmark.url}
                      onChange={(e) => handleBookmarkChange(index, 'url', e.target.value)}
                      placeholder="URL"
                      className="w-full px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      value={bookmark.description}
                      onChange={(e) => handleBookmarkChange(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={addBookmark}
                className="button-success px-4 py-2 rounded transition-colors"
              >
                Add Bookmark
              </button>
            </div>
          </div>

          <div className="rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Background Settings</h2>
            <div className="mb-6">
              <label htmlFor="backgroundImage" className="block mb-2">Background Image URL:</label>
              <input
                id="backgroundImage"
                type="text"
                value={backgroundImage}
                onChange={handleBackgroundImageChange}
                className="w-full px-5 py-2 rounded-lg border focus:outline-none shadow-sm text-sm"
                placeholder="Enter image URL..."
              />
              <p className="text-sm mt-2">
                Enter a URL for the background image of the index page, notice that the image must be accessible by the public. For example, you can use a URL from Unsplash or another image hosting service, personally I recommend using self hosted wordpress server. Images from X, or other social media platforms are usually not accessible by the public.
              </p>
              {backgroundImage && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <img 
                    src={backgroundImage} 
                    alt="Background preview" 
                    className="max-w-xs rounded-lg shadow-md"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Search Settings</h2>
            <div className="mb-6">
              <label htmlFor="searchEngine" className="block mb-2">Search Engine URL:</label>
              <input
                id="searchEngine"
                type="text"
                value={searchEngine}
                onChange={handleSearchEngineChange}
                className="w-full px-5 py-2 rounded-lg border focus:outline-none shadow-sm text-sm"
                placeholder="Enter search engine URL with {searchTerms} placeholder..."
              />
              <p className="text-sm mt-2">
                Use {'{searchTerms}'} as a placeholder for the search query
              </p>
            </div>
            <div>
              <h3 className="text-lg mb-2">Recent Searches:</h3>
              {recentSearches.length > 0 ? (
                <ul className="mb-4">
                  {recentSearches.map((search, index) => (
                    <li key={index} className="py-1">{search}</li>
                  ))}
                </ul>
              ) : (
                <p className="mb-4">No recent searches</p>
              )}
              <button
                onClick={clearRecentSearches}
                className="button-warning px-4 py-2 rounded transition-colors"
              >
                Clear Search History
              </button>
            </div>
          </div>

          <div className="rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Password Generator Settings</h2>
            <div className="mb-6">
              <label htmlFor="passwordLength" className="block mb-2">Password Length:</label>
              <input
                id="passwordLength"
                type="number"
                value={passwordLength}
                onChange={handlePasswordLengthChange}
                className="w-full px-5 py-2 rounded-lg border focus:outline-none shadow-sm text-sm"
                placeholder="Enter password length..."
              />
            </div>
            <div className="mb-6">
              <label htmlFor="passwordCharset" className="block mb-2">Password Charset:</label>
              <input
                id="passwordCharset"
                type="text"
                value={passwordCharset}
                onChange={handlePasswordCharsetChange}
                className="w-full px-5 py-2 rounded-lg border focus:outline-none shadow-sm text-sm"
                placeholder="Enter password charset..."
              />
            </div>
            <div className="mb-6">
              <label htmlFor="passwordAlgorithm" className="block mb-2">Password Algorithm:</label>
              <select
                id="passwordAlgorithm"
                className="border rounded px-3 py-1"
                value={passwordAlgorithm}
                onChange={handlePasswordAlgorithmChange}
              >
                <option value="blake3">blake3</option>
                <option value="blake2s">blake2s</option>
                <option value="blake2b">blake2b</option>
                <option value="sha256">sha256</option>
                <option value="sha384">sha384</option>
                <option value="sha512">sha512</option>
                <option value="crc32">crc32</option>
                <option value="crc64">crc64</option>
              </select>
            </div>
            <div className="mb-6">
              <label htmlFor="passwordSeed" className="block mb-2">Password Seed:</label>
              <input
                id="passwordSeed"
                type="text"
                value={passwordSeed}
                onChange={handlePasswordSeedChange}
                className="w-full px-5 py-2 rounded-lg border focus:outline-none shadow-sm text-sm"
                placeholder="Enter password seed..."
              />
            </div>
            <div className="mb-6">
              <label htmlFor="passwordEmail" className="block mb-2">Password Email:</label>
              <input
                id="passwordEmail"
                type="email"
                value={passwordEmail}
                onChange={handlePasswordEmailChange}
                className="w-full px-5 py-2 rounded-lg border focus:outline-none shadow-sm text-sm"
                placeholder="Enter email..."
              />
            </div>
          </div>

          <div className="rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Import/Export Settings</h2>
            <div className="flex flex-col gap-4">
              <div>
                <button
                  onClick={exportSettings}
                  className="button-success px-4 py-2 rounded transition-colors"
                >
                  Export Settings
                </button>
              </div>
              <div className="flex flex-col">
                <label htmlFor="import" className="mb-2">Import Settings:</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    id="import"
                    accept=".json"
                    onChange={importSettings}
                    className="border rounded p-2"
                  />
                  {importStatus && (
                    <div className="text-sm">
                      {importStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">About This Project</h2>
            <div className="space-y-4">
              <p>
                This is a personal dashboard built with Next.js and Tailwind CSS. It provides a customizable homepage with all the variables stored by the user. Our goal is to return the rights of data to the user.
              </p>
              <div className="mt-4">
                <a
                  href="https://github.com/Trance-0/index/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-info inline-flex items-center px-4 py-2 rounded transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Report a Bug
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}