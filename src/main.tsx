import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Login from './pages/Login.tsx'
import Signup from './pages/Signup.tsx'
import TemplateRegistration from './pages/TemplateRegistration.tsx'
import MyTemplates from './pages/MyTemplates.tsx'
import WrongNotes from './pages/WrongNotes.tsx'
import WrongNoteDetail from './pages/WrongNoteDetail.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
          <Route
            path="/template-registration"
            element={
              <ProtectedRoute>
                <TemplateRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-templates"
            element={
              <ProtectedRoute>
                <MyTemplates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wrong-notes"
            element={
              <ProtectedRoute>
                <WrongNotes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wrong-notes/:id"
            element={
              <ProtectedRoute>
                <WrongNoteDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
