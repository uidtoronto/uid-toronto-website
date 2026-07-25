import { useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import MissionVisionSection from '../components/MissionVisionSection';
import BYKSection from '../components/BYKSection';
import WorksPreviewSection from '../components/WorksPreviewSection';
import HomeEventsSection from '../components/HomeEventsSection';
import HomeNewsSection from '../components/HomeNewsSection';
import MembershipSection from '../components/MembershipSection';
import FAQSection from '../components/FAQSection';
import NewsletterSection from '../components/NewsletterSection';
import Footer from '../components/Footer';
import DonationThankYouBanner from '../components/DonationThankYouBanner';

export default function Home() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <>
      <DonationThankYouBanner />
      <HeroSection />
      <section id="about">
        <MissionVisionSection />
      </section>
      <BYKSection />
      <WorksPreviewSection />
      <HomeEventsSection />
      <HomeNewsSection />
      <MembershipSection />
      <FAQSection />
      <NewsletterSection />
      <Footer />
    </>
  );
}
