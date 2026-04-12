'use client'
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Navbar from './navbar' 
import Footer from './footer'

export default function Settings() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [importStatus, setImportStatus] = useState('');
  const [expandedBookmarkIndex, setExpandedBookmarkIndex] = useState(0);
  // bookmarks settings
  const [bookmarks, setBookmarks] = useState([]);
  // background settings
  const [backgroundImage, setBackgroundImage] = useState('');
  const [autoDimBackground, setAutoDimBackground] = useState(true);
  // search settings
  const [searchEngine, setSearchEngine] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [maxSuggestions, setMaxSuggestions] = useState(5);
  const [maxRecentSearchesInSuggestions, setMaxRecentSearchesInSuggestions] = useState(5);
  const [suggestionProvider, setSuggestionProvider] = useState('');


  const defaultBookmarks = [
    {
      title: 'Canvas (WUSTL)',
      url: 'https://wustl.instructure.com/',
      description: 'Daily assignments'
    },
    {
      title: 'OpenAI',
      url: 'https://openai.com/',
      description: 'AI research and products'
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
  ];

  useEffect(() => {
    // Load saved settings from localStorage
    // bookmarks settings
    const savedBookmarks = localStorage.getItem('bookmarks');
    // background settings
    const savedBackgroundImage = localStorage.getItem('backgroundImage') || '';
    const savedAutoDimBackground = localStorage.getItem('autoDimBackground');
    // search settings
    const savedSearchEngine = localStorage.getItem('searchEngine');
    const savedRecentSearches = localStorage.getItem('recentSearches');
    const savedMaxSuggestions = localStorage.getItem('maxSuggestions');
    const savedMaxRecentSearchesInSuggestions = localStorage.getItem('maxRecentSearchesInSuggestions');
    const savedSuggestionProvider = localStorage.getItem('suggestionProvider');
    
    // bookmarks settings
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    } else {
      setBookmarks(defaultBookmarks);
      localStorage.setItem('bookmarks', JSON.stringify(defaultBookmarks));
    }
    // background settings
    setBackgroundImage(savedBackgroundImage);
    setAutoDimBackground(savedAutoDimBackground !== 'false');
    // search settings
    if (savedSearchEngine) {
      setSearchEngine(savedSearchEngine);
    } else {
      setSearchEngine('https://www.google.com/search?q={searchTerms}');
      localStorage.setItem('searchEngine', 'https://www.google.com/search?q={searchTerms}');
    }
    if (savedRecentSearches) {
      setRecentSearches(JSON.parse(savedRecentSearches));
    }
    if (savedSuggestionProvider) {
      setSuggestionProvider(savedSuggestionProvider);
    } else {
      setSuggestionProvider('https://suggestqueries.google.com/complete/search?client=firefox&q={searchTerms}');
      localStorage.setItem('suggestionProvider', 'https://suggestqueries.google.com/complete/search?client=firefox&q={searchTerms}');
    }
    if (savedMaxRecentSearchesInSuggestions) {
      setMaxRecentSearchesInSuggestions(savedMaxRecentSearchesInSuggestions);
    } else {
      setMaxRecentSearchesInSuggestions(5);
      localStorage.setItem('maxRecentSearchesInSuggestions', 5);
    }
    if (savedMaxSuggestions) {
      setMaxSuggestions(savedMaxSuggestions);
    } else {
      setMaxSuggestions(5);
      localStorage.setItem('maxSuggestions', 5);
    }
    localStorage.removeItem('passwordLength');
    localStorage.removeItem('passwordCharset');
    localStorage.removeItem('passwordAlgorithm');
    localStorage.removeItem('passwordSeed');
    localStorage.removeItem('passwordEmail');
    
  }, []);

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
  };

  const handleBackgroundImageChange = (e) => {
    const newImage = e.target.value;
    setBackgroundImage(newImage);
    localStorage.setItem('backgroundImage', newImage);
    window.dispatchEvent(new Event('index-settings-changed'));
  };

  const handleAutoDimBackgroundChange = (e) => {
    const enabled = e.target.checked;
    setAutoDimBackground(enabled);
    localStorage.setItem('autoDimBackground', enabled);
    window.dispatchEvent(new Event('index-settings-changed'));
  };

  const handleSearchEngineChange = (e) => {
    const newEngine = e.target.value;
    setSearchEngine(newEngine);
    localStorage.setItem('searchEngine', newEngine);
  };

  const handleSuggestionProviderChange = (e) => {
    const newProvider = e.target.value;
    setSuggestionProvider(newProvider);
    localStorage.setItem('suggestionProvider', newProvider);
  };

  const handleMaxSuggestionsChange = (e) => {
    const newMax = parseInt(e.target.value);
    setMaxSuggestions(newMax);
    localStorage.setItem('maxSuggestions', newMax);
  };

  const handleMaxRecentSearchesInSuggestionsChange = (e) => {
    const newMax = parseInt(e.target.value);
    setMaxRecentSearchesInSuggestions(newMax);
    localStorage.setItem('maxRecentSearchesInSuggestions', newMax);
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
    setExpandedBookmarkIndex(newBookmarks.length - 1);
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
  };

  const removeBookmark = (index) => {
    const newBookmarks = bookmarks.filter((_, i) => i !== index);
    setBookmarks(newBookmarks);
    setExpandedBookmarkIndex((currentIndex) => {
      if (newBookmarks.length === 0) {
        return -1;
      }
      if (currentIndex === index) {
        return Math.max(0, index - 1);
      }
      if (currentIndex > index) {
        return currentIndex - 1;
      }
      return currentIndex;
    });
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
  };

  const restoreDefaultBookmarks = () => {
    setBookmarks(defaultBookmarks);
    setExpandedBookmarkIndex(0);
    localStorage.setItem('bookmarks', JSON.stringify(defaultBookmarks));
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
      maxSuggestions: maxSuggestions,
      maxRecentSearchesInSuggestions: maxRecentSearchesInSuggestions,
      suggestionProvider: suggestionProvider,
      searchEngine: searchEngine,
      backgroundImage: backgroundImage,
      autoDimBackground: autoDimBackground
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
  
  const downloadSettingsFromURL = async (url) => {
    try {
      setImportStatus('Downloading...');
      const response = await fetch(url);
      const settings = await response.json();
      
      // Create a synthetic event object to match the importSettings function's expected input
      const syntheticEvent = {
        target: {
          files: [new File([JSON.stringify(settings)], 'settings.json', { type: 'application/json' })]
        }
      };
      
      importSettings(syntheticEvent);
    } catch (error) {
      setImportStatus(`Error: ${error.message}`);
      setTimeout(() => setImportStatus(''), 3000);
    }
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
          if (settings.suggestionProvider) {
            setSuggestionProvider(settings.suggestionProvider);
            localStorage.setItem('suggestionProvider', settings.suggestionProvider);
          }
          if (settings.maxSuggestions) {
            setMaxSuggestions(settings.maxSuggestions);
            localStorage.setItem('maxSuggestions', settings.maxSuggestions);
          }
          if (settings.maxRecentSearchesInSuggestions) {
            setMaxRecentSearchesInSuggestions(settings.maxRecentSearchesInSuggestions);
            localStorage.setItem('maxRecentSearchesInSuggestions', settings.maxRecentSearchesInSuggestions);
          }
          if (settings.backgroundImage) {
            setBackgroundImage(settings.backgroundImage);
            localStorage.setItem('backgroundImage', settings.backgroundImage);
          }
          if (typeof settings.autoDimBackground === 'boolean') {
            setAutoDimBackground(settings.autoDimBackground);
            localStorage.setItem('autoDimBackground', settings.autoDimBackground);
          }
          window.dispatchEvent(new Event('index-settings-changed'));
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
                <details
                  key={index}
                  className="border rounded-lg overflow-hidden"
                  open={expandedBookmarkIndex === index}
                  onToggle={(e) => {
                    if (e.currentTarget.open) {
                      setExpandedBookmarkIndex(index);
                    }
                  }}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-medium">
                    <div className="min-w-0">
                      <p className="truncate">Bookmark {index + 1}: {bookmark.title || 'Untitled bookmark'}</p>
                      <p className="truncate text-sm opacity-70">{bookmark.url || 'No URL set'}</p>
                    </div>
                    <span className="text-sm opacity-70">Expand</span>
                  </summary>
                  <div className="border-t p-4">
                    <div className="flex justify-end mb-3">
                      <button
                        onClick={() => removeBookmark(index)}
                        className="text-red-500 hover:text-red-700"
                        type="button"
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
                </details>
              ))}
              <button
                onClick={addBookmark}
                className="button-success px-4 py-2 rounded transition-colors"
              >
                Add Bookmark
              </button>
              <button
                onClick={restoreDefaultBookmarks}
                className="button-warning ms-4 px-4 py-2 rounded transition-colors"
              >
                Restore Default Bookmarks
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
              <label className="mt-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={autoDimBackground}
                  onChange={handleAutoDimBackgroundChange}
                />
                <span>Auto-dim bright backgrounds in dark mode</span>
              </label>
              <p className="text-sm mt-2">
                When enabled, the app samples the selected background image and adds a dark overlay in dark mode if the image appears too bright.
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
            <div className="mb-6">
              <label htmlFor="suggestionProvider" className="block mb-2">Suggestion Provider URL:</label>
              <input
                id="suggestionProvider"
                type="text"
                value={suggestionProvider}
                onChange={handleSuggestionProviderChange}
                className="w-full px-5 py-2 rounded-lg border focus:outline-none shadow-sm text-sm"
                placeholder="Enter suggestion provider URL with {searchTerms} placeholder..."
              />
              <p className="text-sm mt-2">
                Use {'{searchTerms}'} as a placeholder for the search query
              </p>
            </div>
            <div className="mb-6">
              <label htmlFor="maxSuggestions" className="block mb-2">Max Suggestions:</label>
              <input
                id="maxSuggestions"
                type="number"
                value={maxSuggestions}
                onChange={handleMaxSuggestionsChange}
                className="w-full px-5 py-2 rounded-lg border focus:outline-none shadow-sm text-sm"
                placeholder="Enter max suggestions..."
              />
            </div>
            <div className="mb-6">
              <label htmlFor="maxRecentSearchesInSuggestions" className="block mb-2">Max Recent Searches in Suggestions:</label>
              <input
                id="maxRecentSearchesInSuggestions"
                type="number"
                value={maxRecentSearchesInSuggestions}
                onChange={handleMaxRecentSearchesInSuggestionsChange}
                className="w-full px-5 py-2 rounded-lg border focus:outline-none shadow-sm text-sm" 
                placeholder="Enter max recent searches in suggestions..."
              />
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
              <div className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <label htmlFor="import" className="mb-2">Import from File:</label>
                  <input
                    type="file"
                    id="import"
                    accept=".json"
                    onChange={importSettings}
                    className="border rounded p-2"
                  />
                </div>

                <div className="flex flex-col">
                  <label htmlFor="importUrl" className="mb-2">Import from URL:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter settings URL..."
                      className="flex-1 border rounded p-2"
                      id="importUrl"
                    />
                    <button
                      onClick={() => {
                        const url = document.getElementById('importUrl').value;
                        if (url) downloadSettingsFromURL(url);
                      }}
                      className="button-info px-4 py-2 rounded transition-colors"
                    >
                      Import
                    </button>
                  </div>
                </div>

                {importStatus && (
                  <div className="text-sm">
                    {importStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">About This Project</h2>
            <div className="space-y-4">
              <p>
                This is a personal dashboard built with Next.js and Tailwind CSS, developed with Cursor and use Maintainable AI generated code. It provides a customizable homepage with all the variables stored by the user. Our goal is to return the rights of data to the user.

                This is also a portfolio site for <a href="https://github.com/Trance-0" target="_blank" rel="noopener noreferrer" className="font-semibold">Trance-0</a>.

                The small projects are listed in utils and hope you will like it.
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
