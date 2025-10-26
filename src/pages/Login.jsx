import React, { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import ReactMarkdown from 'react-markdown'
import helpContent from './help.md?raw'
import LoginForm from './LoginForm'
import Register from './Register'
import packageJson from '../../package.json'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [helpOpen, setHelpOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()

  function handleToggleMode() {
    setMode(mode === 'login' ? 'register' : 'login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-3 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg hover:shadow-xl transition"
        aria-label="Toggle dark mode"
      >
        {isDark ? (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>
        <div className="card max-w-md w-full">
          <div className="flex justify-center mb-6">
            <img src="/CeraLoop.png" alt="CeraLoop" className="h-24" />
          </div>

          {mode === 'login' ? (
            <LoginForm 
              onToggleMode={handleToggleMode} 
              onOpenHelp={() => setHelpOpen(true)} 
            />
          ) : (
            <Register 
              onToggleMode={handleToggleMode} 
              onOpenHelp={() => setHelpOpen(true)} 
            />
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400 text-center my-6 border-t pt-4 border-blue-600 dark:border-blue-400">
            <a 
              href="https://lad.saras.uniroma1.it/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 flex flex-col items-center gap-2"
            >
              <img src="/LAD-logo.png" alt="LAD Logo" className="h-10" />
              LAD: Laboratorio di Archeologia Digitale alla Sapienza
            </a>
            <span className="block mt-2 text-xs text-gray-500 dark:text-gray-500">
              CeraLoop v{packageJson.version}
            </span>
          </p>
        </div>
      </div>
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setHelpOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-base font-semibold dark:text-gray-100">Help</h4>
              <button
                onClick={() => setHelpOpen(false)}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                aria-label="Close help"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <div className="prose prose-indigo max-w-none dark:prose-invert text-gray-900 dark:text-gray-100">
                <ReactMarkdown>{helpContent}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
