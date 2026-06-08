import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './auth/AuthContext'
import { NotificationsProvider } from './notifications/NotificationsContext'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <AppRoutes />
          <ToastContainer
            position="bottom-right"
            autoClose={3500}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            pauseOnHover
            draggable
            limit={3}
            theme="light"
            toastClassName="eam-toast"
            progressClassName="eam-toast-progress"
          />
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
