import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navbar from './navbar' 
import Footer from './footer'

export default function Home() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchEngine, setSearchEngine] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');

  useEffect(() => {
    // Load recent searches and search engine from localStorage on component mount
    const savedSearches = localStorage.getItem('recentSearches');
    const savedSearchEngine = localStorage.getItem('searchEngine');
    const savedBackgroundImage = localStorage.getItem('backgroundImage') || '';
    
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
    if (savedSearchEngine) {
      setSearchEngine(savedSearchEngine);
    } else {
      // Default search engine if none set
      setSearchEngine('https://www.google.com/search?q={searchTerms}');
      localStorage.setItem('searchEngine', 'https://www.google.com/search?q={searchTerms}');
    }
    setBackgroundImage(savedBackgroundImage);
  }, []);

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;

    // Add new search to recent searches
    const newSearches = [searchTerm, ...recentSearches.slice(0, 4)];
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

  const handleSearchEngineChange = (e) => {
    const newEngine = e.target.value;
    setSearchEngine(newEngine);
    localStorage.setItem('searchEngine', newEngine);
  };

  const handleRecentSearchClick = (search) => {
    handleSearch(search);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>INDEX</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex-grow flex flex-col">
        <Navbar />
        <div 
          className="flex-grow bg-gray-100 bg-cover bg-center bg-no-repeat"
          style={backgroundImage ? {backgroundImage: `url('${backgroundImage}')`} : {}}
        >
          <div className="flex flex-col items-center pt-20 px-4">
            {/* Google-style logo */}
            <h1 className="text-6xl font-bold mb-8 text-gray-800">
              Search <span className="animate-typing overflow-hidden whitespace-nowrap border-r-4 border-gray-800 pr-1">with INDEX</span>
            </h1>
            
            {/* Search bar */}
            <div className="w-full max-w-2xl mb-16">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="w-full px-5 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500 shadow-sm"
                  placeholder="Search..."
                />
                <button type="submit" className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                {/* Recent searches dropdown */}
                {isSearchFocused && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    {recentSearches.length > 0 ? (
                      <ul className="py-2">
                        {recentSearches.map((search, index) => (
                          <li 
                            key={index} 
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleRecentSearchClick(search)}
                          >
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {search}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-2 text-gray-500">No recent searches</div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Bookmarks grid */}
            <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
              {/* Example bookmark cards */}
              <div className="group relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: "url('https://source.unsplash.com/random/800x600?github')"}}></div>
                <div className="absolute inset-0 bg-black opacity-60 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative p-4">
                  <h3 className="text-white text-lg font-semibold mb-2">GitHub</h3>
                  <p className="text-gray-200 text-sm">Development platform</p>
                </div>
              </div>

              <div className="group relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: "url('https://source.unsplash.com/random/800x600?code')"}}></div>
                <div className="absolute inset-0 bg-black opacity-60 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative p-4">
                  <h3 className="text-white text-lg font-semibold mb-2">VS Code</h3>
                  <p className="text-gray-200 text-sm">Code editor</p>
                </div>
              </div>

              <div className="group relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: "url('https://source.unsplash.com/random/800x600?chat')"}}></div>
                <div className="absolute inset-0 bg-black opacity-60 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative p-4">
                  <h3 className="text-white text-lg font-semibold mb-2">Discord</h3>
                  <p className="text-gray-200 text-sm">Communication platform</p>
                </div>
              </div>

              <div className="group relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: "url('https://source.unsplash.com/random/800x600?email')"}}></div>
                <div className="absolute inset-0 bg-black opacity-60 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative p-4">
                  <h3 className="text-white text-lg font-semibold mb-2">Gmail</h3>
                  <p className="text-gray-200 text-sm">Email service</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
