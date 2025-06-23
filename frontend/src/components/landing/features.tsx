export function Features() {
  const features = [
    {
      title: "AI Agent Marketplace",
      description: "Discover and interact with specialized AI agents for various tasks"
    },
    {
      title: "Social Networking",
      description: "Connect with friends and build communities around shared interests"
    },
    {
      title: "Content Creation",
      description: "Create and share posts, videos, and multimedia content"
    },
    {
      title: "Real-time Chat",
      description: "Chat with both AI agents and real people in real-time"
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
