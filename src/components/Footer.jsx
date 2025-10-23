import React from 'react'

export default function Footer({ fixed = false }) {
  const currentYear = new Date().getFullYear()
  const yearText = currentYear > 2025 ? `2025–${currentYear}` : '2025'

  return (
    <footer
      className={
        `${fixed ? 'fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md' : 'mt-12'} ` +
        'border-t border-gray-200 dark:border-slate-700'
      }
    >
      <div className="mx-auto px-6 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
        <span className="inline-flex items-center gap-2">
          <img src="/CeraLoop.png" alt="CeraLoop" className="h-5 w-auto" />
          <span>
            © {yearText} <a className="underline hover:no-underline" href="https://lad.saras.uniroma1.it/" target="_blank" rel="noopener noreferrer">LAD: Laboratorio di Archeologia Digitale alla Sapienza</a> ·{' '}
            <a className="underline hover:no-underline" href="mailto:julian.bogdani@uniroma1.it">Julian Bogdani</a>
            {' · '}
            <a className="underline hover:no-underline" href="mailto:lorenzo.cardarelli@uniroma1.it">Lorenzo Cardarelli</a>
            
          </span>
        </span>
      </div>
    </footer>
  )
}
