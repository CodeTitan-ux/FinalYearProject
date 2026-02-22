import React from "react";

import { Github, Mail, Instagram, Linkedin, ExternalLink } from "lucide-react"; // Import Lucide icons
import { Link } from "react-router-dom";
import { Container } from "@/components/container";
import { MainRoutes } from "@/lib/helpers";

interface SocialLinkProps {
  href: string;
  icon: React.ReactNode;
  hoverColor: string;
}

const SocialLink: React.FC<SocialLinkProps> = ({ href, icon, hoverColor }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`hover:${hoverColor}`}
    >
      {icon}
    </a>
  );
};

interface FooterLinkProps {
  to: string;
  children: React.ReactNode;
}

const FooterLink: React.FC<FooterLinkProps> = ({ to, children }) => {
  return (
    <li>
      <Link
        to={to}
        className="hover:underline text-gray-300 hover:text-gray-100"
      >
        {children}
      </Link>
    </li>
  );
};

export const Footer = () => {
  return (
    <div className="w-full bg-black text-gray-300 hover:text-gray-100 py-8">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* First Column: Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {MainRoutes.map((route) => (
                <FooterLink key={route.href} to={route.href}>
                  {route.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Second Column: About Us */}
          <div>
            <h3 className="font-bold text-lg mb-4">About Us</h3>
            <p>
              We are committed to helping you unlock your full potential with
              AI-powered tools. Our platform offers a wide range of resources to
              improve your interview skills and chances of success.
            </p>
          </div>

          {/* Third Column: Services */}
          <div>
            <h3 className="font-bold text-lg mb-4">Third-Party Services</h3>
            <ul>
              <li>
                <a
                  href="https://prepinsta.com/interview-preparation/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-gray-300 hover:text-gray-100 flex items-center gap-2"
                >
                  Interview Preparation
                  <ExternalLink size={14} />
                </a>
              </li>
              <li>
                <a
                  href="https://www.edumilestones.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-gray-300 hover:text-gray-100 flex items-center gap-2"
                >
                  Career Coaching
                  <ExternalLink size={14} />
                </a>
              </li>
              <li>
                <a
                  href="https://www.resume-now.com/lp/rnarsmsm121?utm_source=bing&utm_medium=sem&utm_campaign=568035454&utm_term=resume%20builder%20free&network=o&device=c&adposition=&adgroupid=1183076257845306&msclkid=127c7a380e51151891ff13a9b77c7a39&utm_content=resume%20builder%20free"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-gray-300 hover:text-gray-100 flex items-center gap-2"
                >
                  Resume Building
                  <ExternalLink size={14} />
                </a>
              </li>
            </ul>
          </div>

          {/* Fourth Column: Address and Social Media */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <p className="mb-4">Pune City , 411001</p>
            <div className="flex gap-4">
              <SocialLink
                href="https://github.com"
                icon={<Github size={24} />}
                hoverColor="text-gray-400"
              />
              <SocialLink
                href="mailto:"
                icon={<Mail size={24} />}
                hoverColor="text-red-400"
              />
              <SocialLink
                href="https://instagram.com"
                icon={<Instagram size={24} />}
                hoverColor="text-pink-500"
              />
              <SocialLink
                href="https://linkedin.com"
                icon={<Linkedin size={24} />}
                hoverColor="text-blue-700"
              />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};
