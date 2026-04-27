import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = Math.random() * 2 + 1;
        this.color = `hsla(${Math.random() * 60 + 180}, 100%, 70%, ${Math.random() * 0.5 + 0.2})`;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    for (let i = 0; i < 80; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(p => p.update());
      particles.forEach(p => p.draw());

      // Draw connections (collisions/bonds)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${1 - dist/100})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'var(--bg-primary)' }}
    />
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await api.login(username, password);
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <ParticleBackground />
      <div className="w-full max-w-md animate-scale-in relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center p-2"
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              boxShadow: '0 0 40px rgba(6, 182, 212, 0.5)',
            }}
          >
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1
            className="text-2xl font-bold tracking-wider"
            style={{ color: 'var(--text-primary)' }}
          >
            NÜRDAM
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Cleanroom Management System
          </p>
        </div>

        {/* Login card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <h2
            className="text-lg font-semibold mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            Sign in to your account
          </h2>

          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm animate-fade-in"
              style={{
                background: 'var(--accent-rose-dim)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fda4af',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent-cyan)';
                  e.target.style.boxShadow = '0 0 0 3px var(--accent-cyan-dim)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent-cyan)';
                  e.target.style.boxShadow = '0 0 0 3px var(--accent-cyan-dim)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background: isLoading
                  ? 'var(--border-color)'
                  : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                color: 'white',
                border: 'none',
                boxShadow: isLoading ? 'none' : 'var(--shadow-glow-cyan)',
              }}
              onMouseEnter={(e) => {
                if (!isLoading)
                  e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: 'rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                    }}
                  />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p
          className="text-center mt-6 text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          Contact your administrator for access credentials
        </p>
      </div>
    </div>
  );
}
