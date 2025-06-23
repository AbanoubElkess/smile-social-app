'use client';

export function CTA() {
  const handleSignUp = () => {
    alert('Sign Up functionality will be implemented with full authentication system');
  };

  const handleLearnMore = () => {
    // Scroll to features section
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
        <p className="text-xl mb-8">
          Join thousands of users already using SMILE to enhance their social media experience
        </p>
        <div className="flex justify-center space-x-4">
          <button 
            onClick={handleSignUp}
            className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            Sign Up Free
          </button>
          <button 
            onClick={handleLearnMore}
            className="border border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-purple-600 transition-colors transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}
