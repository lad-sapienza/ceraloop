import React from 'react'
import AuthImage from './AuthImage'

// Draggable Image Panel Component
export default function ImagePanel({ 
  match, 
  index, 
  isGrayed, 
  onToggleGray, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  onDragEnd,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className="space-y-2 bg-white dark:bg-slate-800 rounded-lg p-3 shadow-md border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-move"
    >
      {/* <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{match.key} | {match.basename}</p> */}
      <div className={`relative ${isGrayed ? 'opacity-30 grayscale' : ''} transition-all duration-300`}>
        <AuthImage 
          filename={match.filename}
          alt={`${match.key}: ${match.basename}`}
          className="w-64 h-auto rounded-lg"
        />
      </div>
      <div className="flex gap-2 pt-2">
        {/* Move Left Button */}
        {!isFirst && (
          <button
            onClick={() => onMoveUp(index)}
            className="px-3 py-2 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
            title="Move left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        {/* Move Right Button */}
        {!isLast && (
          <button
            onClick={() => onMoveDown(index)}
            className="px-3 py-2 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
            title="Move right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        
        {/* Enable/Disable Button */}
        <button
          onClick={() => onToggleGray(index)}
          className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
            isGrayed 
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {isGrayed ? 'Include' : 'Discard'}
        </button>
      </div>
    </div>
  )
}
