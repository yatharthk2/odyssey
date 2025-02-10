import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';

const Inpersona = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Inpersona</h1>
        {/* Add your Inpersona page content here */}
        <p className="text-lg">Welcome to the Inpersona page!</p>
      </main>
      <Footer />
    </div>
  );
};

export default Inpersona; 