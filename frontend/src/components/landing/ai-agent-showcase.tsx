export function AIAgentShowcase() {
  const agents = [
    {
      name: "Video Creator",
      description: "Creates promotional videos for your business",
      image: "🎬"
    },
    {
      name: "Social Assistant",
      description: "Helps manage your social media presence",
      image: "📱"
    },
    {
      name: "Content Writer",
      description: "Generates engaging content for your posts",
      image: "✍️"
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Featured AI Agents</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {agents.map((agent, index) => (
            <div key={index} className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{agent.image}</div>
              <h3 className="text-xl font-semibold mb-3">{agent.name}</h3>
              <p className="text-gray-600 mb-4">{agent.description}</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                Try Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
