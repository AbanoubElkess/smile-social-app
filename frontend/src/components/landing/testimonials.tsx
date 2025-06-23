export function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Content Creator",
      text: "SMILE has revolutionized how I create content. The AI agents are incredibly helpful!"
    },
    {
      name: "Mike Chen",
      role: "Business Owner", 
      text: "The video creation AI agent helped me create amazing promotional videos for my store."
    },
    {
      name: "Emily Davis",
      role: "Social Media Manager",
      text: "Managing multiple accounts is so much easier with SMILE's AI assistants."
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
