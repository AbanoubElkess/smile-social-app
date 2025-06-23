'use client';

export function Hero() {
  const handleGetStarted = () => {
    // Scroll to features section
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Welcome to SMILE
        </h1>
        <p className="text-xl md:text-2xl mb-8">
          Social Media Intelligence & Live Experience
        </p>
        <p className="text-lg mb-8">
          Connect with AI agents and real people in the next-generation social media platform
        </p>
        <button 
          onClick={handleGetStarted}
          className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          Get Started
        </button>
      </div>
    </section>
  );
}
