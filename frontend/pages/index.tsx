import { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Seo, { SITE_URL } from '../components/Seo';
import SectionCard from '../components/primitives/SectionCard';
import SectionHeading from '../components/primitives/SectionHeading';
import Hero from './components/Hero';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Achievements from './components/Achievements';
import Projects from './components/Projects';
import Testimonials from './components/Testimonials';
import ContactModal from './components/ContactModal';
import config from '../types/config';

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: config.site.name,
  url: SITE_URL,
  jobTitle: 'AI/ML Engineer',
  sameAs: [config.footer.github, config.footer.linkedin, config.footer.twitter],
};

export default function Home() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { contact } = config;

  return (
    <Layout>
      <Seo
        title="Yatharth Kapadia · AI/ML Engineer"
        description="Portfolio of Yatharth Kapadia, AI/ML engineer in San Francisco. Production LLM and RAG systems — and Inpersona, a self-hosted AI chatbot that answers questions as him."
      />
      <Head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </Head>
      <Hero />

      {/* Proof of work before claims of skill: Experience and Projects lead,
          the skills wall follows. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AboutSection />

        <Experience />
        <Projects />
        <Skills />
        <Achievements />
      </div>

      {/* Full-bleed contrast band — the one section that breaks the page
          container, so the long run of open sections has a visual anchor. */}
      <Testimonials />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionCard id="contact" compact>
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <SectionHeading className="mb-6 sm:mb-8">{contact.title}</SectionHeading>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 sm:mb-12 text-base sm:text-lg text-gray-700 dark:text-gray-300"
            >
              {contact.description}
            </motion.p>
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsContactModalOpen(true)}
              className="inline-block rounded-full bg-gray-900 text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 px-8 py-4 font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              {contact.ctaLabel}
            </motion.button>
          </div>
        </SectionCard>
      </div>

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </Layout>
  );
}

function AboutSection() {
  const { about } = config;
  return (
    <SectionCard id="about" compact>
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeading className="mb-8 sm:mb-12">{about.title}</SectionHeading>
        <div className="grid grid-cols-1 items-center gap-8 sm:gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4 sm:space-y-6"
          >
            <p className="text-base sm:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
              {about.primary}
            </p>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              {about.secondary}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative mt-8 md:mt-0"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800 opacity-30 blur-lg" />
            <img
              src={about.image}
              alt={about.title}
              className="relative rounded-2xl shadow-lg dark:opacity-90"
            />
          </motion.div>
        </div>
      </div>
    </SectionCard>
  );
}
