export function Marketplace() {
  return (
    <section className="py-16 bg-blue-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">AI Agent Marketplace</h2>
        <p className="text-lg text-gray-600 mb-8">
          Discover thousands of AI agents created by our community
        </p>
        <div className="flex justify-center space-x-4">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Browse Marketplace
          </button>
          <button className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
            Create Agent
          </button>
        </div>
      </div>
    </section>
  );
}
