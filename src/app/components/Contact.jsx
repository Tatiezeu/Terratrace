import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission logic here
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contact" className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#002147] rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl" />
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
            <span className="text-[#D4AF37] tracking-widest text-sm">GET IN TOUCH</span>
          </motion.div>
          <h2 className="text-5xl lg:text-6xl text-[#002147] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Contact Us
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions about land registration? Our team is ready to assist you
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-3xl text-[#002147] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                Let's Talk About Your Property
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Whether you're registering new land, verifying ownership, or transferring property,
                our experts are here to guide you through every step of the process.
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  icon: Phone,
                  title: 'Phone',
                  content: '+237 6 87 38 17 97',
                  color: 'from-blue-500 to-blue-600',
                },
                {
                  icon: Mail,
                  title: 'Email',
                  content: 'terratrace26@gmail.com',
                  color: 'from-emerald-500 to-emerald-600',
                },
                {
                  icon: MapPin,
                  title: 'Office',
                  content: 'MINDCAF Building, Yaoundé, Cameroon',
                  color: 'from-amber-500 to-amber-600',
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.4 }}
                    className="flex items-start gap-4 group"
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-[#002147] mb-1">{item.title}</h4>
                      <p className="text-gray-600">{item.content}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Office Hours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-br from-[#002147] to-[#003d7a] rounded-2xl p-8 text-white"
            >
              <h4 className="text-xl mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Office Hours
              </h4>
              <div className="space-y-2 text-white/80">
                <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                <p>Saturday: 9:00 AM - 1:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-[#002147] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all duration-300"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-[#002147] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all duration-300"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-[#002147] mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all duration-300"
                  placeholder="Land Registration Inquiry"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-[#002147] mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all duration-300 resize-none"
                  placeholder="Tell us about your inquiry..."
                  required
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#F4C430] text-[#002147] rounded-xl hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <span className="tracking-wide">Send Message</span>
                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
