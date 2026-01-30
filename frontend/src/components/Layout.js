import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3, LayoutDashboard, Upload, FileText, Shield, LogOut } from 'lucide-react';

export default function Layout({ children, user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/upload', label: 'Upload', icon: Upload },
    { path: '/analysis', label: 'Analysis', icon: FileText },
  ];

  if (user?.is_admin) {
    navItems.push({ path: '/admin', label: 'Admin', icon: Shield });
  }

  return (
    <div className="min-h-screen flex" data-testid="layout">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col" data-testid="sidebar">
        {/* Logo */}
        <div className="p-6 border-b">
          <Link to="/dashboard" className="flex items-center space-x-2" data-testid="logo-link">
            <div className="h-10 w-10 bg-primary rounded-md flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight font-heading">SentiMapper</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2" data-testid="navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? 'default' : 'ghost'}
                  className="w-full justify-start h-11"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="mr-3 h-5 w-5" strokeWidth={1.5} />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t" data-testid="user-info">
          <div className="mb-3">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start h-10"
            onClick={onLogout}
            data-testid="logout-button"
          >
            <LogOut className="mr-3 h-4 w-4" strokeWidth={1.5} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto" data-testid="main-content">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}