import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Logo from './shared/Logo';

export default function Navbar({ onLoginClick }) {
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      setIsScrolled(window.scrollY > 20);
    });
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/">
            <Logo variant={isScrolled ? "light" : "dark"} />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {['Home', 'Services', 'About', 'Cadastre', 'Contact'].map((item, index) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={`relative transition-colors duration-300 text-sm tracking-wide ${
                  isScrolled ? 'text-[#002147]' : 'text-white'
                } hover:text-[#D4AF37]`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                whileHover={{ y: -2 }}
              >
                {item}
                <motion.span
                  className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#D4AF37]"
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
          </div>

          {/* Login Button */}
          <Link to="/login">
            <motion.button
              className="relative overflow-hidden px-8 py-3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F4C430] text-[#002147] shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <span className="relative z-10 tracking-wide">Login</span>
              <motion.div
                className="absolute inset-0 bg-white"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
                style={{ opacity: 0.2 }}
              />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
