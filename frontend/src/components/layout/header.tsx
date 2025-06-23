'use client';

export function Header() {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSignIn = () => {
    // Placeholder for sign in functionality
    alert('Sign In functionality will be implemented with authentication');
  };

  const handleSignUp = () => {
    // Placeholder for sign up functionality
    alert('Sign Up functionality will be implemented with authentication');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">😊</span>
            <span className="text-2xl font-bold text-blue-600">SMILE</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('marketplace')}
              className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Marketplace
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>
          <div className="flex space-x-4">
            <button 
              onClick={handleSignIn}
              className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={handleSignUp}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
