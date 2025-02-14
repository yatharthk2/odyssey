import React from "react";
import { motion } from "framer-motion";
import { Calendar, Building2, ExternalLink, MapPin } from 'lucide-react';

const Experience = () => {
  const experiences = [
    {
      title: "Machine Learning Intern",
      company: "Outspeed",
      companyUrl: "https://www.outspeed.com/",
      period: "06/2024 – 09/2024",
      location: "San Francisco, CA",
      image: "/companyLogo/Outspeed_2.png"
    },
    {
      title: "Research Assistant",
      company: "DSAIL, Kelley School of Business",
      companyUrl: "https://dsail.kelley.iu.edu/",
      period: "03/2024 – 12/2024",
      location: "Bloomington, IN",
      image: "/companyLogo/DSAIL.jpg"
    },
    {
      title: "Associate Software Intern",
      company: "IDeAS",
      companyUrl: "https://ideas.com/",
      period: "07/2022 – 01/2023",
      location: "Pune, India",
      image: "companyLogo/Ideas_final.png"
    },
    {
      title: "Machine Learning Intern",
      company: "Quidich Innovation Labs",
      companyUrl: "https://www.quidich.com/",
      period: "05/2022 – 06/2022",
      location: "Mumbai, India",
      image: "/companyLogo/Quidich.png"
    },
    {
      title: "Software Engineer Intern",
      company: "Azodha",
      companyUrl: "https://www.azodha.com/",
      period: "09/2021 – 04/2022",
      location: "New York",
      image: "/companyLogo/Azodha.png"
    }
  ];

  return (
    <motion.section 
      id="experience"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl my-20 shadow-xl"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent dark:text-gray-100">
          Experience
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {experiences.map((exp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="group relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Image Container with Gradient Overlay */}
              <div className="relative h-40 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-blue-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                <img
                  src={exp.image}
                  alt={exp.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Experience Content */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {exp.title}
                </h3>
                
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                  <Building2 size={14} />
                  <p className="text-sm">{exp.company}</p>
                </div>

                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <MapPin size={14} />
                  <p className="text-sm">{exp.location}</p>
                </div>
                
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Calendar size={14} />
                  <p className="text-sm">{exp.period}</p>
                </div>

                {/* Company Link */}
                {exp.companyUrl && (
                  <a
                    href={exp.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors mt-3 text-sm"
                  >
                    <ExternalLink size={14} />
                    <span>Visit Company Page</span>
                  </a>
                )}
              </div>

              {/* Decorative Corner Gradient */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-600/20 to-blue-600/20 dark:from-purple-600/10 dark:to-blue-600/10 transform rotate-45 translate-x-8 -translate-y-8" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default Experience;
