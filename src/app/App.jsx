import { useState } from 'react';
import Navbar from './components/Navbar';
import HeroCarousel from './components/HeroCarousel';
import Services from './components/Services';
import About from './components/About';
import InteractiveMap from './components/InteractiveMap';
import Contact from './components/Contact';
import Footer from './components/Footer';
import RegistrationModal from './components/RegistrationModal';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navbar onLoginClick={() => setIsModalOpen(true)} />
      <HeroCarousel />
      <Services />
      <About />
      <InteractiveMap />
      <Contact />
      <Footer />
      <RegistrationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
