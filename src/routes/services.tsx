import { Container } from "@/components/container";
import { Mic, FileText, BrainCircuit, BarChart } from "lucide-react";

export const Services = () => {
  return (
    <div className="w-full pb-20 pt-32 relative bg-neutral-50 min-h-screen">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Our Services
          </h2>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            Comprehensive tools designed to master every aspect of your interview process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              icon: <Mic className="w-8 h-8 text-blue-500" />,
              title: "AI Mock Interviews",
              description: "Practice with our realistic AI interviewer. Get questions tailored to your job description and experience level.",
              color: "bg-blue-50 border-blue-200"
            },
            {
              icon: <BrainCircuit className="w-8 h-8 text-purple-500" />,
              title: "Instant AI Feedback",
              description: "Receive detailed analysis of your answers. We highlight strong points and areas for improvement instantly.",
              color: "bg-purple-50 border-purple-200"
            },
            {
              icon: <FileText className="w-8 h-8 text-orange-500" />,
              title: "Question Generation",
              description: "Access a vast database of questions generated based on specific tech stacks, roles, and years of experience.",
              color: "bg-orange-50 border-orange-200"
            },
            {
              icon: <BarChart className="w-8 h-8 text-emerald-500" />,
              title: "Progress Tracking",
              description: "Visualize your improvement over time with our dashboard. Track your scores and interview history.",
              color: "bg-emerald-50 border-emerald-200"
            }
          ].map((service, idx) => (
            <div 
              key={idx} 
              className={`p-8 rounded-2xl border ${service.color} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white`}
            >
              <div className="mb-6">{service.icon}</div>
              <h3 className="text-2xl font-bold text-neutral-800 mb-3">{service.title}</h3>
              <p className="text-neutral-600 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-neutral-900 rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to boost your career?</h3>
            <p className="text-neutral-400 mb-8">Join thousands of candidates preparing smarter today.</p>
            <a href="/generate" className="inline-block bg-white text-neutral-900 px-8 py-3 rounded-full font-semibold hover:bg-neutral-100 transition-colors">
              Get Started Now
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
};
