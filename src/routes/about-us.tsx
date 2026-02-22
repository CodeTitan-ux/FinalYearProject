import { Container } from "@/components/container";
import { Sparkles, Users, Target, Rocket } from "lucide-react";

export const AboutUs = () => {
  return (
    <div className="w-full pb-20 pt-32 relative bg-neutral-50 min-h-screen">
      <Container>
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            About AI Mock Interview
          </h2>
          <p className="text-neutral-600 text-lg md:text-xl max-w-2xl">
            Empowering job seekers with AI-driven interview practice to land their dream jobs with confidence.
          </p>
        </div>

        {/* Mission & Vision Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="p-8 bg-white rounded-2xl shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-neutral-800">Our Mission</h3>
            <p className="text-neutral-600 leading-relaxed">
              To democratize interview preparation by providing accessible, high-quality, and personalized AI coaching to candidates worldwide, ensuring everyone has a fair chance at success.
            </p>
          </div>
          
          <div className="p-8 bg-white rounded-2xl shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
              <Rocket className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-neutral-800">Our Vision</h3>
            <p className="text-neutral-600 leading-relaxed">
              We envision a world where interview anxiety is a thing of the past. By leveraging cutting-edge Generative AI, we provide real-time feedback and realistic simulations.
            </p>
          </div>
        </div>

        {/* Team / Values Section */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-neutral-200">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-neutral-800 mb-4">Why Choose Us?</h3>
            <p className="text-neutral-600">Built by developers, for developers layout and professionals.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Sparkles className="w-5 h-5" />,
                title: "AI Powered",
                desc: "State-of-the-art LLMs provide instant, actionable feedback on your answers."
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: "User Centric",
                desc: "Designed with the user experience in mind, making prep intuitive and stress-free."
              },
              {
                icon: <Target className="w-5 h-5" />,
                title: "Result Oriented",
                desc: "Focus on improvements that actually matter to hiring managers and recruiters."
              }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-700">
                  {item.icon}
                </div>
                <h4 className="text-xl font-semibold mb-2 text-neutral-800">{item.title}</h4>
                <p className="text-neutral-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};
