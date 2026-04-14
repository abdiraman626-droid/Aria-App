import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RemindersProvider } from './context/RemindersContext';
import { TeamProvider } from './context/TeamContext';
import { LangProvider } from './context/LangContext';
import { TourProvider } from './context/TourContext';
import { CalendarProvider } from './context/CalendarContext';
import Tour from './components/Tour';

import Landing       from './pages/Landing';
import CalendarPage  from './pages/CalendarPage';
import Login      from './pages/Login';
import Signup     from './pages/Signup';
import Join       from './pages/Join';
import Dashboard  from './pages/Dashboard';
import Reminders  from './pages/Reminders';
import Voice      from './pages/Voice';
import Settings   from './pages/Settings';
import Team       from './pages/Team';
import Clients    from './pages/Clients';
import Meetings   from './pages/Meetings';
import AdminLogin     from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import VerifyEmail    from './pages/VerifyEmail';
import ClientPortal   from './pages/ClientPortal';
import Help           from './pages/Help';
import Privacy        from './pages/Privacy';
import Terms          from './pages/Terms';
import Cookies        from './pages/Cookies';

function Spinner() {
  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// Blocks ALL route rendering until Firebase resolves the session on refresh
function AuthGate({ children }) {
  const { loading } = useAuth();
  if (loading) return <Spinner />;
  return children;
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const isAdmin = sessionStorage.getItem('aria_admin') === '1';
  return isAdmin ? children : <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <RemindersProvider>
          <TeamProvider>
            <CalendarProvider>
            <TourProvider>
            <BrowserRouter>
              <AuthGate>
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: 'var(--bg-card)',
                    color: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    fontSize: 14,
                    fontFamily: 'var(--font-body)',
                    padding: '12px 18px',
                  },
                  success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
                  error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                }}
              />
              <Routes>
                {/* Public */}
                <Route path="/"       element={<Landing />} />
                <Route path="/login"  element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/join"   element={<Join />} />
                <Route path="/portal"  element={<ClientPortal />} />
                <Route path="/help"    element={<PrivateRoute><Help /></PrivateRoute>} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms"   element={<Terms />} />
                <Route path="/cookies" element={<Cookies />} />

                {/* Admin */}
                <Route path="/admin"           element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

                {/* Protected app */}
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/reminders" element={<PrivateRoute><Reminders /></PrivateRoute>} />
                <Route path="/voice"     element={<PrivateRoute><Voice /></PrivateRoute>} />
                <Route path="/settings"  element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="/team"      element={<PrivateRoute><Team /></PrivateRoute>} />
                <Route path="/clients"   element={<PrivateRoute><Clients /></PrivateRoute>} />
                <Route path="/calendar"  element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
                <Route path="/meetings"  element={<PrivateRoute><Meetings /></PrivateRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Tour />
              </AuthGate>
            </BrowserRouter>
            </TourProvider>
            </CalendarProvider>
          </TeamProvider>
        </RemindersProvider>
      </AuthProvider>
    </LangProvider>
  );
}
