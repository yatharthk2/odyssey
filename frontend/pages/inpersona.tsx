import React from 'react';
import Link from 'next/link';

const Inpersona = () => {
  return (
    <div className="min-h-screen bg-white">
      <nav className="p-4">
        <Link href="/" className="whitespace-nowrap font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          Home
        </Link>
      </nav>
      <main className="flex justify-center items-center h-screen">
        <h1 className="text-4xl font-bold text-black">Hello World</h1>
      </main>
    </div>
  );
};

export default Inpersona; 