import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('nurdam_token');
    const lastActive = localStorage.getItem('nurdam_last_active');
    
    if (storedToken && lastActive) {
      const isIdle = Date.now() - parseInt(lastActive, 10) > 24 * 60 * 60 * 1000;
      
      if (isIdle) {
        // Log out if idle for more than 24 hours
        localStorage.removeItem('nurdam_token');
        localStorage.removeItem('nurdam_last_active');
      } else {
        const payload = decodeJWT(storedToken);
        if (payload && payload.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser({
            id: payload.sub,
            name: payload.name,
            username: payload.username,
            role: payload.role,
            is_boss: payload.is_boss,
          });
          // Update last active
          localStorage.setItem('nurdam_last_active', Date.now().toString());
        } else {
          localStorage.removeItem('nurdam_token');
          localStorage.removeItem('nurdam_last_active');
        }
      }
    } else {
      localStorage.removeItem('nurdam_token');
      localStorage.removeItem('nurdam_last_active');
    }
    setLoading(false);
  }, []);

  // Track user activity to update last_active
  useEffect(() => {
    if (!token) return;
    
    const updateActivity = () => {
      localStorage.setItem('nurdam_last_active', Date.now().toString());
    };

    // Update on click, keydown, and scroll (debounced somewhat implicitly by event rate, but let's just use simple listeners)
    window.addEventListener('click', updateActivity);
    window.addEventListener('keydown', updateActivity);
    
    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, [token]);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem('nurdam_token', newToken);
    localStorage.setItem('nurdam_last_active', Date.now().toString());
    setToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nurdam_token');
    localStorage.removeItem('nurdam_last_active');
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAdmin, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
