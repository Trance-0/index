'use client'

import { useState, useEffect } from 'react'
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

function ThemeToggle() {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="relative">
        <button className="p-2 rounded-md border">
          <span className="h-[1.2rem] w-[1.2rem] block"></span>
          <span className="sr-only">Toggle theme</span>
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button 
        className="p-2 rounded-md border"
        onClick={() => setShowThemeMenu(!showThemeMenu)}
      >
        {theme === "dark" ? (
          <Moon className="h-[1.2rem] w-[1.2rem]" />
        ) : (
          <Sun className="h-[1.2rem] w-[1.2rem]" />
        )}
        <span className="sr-only">Toggle theme</span>
      </button>

      {showThemeMenu && (
        <div className="absolute right-0 mt-2 w-36 rounded-md shadow-lg ring-1 ring-opacity-5">
          <div className="py-1 rounded-lg">
            <button
              className="block w-full px-4 py-2 text-sm hover:bg-secondary"
              onClick={() => {
                setTheme("light")
                setShowThemeMenu(false)
              }}
            >
              Light
            </button>
            <button
              className="block w-full px-4 py-2 text-sm hover:bg-secondary"
              onClick={() => {
                setTheme("dark")
                setShowThemeMenu(false)
              }}
            >
              Dark
            </button>
            <button
              className="block w-full px-4 py-2 text-sm hover:bg-secondary"
              onClick={() => {
                setTheme("system")
                setShowThemeMenu(false)
              }}
            >
              System
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="p-4">
      <div className="container mx-auto flex justify-between items-center">
        <a href="/" className="font-bold text-xl transition duration-300">INDEX</a>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="/utils" className="transition duration-300">
            Utils
          </a>
          <a href="https://nextcloud.trance-0.com" className="transition duration-300">
            Files
          </a>
          <a href="https://notenextra.trance-0.com" className="transition duration-300">
            Notes
          </a>
          <a href="https://www.trance-0.com" className="transition duration-300">
            Blogs
          </a>
          <a href="https://github.com/Trance-0/index" className="flex items-center transition duration-300">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            GitHub
          </a>
          
          {/* Theme Toggle */}
          <ThemeToggle />

          <a href="/settings" className="transition duration-300">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </a>
        </div>

        {/* Mobile Navigation Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a href="/utils" className="flex items-center justify-start transition duration-300 py-2">
              Utils
            </a>
            <a href="https://nextcloud.trance-0.com" className="flex items-center justify-start transition duration-300 py-2">
                Files
            </a>
            <a href="https://notenextra.trance-0.com" className="flex items-center justify-start transition duration-300 py-2">
                Notes
            </a>
            <a href="https://www.trance-0.com" className="flex items-center justify-start transition duration-300 py-2">
                Blogs
            </a>
            <a href="https://github.com/Trance-0/index" className="flex items-center justify-start transition duration-300 py-2">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
            
            {/* Mobile Theme Toggle */}
            <div className="flex items-center justify-start transition duration-300 py-2">
              <ThemeToggle />
            </div>

            <a href="/settings" className="flex items-center justify-start transition duration-300 py-2">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}