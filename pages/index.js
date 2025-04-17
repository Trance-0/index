import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import Navbar from './navbar'

export default function Home() {
  // application states
  const searchInputRef = useRef(null);
  const [searchInput, setSearchInput] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  // search settings
  const [searchEngine, setSearchEngine] = useState('');
  const [suggestionProvider, setSuggestionProvider] = useState('https://suggestqueries.google.com/complete/search?client=firefox&q=');
  const [maxSuggestions, setMaxSuggestions] = useState(5);
  const [maxRecentSearchesInSuggestions, setMaxRecentSearchesInSuggestions] = useState(5);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
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
  const [backgroundImage, setBackgroundImage] = useState('');

  useEffect(() => {
    // Focus search input on component mount
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Load recent searches and search engine from localStorage on component mount
    const savedBookmarks = localStorage.getItem('bookmarks');
    const savedBackgroundImage = localStorage.getItem('backgroundImage') || '';
    // search settings
    const savedSearches = localStorage.getItem('recentSearches');
    const savedSearchEngine = localStorage.getItem('searchEngine');
    const savedSuggestionProvider = localStorage.getItem('suggestionProvider');
    const savedMaxSuggestions = localStorage.getItem('maxSuggestions');
    const savedMaxRecentSearchesInSuggestions = localStorage.getItem('maxRecentSearchesInSuggestions');

    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches).slice(0, maxRecentSearchesInSuggestions));
    }
    if (savedSearchEngine) {
      setSearchEngine(savedSearchEngine);
    } else {
      // Default search engine if none set
      setSearchEngine('https://www.google.com/search?q={searchTerms}');
      localStorage.setItem('searchEngine', 'https://www.google.com/search?q={searchTerms}');
    }
    if (savedSuggestionProvider) {
      setSuggestionProvider(savedSuggestionProvider);
    } else {
      // Default suggestion provider if none set
      setSuggestionProvider('https://suggestqueries.google.com/complete/search?client=firefox&q={searchTerms}');
      localStorage.setItem('suggestionProvider', 'https://suggestqueries.google.com/complete/search?client=firefox&q={searchTerms}');
    }
    if (savedMaxSuggestions) {
      setMaxSuggestions(savedMaxSuggestions);
    } else {
      // Default max suggestions if none set
      setMaxSuggestions(5);
      localStorage.setItem('maxSuggestions', 5);
    }
    if (savedMaxRecentSearchesInSuggestions) {
      setMaxRecentSearchesInSuggestions(savedMaxRecentSearchesInSuggestions);
    } else {
      // Default max recent searches in suggestions if none set
      setMaxRecentSearchesInSuggestions(5);
      localStorage.setItem('maxRecentSearchesInSuggestions', 5);
    }
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
    setBackgroundImage(savedBackgroundImage);
  }, []);
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchInput.trim().length > 0) {
        try {
          const response = await fetch(
            `${suggestionProvider.replace('{searchTerms}', encodeURIComponent(searchInput))}`,
            {
              headers: {
                'Accept': 'application/json'
              }
            }
          );
          // Handle no response case
          if (response.status === 0) {
            throw new Error('No response received from suggestion provider');
          }
          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error('Error parsing JSON:', e);
            data = [[], []];
          }
          // Filter and limit suggestions
          const filteredSuggestions = data[1] || [];
          const limitedSuggestions = filteredSuggestions.slice(0, maxSuggestions);
          
          // Match with recent searches
          const matchingRecentSearches = recentSearches
            .filter(search => search.toLowerCase().includes(searchInput.toLowerCase()))
            .slice(0, maxSuggestions - limitedSuggestions.length);
          
          setSuggestions([...limitedSuggestions, ...matchingRecentSearches]);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          // Fallback to recent searches if API fails
          const matchingRecentSearches = recentSearches
            .filter(search => search.toLowerCase().includes(searchInput.toLowerCase()))
            .slice(0, maxSuggestions);
          setSuggestions(matchingRecentSearches);
        }
      } else {
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchInput, recentSearches, suggestionProvider, maxSuggestions, maxRecentSearchesInSuggestions]);

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;

    // Add new search to recent searches
    const newSearches = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, maxRecentSearches);
    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));

    // Perform search using configured search engine
    const searchUrl = searchEngine.replace('{searchTerms}', encodeURIComponent(searchTerm));
    window.location.href = searchUrl;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchInput);
    setSearchInput('');
  };

  const handleRecentSearchClick = (search) => {
    handleSearch(search);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchInput(suggestion);
    handleSearch(suggestion);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>INDEX</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="flex-grow flex flex-col">
        <div
          className="flex-grow bg-cover bg-center bg-no-repeat"
          style={backgroundImage ? { backgroundImage: `url('${backgroundImage}')` } : {}}
        >
          <div className="flex flex-col items-center pt-20 px-4">
            {/* Google-style logo */}
            <h1 className="inv-title text-6xl font-bold mb-8">
              Search <span className="animate-typing overflow-hidden whitespace-nowrap border-r-4 pr-1">with INDEX</span>
            </h1>

            {/* Search bar */}
            <div className="w-full max-w-2xl mb-16">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="w-full px-5 py-3 rounded-full border focus:outline-none shadow-sm"
                  placeholder="Search..."
                />
                <button type="submit" className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                {/* Search suggestions and recent searches dropdown */}
                {isSearchFocused && (suggestions.length > 0 || recentSearches.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg border z-10 bg-secondary">
                    {suggestions.length > 0 ? (
                      <ul className="py-2">
                        {suggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            className="px-4 py-2 hover:bg-opacity-10 cursor-pointer"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              {suggestion}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : recentSearches.length > 0 ? (
                      <ul className="py-2">
                        {recentSearches.map((search, index) => (
                          <li
                            key={index}
                            className="px-4 py-2 hover:bg-opacity-10 cursor-pointer"
                            onClick={() => handleRecentSearchClick(search)}
                          >
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {search}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-2">No suggestions available</div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Bookmarks grid */}
            <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
              {bookmarks.map((bookmark, index) => (
                <div key={index} className="group relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <a href={bookmark.url}>
                    <div className="absolute inset-0 bg-primary group-hover:bg-opacity-60 transition-opacity"></div>
                    <div className="relative p-4">
                      <h3 className="text-lg font-semibold mb-2">
                        {bookmark.title}
                      </h3>
                      <p className="text-sm">{bookmark.description}</p>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
