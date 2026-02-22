import { Container } from "@/components/container";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";

export const ContactUs = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
    honeypot: "",
  });
  const [emailError, setEmailError] = useState("");

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      if (value && !emailRegex.test(value)) {
        setEmailError("Please enter a valid email address.");
      } else {
        setEmailError("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.honeypot) {
      console.log("Bot detected!");
      return;
    }
    
    setLoading(true);

    // TODO: Replace with your actual EmailJS Service ID, Template ID, and Public Key
    // You can get these from https://dashboard.emailjs.com/admin
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    try {
      const templateParams = {
        to_name: "Admin",
        from_name: `${formData.firstName} ${formData.lastName}`,
        from_email: formData.email,
        message: formData.message,
        admin_email: "jambhulkar890@gmail.com",
        date: new Date().toLocaleString(),
        reply_to: formData.email,
      };

      if (emailError || !formData.email) {
        toast.error("Please enter a valid email address.");
        setLoading(false);
        return;
      }

      await emailjs.send(serviceId, templateId, templateParams, publicKey);

      toast.success("Message sent successfully!");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        message: "",
        honeypot: "",
      });
    } catch (error: any) {
      console.error("FAILED...", error);
      if (error.text) {
        console.error("EmailJS Error Text:", error.text);
        toast.error(`Failed to send: ${error.text}`);
      } else {
        toast.error("Failed to send message. Please check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full pb-20 pt-32 relative bg-neutral-50 min-h-screen">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-4">
            Get in Touch
          </h2>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and
            we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">Email</h3>
              <p className="text-neutral-600 text-sm">
                support@aimockinterview.com
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                <Phone className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">Phone</h3>
              <p className="text-neutral-600 text-sm">+91 123-456-789</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">Office</h3>
              <p className="text-neutral-600 text-sm">
                Hinjewadi Phase 3, Tech Enclave, Pune City, 411001
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      First Name
                    </label>
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      Last Name
                    </label>
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Email
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                  />
                  {emailError && (
                    <p className="text-red-500 text-sm mt-1">{emailError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Message
                  </label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    className="min-h-[150px] resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !!emailError || !formData.email}
                  className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                  {loading ? "Sending..." : "Send Message"}{" "}
                  <Send className="w-4 h-4" />
                </Button>

                {/* Honeypot field (hidden) */}
                <div className="hidden">
                  <label htmlFor="honeypot">Website</label>
                  <input
                    type="text"
                    id="honeypot"
                    name="honeypot"
                    value={formData.honeypot}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};
