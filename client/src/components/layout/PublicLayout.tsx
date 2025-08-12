import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageSquare, Moon, Sun } from 'lucide-react';
import { Button } from '../ui/button';
import { useStore } from '../../store/useStore';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { theme, setTheme } = useStore();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Public Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 w-full border-b bg-white"
      >
        <div className="container flex h-16 items-center px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Prime SMS
            </span>
          </Link>

          <div className="flex-1" />

          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="text-gray-600">
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {/* Auth buttons */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="border-t bg-white"
      >
        <div className="container px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <MessageSquare className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-gray-600">
                © 2025 Prime SMS. All rights reserved.
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <Link to="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Privacy Policy
              </Link>
              <Link to="/refund-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Refund Policy
              </Link>
              <Link to="/support" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Support
              </Link>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}