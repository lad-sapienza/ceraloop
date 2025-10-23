import React from 'react'
import Navbar from '../components/Navbar'
import ReactMarkdown from 'react-markdown'
import helpContent from './help.md?raw'
import Footer from '../components/Footer'

export default function Help() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 px-8 pb-8">
        <main>
          <div className="card w-full max-w-4xl mx-auto">
            <h3 className="text-2xl font-semibold mb-4 dark:text-gray-100">Help</h3>
            <div className="prose prose-indigo max-w-none dark:prose-invert text-gray-900 dark:text-gray-100">
              <ReactMarkdown>{helpContent}</ReactMarkdown>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
