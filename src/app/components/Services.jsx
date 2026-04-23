import { motion } from 'motion/react';
import { Shield, FileCheck, Map, ArrowRightLeft } from 'lucide-react';

const services = [
  {
    icon: Shield,
    title: 'Authenticity Verification',
    description: 'Using unique Land Codes to prevent fraud and ensure property legitimacy through secured records.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: FileCheck,
    title: 'Digital Registration',
    description: 'Automated workflow for Titre Foncier with transparent 30-day investigation process and MINDCAF compliance.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Map,
    title: 'Cadastral Mapping',
    description: 'Matterport & GPS integration for precise boundary determination and 3D property visualization.',
    color: 'from-amber-500 to-amber-600',
  },
  {
    icon: ArrowRightLeft,
    title: 'Secure Transfer',
    description: 'Notary-verified land ownership exchange with digital signatures and immutable transaction records.',
    color: 'from-purple-500 to-purple-600',
  },
];

export default function Services() {
  return (
    <section id="services" className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#002147] rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-block px-6 py-2 bg-[#002147]/5 rounded-full border border-[#002147]/10 mb-4"
          >
            <span className="text-[#D4AF37] tracking-widest text-sm">OUR SERVICES</span>
          </motion.div>
          <h2 className="text-5xl lg:text-6xl text-[#002147] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Complete Land Management
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            End-to-end digital solutions for secure, transparent, and efficient property rights management
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative"
              >
                <div className="relative h-full p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl text-[#002147] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                    {service.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* Learn More Link */}
                  <motion.div
                    className="flex items-center gap-2 text-[#D4AF37] group-hover:gap-4 transition-all duration-300"
                  >
                    <span className="text-sm tracking-wide">Learn More</span>
                    <motion.svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="group-hover:translate-x-1 transition-transform duration-300"
                    >
                      <path
                        d="M6 3L11 8L6 13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  </motion.div>

                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#D4AF37]/5 to-transparent rounded-bl-full" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
