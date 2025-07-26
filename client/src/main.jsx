import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './style.css'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { MessageProvider } from './contexts/MessageContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MessageProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MessageProvider>
  </StrictMode>
);
