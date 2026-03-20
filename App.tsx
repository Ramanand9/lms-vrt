import React, { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { LMSProvider, useLMS } from './store';
import { UserRole } from './types';
import Layout from './components/Layout';
import Dashboard from './screens/Dashboard';
import CoursePlayer from './screens/CoursePlayer';
import AdminCourses from './screens/AdminCourses';
import AdminAccess from './screens/AdminAccess';
import Community from './screens/Community';
import AIAdvisor from './screens/AIAdvisor';
import Profile from './screens/Profile';
import Logo from './components/Logo';

type AuthMode = 'login' | 'register-student' | 'register-admin';

const AuthScreen: React.FC<{ defaultMode?: AuthMode }> = ({
  defaultMode = 'login',
}) => {
  const { login, registerStudent, registerAdmin, isSaving } = useLMS();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setMode(defaultMode);
    setError('');
  }, [defaultMode]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
  };

  const title = useMemo(() => {
    if (mode === 'login') {
      return 'Sign In';
    }

    if (mode === 'register-admin') {
      return 'Register Admin';
    }

    return 'Register Student';
  }, [mode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (mode === 'login') {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message ?? 'Login failed');
      }
      return;
    }

    if (mode === 'register-student') {
      const result = await registerStudent(name, email, password);
      if (!result.success) {
        setError(result.message ?? 'Registration failed');
      }
      return;
    }

    const result = await registerAdmin(name, email, password, setupKey);
    if (!result.success) {
      setError(result.message ?? 'Admin registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-xl animate-scaleIn">
        <div className="text-center mb-12">
          <Logo size="xl" />
        </div>

        <div className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
          {isSaving && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadeIn">
              <i className="fas fa-circle-notch fa-spin text-4xl text-nitrocrimson-600 mb-4"></i>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                Processing...
              </p>
            </div>
          )}

          <div className="flex gap-2 mb-8 bg-slate-50 p-2 rounded-2xl">
            <button
              onClick={() => {
                switchMode('login');
              }}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                mode === 'login'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                switchMode('register-student');
              }}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                mode === 'register-student'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Signup Student
            </button>
            <button
              onClick={() => {
                switchMode('register-admin');
              }}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                mode === 'register-admin'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Signup Admin
            </button>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2">{title}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode !== 'login' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-500 outline-none transition-all font-bold text-slate-800"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-500 outline-none transition-all font-bold text-slate-800"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-500 outline-none transition-all font-bold text-slate-800"
                placeholder="Minimum 8 characters"
              />
            </div>

            {mode === 'register-admin' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                  Admin Setup Key
                </label>
                <input
                  type="password"
                  value={setupKey}
                  onChange={(event) => setSetupKey(event.target.value)}
                  required
                  className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-nitrocrimson-500 outline-none transition-all font-bold text-slate-800"
                  placeholder="Enter admin setup key"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold flex items-center animate-shake">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-nitrocrimson-600 shadow-xl shadow-slate-200 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-5 text-xs text-slate-500 font-medium">
            {mode === 'login' ? (
              <>
                New here?{' '}
                <Link to="/signup" className="font-black text-slate-900 hover:text-nitrocrimson-600">
                  Sign up now
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link
                  to="/auth"
                  onClick={() => switchMode('login')}
                  className="font-black text-slate-900 hover:text-nitrocrimson-600"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 animate-fadeIn">
    <Logo size="lg" showTagline={false} className="animate-pulse mb-8" />
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 bg-nitrocrimson-600 rounded-full animate-bounce"></div>
      <div
        className="w-2 h-2 bg-nitrocrimson-600 rounded-full animate-bounce"
        style={{ animationDelay: '200ms' }}
      ></div>
      <div
        className="w-2 h-2 bg-nitrocrimson-600 rounded-full animate-bounce"
        style={{ animationDelay: '400ms' }}
      ></div>
    </div>
    <p className="mt-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">
      Loading session...
    </p>
  </div>
);

const AuthRoute: React.FC = () => {
  const { currentUser } = useLMS();
  const location = useLocation();

  if (currentUser) {
    return <Navigate to={`/${location.search}`} replace />;
  }

  return <AuthScreen defaultMode="login" />;
};

const SignupRoute: React.FC = () => {
  const { currentUser } = useLMS();
  const location = useLocation();

  if (currentUser) {
    return <Navigate to={`/${location.search}`} replace />;
  }

  return <AuthScreen defaultMode="register-student" />;
};

const ProtectedLayoutRoute: React.FC = () => {
  const { currentUser } = useLMS();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to={`/auth${location.search}`} replace />;
  }

  return <Layout />;
};

const AdminOnlyRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { currentUser } = useLMS();

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (currentUser.role !== UserRole.ADMIN) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const StudentOnlyRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { currentUser } = useLMS();

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (currentUser.role !== UserRole.STUDENT) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes: React.FC = () => {
  const { currentUser, isLoading } = useLMS();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthRoute />} />
      <Route path="/signup" element={<SignupRoute />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />

      <Route element={<ProtectedLayoutRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/courses/:courseId" element={<CoursePlayer />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/admin"
          element={
            <AdminOnlyRoute>
              <Navigate to="/admin/courses" replace />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <AdminOnlyRoute>
              <AdminCourses />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/access"
          element={
            <AdminOnlyRoute>
              <AdminAccess />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/ai-advisor"
          element={
            <StudentOnlyRoute>
              <AIAdvisor />
            </StudentOnlyRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={currentUser ? '/' : '/auth'} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <LMSProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.5s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </LMSProvider>
  );
};

export default App;
