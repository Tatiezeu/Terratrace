import { motion } from 'motion/react';
import { Mail, Phone, MapPin } from 'lucide-react';
import Logo from './shared/Logo';

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);
const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-[#002147] to-[#001530] text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 py-16 border-b border-white/10">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <Logo variant="dark" />
            </div>
            <p className="text-white/70 leading-relaxed mb-6">
              Revolutionizing land management across Cameroon with secure, transparent digital solutions.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: FacebookIcon, href: '#' },
                { Icon: TwitterIcon, href: '#' },
                { Icon: LinkedinIcon, href: '#' },
                { Icon: InstagramIcon, href: '#' },
              ].map((social, index) => {
                const { Icon } = social;
                return (
                  <motion.a
                    key={index}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-[#D4AF37] hover:border-[#D4AF37] transition-all duration-300"
                  >
                    <Icon />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>


          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <h4 className="text-lg mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Quick Links
            </h4>
            <ul className="space-y-3">
              {['Home', 'Services', 'About', 'Cadastre', 'Contact', 'Privacy Policy', 'Terms of Service'].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase().replace(/ /g, '-')}`}
                    className="text-white/70 hover:text-[#D4AF37] transition-colors duration-300 inline-block hover:translate-x-1"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h4 className="text-lg mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Services
            </h4>
            <ul className="space-y-3">
              {[
                'Authenticity Verification',
                'Digital Registration',
                'Cadastral Mapping',
                'Secure Transfer',
                'Property Search',
                'Legal Support',
              ].map((service) => (
                <li key={service}>
                  <a
                    href="#services"
                    className="text-white/70 hover:text-[#D4AF37] transition-colors duration-300 inline-block hover:translate-x-1"
                  >
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h4 className="text-lg mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Contact Info
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#D4AF37] mt-1 flex-shrink-0" />
                <span className="text-white/70">
                  MINDCAF Building,<br />Yaoundé, Cameroon
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                <a href="tel:+237687381797" className="text-white/70 hover:text-[#D4AF37] transition-colors">
                  +237 687 38 17 97
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                <a href="mailto:terratrace26@gmail.com" className="text-white/70 hover:text-[#D4AF37] transition-colors">
                  terratrace26@gmail.com
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white/60 text-sm">
          <p>
            © {currentYear} TerraTrace. All rights reserved.
          </p>
          <p className="flex items-center gap-2">
            <span>Powered by</span>
            <span className="text-[#D4AF37]">MINDCAF</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
