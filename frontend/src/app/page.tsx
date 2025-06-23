import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { AIAgentShowcase } from '@/components/landing/ai-agent-showcase';
import { Marketplace } from '@/components/landing/marketplace';
import { Testimonials } from '@/components/landing/testimonials';
import { CTA } from '@/components/landing/cta';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex flex-col">
        <Hero />
        <Features />
        <AIAgentShowcase />
        <Marketplace />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
