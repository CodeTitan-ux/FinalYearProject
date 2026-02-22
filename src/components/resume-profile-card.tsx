import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap, FolderDot, Code2, Building, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { ResumeProfile } from "@/types";

export const ResumeProfileCard = ({ profile, hideBadges, hideInferredBadge }: { profile: ResumeProfile, hideBadges?: boolean, hideInferredBadge?: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!profile) return null;

  return (
    <Card className="w-full bg-white shadow-sm border border-neutral-200/80 rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader 
        className="bg-neutral-50/50 border-b border-neutral-100 pb-4 cursor-pointer hover:bg-neutral-100/50 transition-colors select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between w-full">
            <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2 text-neutral-800">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <Briefcase className="w-4 h-4 text-primary" />
                  </div>
                  Extracted Resume Profile
                </CardTitle>
                <CardDescription className="text-neutral-500">
                   The AI extracted the following core details from your uploaded resume to tailor this interview. Click to view.
                </CardDescription>
                {!hideBadges && (
                  <div className="flex items-center gap-2 pt-2">
                     {!hideInferredBadge && <Badge variant="outline" className="text-neutral-500 rounded-full bg-white font-normal hover:bg-neutral-50">Inferred from Resume</Badge>}
                     <Badge variant="secondary" className="bg-blue-50/80 text-blue-600 border border-blue-200/60 hover:bg-blue-50 hover:text-blue-600 rounded-full font-normal">Resume Used</Badge>
                  </div>
                )}
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 text-neutral-500 hover:text-neutral-800 pointer-events-none">
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-6 space-y-8 animate-in slide-in-from-top-2 duration-300">
        
        {/* ATS Score */}
        {profile.atsScore && (
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 border border-indigo-100/50 shadow-sm">
             <div className="relative flex items-center justify-center shrink-0 w-16 h-16">
                 <svg className="w-full h-full transform -rotate-90 drop-shadow-sm">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-indigo-50" />
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={2 * Math.PI * 28} strokeDashoffset={2 * Math.PI * 28 * (1 - profile.atsScore / 100)} className="text-indigo-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                 </svg>
                 <span className="absolute text-lg font-bold text-indigo-700">{profile.atsScore}</span>
             </div>
             <div className="space-y-1.5">
                 <h4 className="font-semibold text-neutral-800 flex items-center gap-1.5 text-base">
                    <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-100" /> ATS Resume Score
                 </h4>
                 <p className="text-sm text-neutral-600 leading-relaxed">
                    {profile.atsRationale || "Score calculated based on structural integrity, clarity, and impact of content."}
                 </p>
             </div>
          </div>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-neutral-700">
              <Code2 className="w-4 h-4 text-neutral-400" />
              Core Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, i) => (
                <Badge key={i} variant="secondary" className="bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10 transition-colors py-1 px-3">
                    {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Roles & Companies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-neutral-50/50 border border-neutral-100">
            {profile.roles && profile.roles.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-neutral-700">
                      <Briefcase className="w-3.5 h-3.5 text-neutral-400" /> 
                      Target Roles
                  </h4>
                  <ul className="space-y-1">
                      {profile.roles.map((role, i) => (
                          <li key={i} className="text-sm text-neutral-600 flex items-start gap-2">
                             <span className="text-neutral-300 mt-0.5">•</span> {role}
                          </li>
                      ))}
                  </ul>
                </div>
            )}
            {profile.companies && profile.companies.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-neutral-700">
                      <Building className="w-3.5 h-3.5 text-neutral-400" />
                      Experience 
                      <span className="text-xs font-normal text-muted-foreground ml-1">({profile.yearsExperience || 0} years)</span>
                  </h4>
                  <ul className="space-y-1">
                      {profile.companies.map((company, i) => (
                          <li key={i} className="text-sm text-neutral-600 flex items-start gap-2">
                             <span className="text-neutral-300 mt-0.5">•</span> {company}
                          </li>
                      ))}
                  </ul>
                </div>
            )}
        </div>

        {/* Projects */}
        {profile.projects && profile.projects.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-4 flex items-center gap-2 text-neutral-700">
              <FolderDot className="w-4 h-4 text-neutral-400" />
              Identified Projects
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.projects.map((project, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                      <h5 className="font-semibold text-sm text-neutral-800 mb-1">{project.name}</h5>
                      <p className="text-xs text-neutral-600 mb-3 line-clamp-2">{project.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                          {project.techStack?.map((tech, j) => (
                              <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-medium">
                                  {tech}
                              </span>
                          ))}
                      </div>
                  </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {profile.education && profile.education.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-neutral-700">
              <GraduationCap className="w-4 h-4 text-neutral-400" />
              Education
            </h4>
            <ul className="space-y-1.5">
                {profile.education.map((edu, i) => (
                    <li key={i} className="text-sm text-neutral-600 flex items-start gap-2">
                        <span className="text-neutral-300 mt-0.5">•</span> {edu}
                    </li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
      )}
    </Card>
  );
};
