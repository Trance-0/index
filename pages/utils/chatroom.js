'use client'
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';

export default function ChatRoom() {
  const defaultModel = 'o3-mini';
  
  // User-related settings
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [openaiKey, setOpenaiKey] = useState('');
  // Set default conversation to "New Conversation"
  const [selectedConversation, setSelectedConversation] = useState("New Conversation");
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  
  // Program-based settings
  const [isVertical, setIsVertical] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [modelParamsByTopic, setModelParamsByTopic] = useState({});
  // Set default left panel width starting at the minimum boundary (20%)
  const [leftPanelWidth, setLeftPanelWidth] = useState(20); // percentage within 20 - 80
  const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const dragCounter = useRef(0);
  const [dragActive, setDragActive] = useState(false);

  // Check for vertical layout and fit full viewport height
  useEffect(() => {
    const handleResize = () => {
      setIsVertical(window.innerHeight > window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load chat history and OpenAI key from localStorage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('chatHistory');
    if (storedHistory) {
      const history = JSON.parse(storedHistory);
      setChatHistory(history);
      // We no longer auto-select recent conversation; default stays "New Conversation"
    }
    const storedKey = localStorage.getItem('openaiKey');
    if (storedKey) {
      setOpenaiKey(storedKey);
    }
  }, []);

  // Handle send message with streaming response from OpenAI
  const handleSendMessage = async () => {
    if (message.trim() === '') return;
    let topic = selectedConversation;
    // If it's a new conversation, use the first message as the conversation title
    if (selectedConversation === "New Conversation") {
      let title = message.trim();
      if (title.length > 20) {
        title = title.substring(0, 20) + "...";
      }
      topic = title;
      setSelectedConversation(title);
    }
    const userMessage = {
      id: Date.now(),
      content: message,
      sender: 'user',
      topic,
    };

    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    setMessage('');

    // Append a placeholder for the streaming AI response.
    const aiMessageId = Date.now() + 1;
    const placeholderAIMessage = {
      id: aiMessageId,
      content: '',
      sender: 'ai',
      topic,
    };
    setChatHistory(prev => [...prev, placeholderAIMessage]);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: userMessage.content }],
          stream: true,
        }),
      });
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let accumulatedText = "";
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          accumulatedText += decoder.decode(value, { stream: !done });
          // Update the AI message in chatHistory with the streamed content.
          setChatHistory(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, content: accumulatedText } : msg
          ));
        }
      }
      // Save the final chatHistory to localStorage.
      localStorage.setItem('chatHistory', JSON.stringify([...updatedHistory, { id: aiMessageId, content: accumulatedText, sender: 'ai', topic }]));
    } catch (error) {
      console.error('Error fetching AI response:', error);
      // On error, update the placeholder with error message.
      setChatHistory(prev => prev.map(msg => 
        msg.id === aiMessageId ? { ...msg, content: "Error: " + error.message } : msg
      ));
    }
  };

  // Build conversation summaries: title and latest time (for messages in the last 7 days)
  const conversationMap = {};
  chatHistory.forEach(msg => {
    const msgTime = new Date(msg.id);
    if (Date.now() - msgTime.getTime() <= 7 * 24 * 60 * 60 * 1000) {
      const topic = msg.topic || msgTime.toLocaleDateString();
      if (!conversationMap[topic] || msg.id > conversationMap[topic].time) {
        conversationMap[topic] = { time: msg.id, title: topic };
      }
    }
  });
  const conversationEntries = Object.entries(conversationMap).sort((a, b) => b[1].time - a[1].time);

  // Filter messages by selected conversation
  const filteredMessages = chatHistory.filter(msg => {
    const msgTopic = msg.topic || new Date(msg.id).toLocaleDateString();
    return msgTopic === selectedConversation;
  });

  // Handle opening modal to edit model parameters for a conversation topic
  const openModalForTopic = (topic) => {
    setEditingTopic(topic);
    if (!modelParamsByTopic[topic]) {
      setModelParamsByTopic(prev => ({
        ...prev,
        [topic]: {
          title: '',
          modelName: selectedModel,
          maxTokenIn: 2048,
          maxTokenOut: 256,
        }
      }));
    }
    setModalOpen(true);
  };

  // Handle parameter changes
  const handleParamChange = (field, value) => {
    setModelParamsByTopic(prev => ({
      ...prev,
      [editingTopic]: {
        ...prev[editingTopic],
        [field]: value,
      }
    }));
  };

  const saveModal = () => {
    setModalOpen(false);
    setEditingTopic(null);
  };

  // Adjustable divider logic
  const isDragging = useRef(false);
  const startDragging = (e) => {
    isDragging.current = true;
    e.preventDefault();
  };
  const stopDragging = () => {
    isDragging.current = false;
  };
  const handleDrag = (e) => {
    if (!isDragging.current || !containerRef.current) return;
    const containerWidth = containerRef.current.getBoundingClientRect().width;
    let newLeftWidth = (e.clientX / containerWidth) * 100;
    // enforce boundaries (min 20%, max 80%)
    if (newLeftWidth < 20) newLeftWidth = 20;
    if (newLeftWidth > 80) newLeftWidth = 80;
    setLeftPanelWidth(newLeftWidth);
  };
  useEffect(() => {
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', stopDragging);
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', stopDragging);
    };
  }, []);

  // File drag and drop in conversation window
  const handleDragOver = (e) => {
    e.preventDefault();
    dragCounter.current++;
    if (!dragActive) setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    dragCounter.current = 0;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Handle file upload (for demo, we just log the file names)
      console.log('Files uploaded:', [...files].map(file => file.name));
    }
  };

  // Auto-resize textarea with max 3 rows (assuming approximately 20px per row)
  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 60); // 60px max for 3 rows
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  // Handler for creating a new conversation
  const handleNewConversation = () => {
    setSelectedConversation("New Conversation");
    setSelectedModel(defaultModel);
  };

  return (
    <>
      <Head>
        <title>Chat with AI</title>
        <meta name="description" content="Chat with AI using OpenAI's API" />
      </Head>
      <Navbar />
      <div ref={containerRef} className="flex flex-col" style={{ height: "calc(100vh - 67px)" }}>
        <div className="flex flex-1">
          {!isVertical ? (
            // Desktop layout: show aside panel for conversation topics.
            <aside 
              className="p-4 overflow-y-auto bg-secondary" 
              style={{ width: `${leftPanelWidth}%` }}
            >
              {/* Create New Conversation Button with bg-success */}
              <button 
                className="w-full p-2 mb-4 border rounded button-info"
                onClick={handleNewConversation}
              >
                New Conversation
              </button>
              <ul className="list-none p-0 m-0">
                {conversationEntries.map(([topic, { time, title }]) => {
                  const displayTitle = title.length > 20 ? title.substring(0, 20) + "..." : title;
                  return (
                    <li key={topic} 
                        className="group flex items-center justify-between cursor-pointer p-2 my-2 hover:outline hover:outline-1"
                        onClick={() => setSelectedConversation(topic)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{displayTitle}</span>
                        <span className="text-xs text-gray-600">{new Date(time).toLocaleTimeString()}</span>
                      </div>
                      <button 
                        className="invisible group-hover:visible"
                        onClick={(e) => { e.stopPropagation(); openModalForTopic(topic); }}
                      >
                        &#9881;
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>
          ) : null}
          {/* Adjustable divider (only in desktop layout) */}
          {!isVertical && (
            <div 
              className="cursor-col-resize bg-gray-300 opacity-0 hover:opacity-100 transition-opacity"
              style={{ width: "5px" }}
              onMouseDown={startDragging}
            ></div>
          )}
          {/* Right-side panel for chat conversation */}
          <section className="flex-1 flex flex-col border-l" 
            onDragOver={handleDragOver} 
            onDragLeave={handleDragLeave} 
            onDrop={handleDrop}
            style={{ position: 'relative' }}
          >
            {isVertical && !mobileSidebarVisible && (
              <div className="p-4 border-b">
                <button 
                  className="p-2 border rounded"
                  onClick={() => setMobileSidebarVisible(true)}
                >
                  Conversations
                </button>
              </div>
            )}
            {isVertical && mobileSidebarVisible ? (
              <aside 
                className="p-4 overflow-y-auto bg-secondary"
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
              >
                <div className="mb-4">
                  <button 
                    className="p-2 border rounded"
                    onClick={() => setMobileSidebarVisible(false)}
                  >
                    Back
                  </button>
                </div>
                {/* Create New Conversation Button */}
                <button 
                  className="w-full p-2 mb-4 border rounded button-info"
                  onClick={() => { handleNewConversation(); setMobileSidebarVisible(false); }}
                >
                  New Conversation
                </button>
                <ul className="list-none p-0 m-0">
                  {conversationEntries.map(([topic, { time, title }]) => {
                    const displayTitle = title.length > 20 ? title.substring(0, 20) + "..." : title;
                    return (
                      <li key={topic} 
                          className="group flex items-center justify-between cursor-pointer p-2 my-2 hover:outline hover:outline-1"
                          onClick={() => { setSelectedConversation(topic); setMobileSidebarVisible(false); }}
                      >
                        <div className="flex items-center space-x-2">
                          <span>{displayTitle}</span>
                          <span className="text-xs text-gray-600">{new Date(time).toLocaleTimeString()}</span>
                        </div>
                        <button 
                          className="invisible group-hover:visible"
                          onClick={(e) => { e.stopPropagation(); openModalForTopic(topic); }}
                        >
                          &#9881;
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            ) : (
              <>
                <main className="flex-1">
                    <div className="flex-1 overflow-y-auto p-4">
                    {filteredMessages.map((msg) => (
                        <div key={msg.id} className={`mb-4 p-4 rounded max-w-lg border ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}>
                        <p>{msg.content}</p>
                        </div>
                    ))}

                    {dragActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
                        <p className="font-semibold">Drop files to upload</p>
                        </div>
                    )}
                    </div>
                </main>
                <div className="relative p-4 border-t bg-secondary">
                  <textarea

                    ref={textareaRef}
                    className="w-full border rounded p-2 pr-12 resize-none overflow-hidden"
                    placeholder={openaiKey ? "Type your message..." : "please enter your open ai api key before using"}
                    value={message}
                    onChange={handleTextareaChange}
                    style={{ maxHeight: "60px" }}
                  />
                  <button
                    className="absolute right-7 top-7 border rounded p-1 button-info"
                    onClick={handleSendMessage}
                    disabled={!openaiKey}
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-4 border rounded bg-secondary">
            <h2 className="mb-4">Model Parameters</h2>
            <div className="mb-2">
              <label className="block mb-1">Title:</label>
              <input
                type="text"
                value={modelParamsByTopic[editingTopic]?.title || ''}
                onChange={(e) => handleParamChange('title', e.target.value)}
                className="w-full border rounded p-1"
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Model Name:</label>
              <input
                type="text"
                value={modelParamsByTopic[editingTopic]?.modelName || ''}
                onChange={(e) => handleParamChange('modelName', e.target.value)}
                className="w-full border rounded p-1"
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Max Token In:</label>
              <input
                type="number"
                value={modelParamsByTopic[editingTopic]?.maxTokenIn || 2048}
                onChange={(e) => handleParamChange('maxTokenIn', e.target.value)}
                className="w-full border rounded p-1"
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Max Token Out:</label>
              <input
                type="number"
                value={modelParamsByTopic[editingTopic]?.maxTokenOut || 256}
                onChange={(e) => handleParamChange('maxTokenOut', e.target.value)}
                className="w-full border rounded p-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button className="border rounded p-1 button-secondary" onClick={() => { setModalOpen(false); setEditingTopic(null); }}>
                Cancel
              </button>
              <button className="border rounded p-1 button-info" onClick={saveModal}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
