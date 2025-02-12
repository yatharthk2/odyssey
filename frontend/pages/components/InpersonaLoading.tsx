import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { MessageSquare, Zap, Brain, Sparkles } from 'lucide-react';

const InpersonaLoading = () => {
  const router = useRouter();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Show button after 3 seconds
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 3000);

    // Remove automatic redirect
    return () => clearTimeout(buttonTimer);
  }, []);

  const handleReady = () => {
    router.push('/inpersona');
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
      <div className="relative">
        {/* Large chat bubble background */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-3xl"
          style={{ width: '600px', height: '400px' }}
        />

        {/* Content container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative p-8 text-white text-center"
          style={{ width: '600px' }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
          >
            Initializing Inpersona
          </motion.h2>

          {/* Features with staggered animation */}
          <div className="grid grid-cols-2 gap-6">
            {[
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Real-time Streaming",
                desc: "Lightning-fast responses",
                delay: 1
              },
              {
                icon: <Brain className="w-6 h-6" />,
                title: "Smart Context",
                desc: "Remembers conversations",
                delay: 1.3
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "Knowledge Graph",
                desc: "Enhanced understanding",
                delay: 1.6
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Query Processing",
                desc: "Intelligent transformations",
                delay: 1.9
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: feature.delay }}
                className="flex items-center p-4 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                    {feature.icon}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-gray-300">{feature.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <motion.div
            className="mt-8 h-1 bg-white/20 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 1.5,
                delay: 2.2,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* Ready Button */}
          {showButton && (
            <motion.button
              onClick={handleReady}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              className="mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium shadow-lg relative group"
            >
              {/* Pulse effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-white opacity-20"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              Ready when you are
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default InpersonaLoading;
