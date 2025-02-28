'use client';

import { useState, useEffect } from 'react';

const suggestions = [
  "Where are you based Right now?",
  "What projects have you worked on?",
  "What are your technical skills?",
  "How do you approach problem-solving?",
  "What's your experience with AI?",
  "How was your experience at Outspeed",
  "Where do you see yourself in 5 years?"
];

export default function TextRotator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % suggestions.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-24 relative overflow-hidden w-full max-w-2xl mx-auto"> {/* Increased height from h-16 to h-24 */}
      {suggestions.map((text, i) => (
        <div
          key={i}
          className="absolute w-full transition-all duration-500 ease-in-out text-gray-400 text-lg min-h-[6rem] flex items-center justify-center px-8 text-center mx-auto" /* Increased min-height to 6rem */
          style={{
            transform: `translateX(-50%) translateY(${(i - index) * 100}%)`,
            opacity: i === index ? 1 : 0,
            width: '100%',
            maxWidth: '800px',
            left: '50%',
            textAlign: 'center',
            margin: '0 auto',
            lineHeight: '1.5' /* Added line height for better text spacing */
          }}
        >
          <span className="inline-block text-center w-full leading-relaxed">&ldquo;{text}&rdquo;</span>
        </div>
      ))}
    </div>
  );
}
