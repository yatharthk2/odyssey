// 'use client';

// import { useEffect, useRef } from 'react';
// import Link from 'next/link';

// export default function KnowledgeGraph() {
//   const iframeRef = useRef<HTMLIFrameElement>(null);

//   useEffect(() => {
//     // Add any initialization logic for the Knowledge Graph here
//     const iframe = iframeRef.current;
//     if (iframe) {
//       iframe.onload = () => {
//         // You can add message passing between parent and iframe here if needed
//         console.log('Knowledge Graph loaded');
//       };
//     }
//   }, []);

//   return (
//     <div className="min-h-screen flex flex-col">
//       {/* Navigation */}
//       <nav className="p-4 flex justify-between items-center border-b">
//         <Link 
//           href="/" 
//           className="whitespace-nowrap font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
//         >
//           Home
//         </Link>
//         <h1 className="text-xl font-bold text-gray-800">Knowledge Graph Playground</h1>
//         <div className="w-20"></div> {/* Spacer for centering */}
//       </nav>

//       {/* Graph Container */}
//       <div className="flex-1 w-full">
//         <iframe
//           ref={iframeRef}
//           src="/kg.html"
//           className="w-full h-full min-h-[calc(100vh-64px)]"
//           style={{ border: 'none' }}
//         />
//       </div>
//     </div>
//   );
// }
