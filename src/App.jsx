import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Report from './pages/Report'
import AboutMe from './pages/AboutMe'
import Help from './pages/Help'
import Toaster from './components/Toaster'

function RequireAuth({ children }) {
  const token = localStorage.getItem('directus_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/report"
          element={
            <RequireAuth>
              <Report />
            </RequireAuth>
          }
        />
        <Route
          path="/about"
          element={
            <RequireAuth>
              <AboutMe />
            </RequireAuth>
          }
        />
        <Route
          path="/help"
          element={
            <RequireAuth>
              <Help />
            </RequireAuth>
          }
        />
      </Routes>
      <Toaster />
    </>
  )
}
