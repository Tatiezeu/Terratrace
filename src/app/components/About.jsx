import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

const features = [
  'MINDCAF Digital Transformation',
  '30-Day Investigation Transparency',
  'Secured Records',
  'Real-Time Status Tracking',
];

export default function About() {
  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1760502431557-2976b538959b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMGRldmVsb3BtZW50JTIwc2t5bGluZSUyMG1vZGVybiUyMGNpdHl8ZW58MXx8fHwxNzc2MTc3NDI0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Modern urban development"
                className="w-full h-[600px] object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#002147]/60 to-transparent" />

              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-md rounded-xl p-6 shadow-xl"
              >
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl text-[#002147]" style={{ fontFamily: 'var(--font-display)' }}>
                      15K+
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Properties</div>
                  </div>
                  <div>
                    <div className="text-3xl text-[#002147]" style={{ fontFamily: 'var(--font-display)' }}>
                      99.9%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Accuracy</div>
                  </div>
                  <div>
                    <div className="text-3xl text-[#002147]" style={{ fontFamily: 'var(--font-display)' }}>
                      24/7
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Support</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Decorative accent */}
            <div className="absolute -top-6 -right-6 w-32 h-32 border-4 border-[#D4AF37] rounded-2xl -z-10" />
          </motion.div>

          {/* Content Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="inline-block px-6 py-2 bg-[#002147]/5 rounded-full border border-[#002147]/10 mb-6"
              >
                <span className="text-[#D4AF37] tracking-widest text-sm">ABOUT TERRATRACE</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-4xl lg:text-5xl text-[#002147] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Digital Transformation of Land Management
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-lg text-gray-600 leading-relaxed mb-8"
              >
                TerraTrace revolutionizes the MINDCAF process by digitizing land registration,
                verification, and transfer. Our platform ensures transparency throughout the
                30-day investigation period, providing real-time updates and blockchain-secured
                documentation for all stakeholders.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="text-lg text-gray-600 leading-relaxed mb-8"
              >
                By integrating advanced GPS mapping, Matterport 3D visualization, and cryptographic
                land codes, we eliminate fraud while accelerating the property rights formalization
                process across Africa.
              </motion.p>
            </div>

            {/* Features List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors duration-300">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <span className="text-[#002147] text-lg">{feature}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1 }}
            >
              <button className="px-8 py-4 bg-[#002147] text-white rounded-full hover:bg-[#003d7a] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-3">
                <span>Explore Our Process</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
