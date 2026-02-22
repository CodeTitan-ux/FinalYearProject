import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { Interview } from "@/types";

import { CustomBreadCrumb } from "./custom-bread-crumb";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { Headings } from "./headings";
import { Button } from "./ui/button";
import { Loader, Sparkles, AlertTriangle, Briefcase, Code, Settings, UploadCloud, X } from "lucide-react";
import { Separator } from "./ui/separator";
import { ResumeProfileCard } from "./resume-profile-card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

import { generateAiContent } from "@/utils/gemini-helper";
import { QuestionRandomizer } from "@/scripts/question-randomizer";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,

  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { db, functions } from "@/config/firebase.config";
import { httpsCallable } from "firebase/functions";
import { TechStackInput } from "./ui/tech-stack-input";
import { Slider } from "./ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormMockInterviewProps {
  initialData: Interview | null;
}

const baseSchema = z.object({
  position: z.string().max(100, "Position must be 100 characters or less").optional().default(""),
  description: z.string().optional().default(""),
  experience: z.string().optional().default(""),
  techStack: z.string().optional().default(""),
  questionCount: z.number().min(5).max(20).default(5),
  interviewerStyle: z.string().optional().default(""),
  useResume: z.boolean().default(false),
  resumeFile: z.any().optional(),
});

const formSchema = baseSchema.superRefine((data, ctx) => {
  const hasPosition = !!data.position && data.position.trim().length > 0;
  const hasDescription = !!data.description && data.description.trim().length >= 20;
  const hasExperience = !!data.experience && data.experience.trim().length > 0;
  const hasTechStack = !!data.techStack && data.techStack.trim().length > 0;
  const hasInterviewerStyle = !!data.interviewerStyle && data.interviewerStyle.trim().length > 0;

  const isFormFilled = hasPosition && hasDescription && hasExperience && hasTechStack && hasInterviewerStyle;
  
  const noPosition = !data.position || data.position.trim().length === 0;
  const noDescription = !data.description || data.description.trim().length === 0;
  const noExperience = !data.experience || data.experience.trim().length === 0;
  const noTechStack = !data.techStack || data.techStack.trim().length === 0;

  const isResumeOnlyFieldsEmpty = noPosition && noDescription && noExperience && noTechStack;
  
  const hasResume = data.useResume && data.resumeFile && data.resumeFile.length > 0;

  if (hasResume) {
    const file = data.resumeFile[0] as File;
    if (file.type !== "application/pdf") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Only PDF files are allowed.", path: ["resumeFile"] });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "File size must be less than 5MB.", path: ["resumeFile"] });
      return;
    }

    if (isResumeOnlyFieldsEmpty) {
       // Case 1: Resume Only Mode
       if (!hasInterviewerStyle) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Interviewer style is required", path: ["interviewerStyle"] });
       }
       return; // Valid
    } else if (isFormFilled) {
       // Case 3: Hybrid Mode
       return; // Valid
    } else {
       // Invalid: Partially filled hybrid mode
       ctx.addIssue({ code: z.ZodIssueCode.custom, message: "For Hybrid mode, please fill all fields, or leave Role, Description, Experience, and Tech Stack empty for Resume Only mode.", path: ["useResume"] });
       if (!hasPosition) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Position is required for Hybrid mode", path: ["position"] });
       if (!hasDescription) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Description must be at least 20 characters for Hybrid mode", path: ["description"] });
       if (!hasExperience) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Experience is required for Hybrid mode", path: ["experience"] });
       if (!hasTechStack) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tech stack is required for Hybrid mode", path: ["techStack"] });
       if (!hasInterviewerStyle) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Interviewer style is required", path: ["interviewerStyle"] });
       return;
    }
  } else {
    if (isFormFilled) {
      // Case 2: Option Form Only Mode
      return; // Valid
    }
    
    // Invalid: Partially filled form or empty form without resume
    if (isResumeOnlyFieldsEmpty && !hasInterviewerStyle) {
       ctx.addIssue({ code: z.ZodIssueCode.custom, message: "You must either fill out the entire option form or upload a resume.", path: ["useResume"] });
    } else {
       if (!hasPosition) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Position is required", path: ["position"] });
       if (!hasDescription) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Description must be at least 20 characters", path: ["description"] });
       if (!hasExperience) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Experience is required", path: ["experience"] });
       if (!hasTechStack) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tech stack is required", path: ["techStack"] });
       if (!hasInterviewerStyle) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Interviewer style is required", path: ["interviewerStyle"] });
    }
  }
});

type FormData = z.infer<typeof formSchema>;

export const FormMockInterview = ({ initialData }: FormMockInterviewProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          position: initialData.position,
          description: initialData.description,
          experience: String(initialData.experience),
          techStack: initialData.techStack,
          questionCount: initialData.questions.length,
          interviewerStyle: initialData.interviewerStyle || "Neutral",
        }
      : {
          position: "",
          description: "",
          experience: "",
          techStack: "",
          questionCount: 5,
          interviewerStyle: "Neutral",
          useResume: false,
        },
  });

  const watchInterviewerStyle = form.watch("interviewerStyle");
  const watchQuestionCount = form.watch("questionCount");

  useEffect(() => {
    if (!initialData && watchInterviewerStyle) {
      // Only save to state, don't persist to localStorage
    }
  }, [watchInterviewerStyle, initialData]);

  useEffect(() => {
    if (!initialData && watchQuestionCount) {
       // Only save to state, don't persist to localStorage
    }
  }, [watchQuestionCount, initialData]);

  const useResumeVal = form.watch("useResume");

  const { isValid, isSubmitting, isDirty } = form.formState;

  // The 'isValid' property might be strangely evaluated by RHF until fields are touched or submitted.
  // We can derive a synthetic isButtonDisabled state based on watching the key fields.
  const watchAll = form.watch();
  
  const hasPosition = !!watchAll.position && watchAll.position.trim().length > 0;
  const hasDescription = !!watchAll.description && watchAll.description.trim().length >= 20;
  const hasExperience = !!watchAll.experience && watchAll.experience.trim().length > 0;
  const hasTechStack = !!watchAll.techStack && watchAll.techStack.trim().length > 0;
  const hasInterviewerStyle = !!watchAll.interviewerStyle && watchAll.interviewerStyle.trim().length > 0;
  const isFormFilled = hasPosition && hasDescription && hasExperience && hasTechStack && hasInterviewerStyle;

  const noPosition = !watchAll.position || watchAll.position.trim().length === 0;
  const noDescription = !watchAll.description || watchAll.description.trim().length === 0;
  const noExperience = !watchAll.experience || watchAll.experience.trim().length === 0;
  const noTechStack = !watchAll.techStack || watchAll.techStack.trim().length === 0;
  
  const isResumeOnlyFieldsEmpty = noPosition && noDescription && noExperience && noTechStack;

  const hasResume = watchAll.useResume && watchAll.resumeFile && watchAll.resumeFile.length > 0;

  let isFormValidState = false;
  if (hasResume) {
    const file = watchAll.resumeFile[0];
    const isFileValid = file.type === "application/pdf" && file.size <= 5 * 1024 * 1024;

    if (isFileValid) {
        if (isResumeOnlyFieldsEmpty && hasInterviewerStyle) isFormValidState = true;
        else if (isFormFilled) isFormValidState = true;
    }
  } else {
    if (isFormFilled) isFormValidState = true;
  }
  const [loading, setLoading] = useState(false);
  
  const isRestrictedMode = !!initialData && initialData.techStack === "Inferred from Resume";
  const isRestrictedFieldEdited = isRestrictedMode && (
    watchAll.position !== initialData.position ||
    watchAll.description !== initialData.description ||
    watchAll.techStack !== initialData.techStack
  );

  const isButtonDisabled = 
      isSubmitting || 
      loading || 
      !isFormValidState || 
      (!!initialData && !isDirty) ||
      isRestrictedFieldEdited;
  const navigate = useNavigate();
  const { userId } = useAuth();

  const title = initialData ? "Edit Mock Interview" : "Create Your Mock Interview";
  const breadCrumpPage = initialData ? initialData?.position : "Create";
  const actions = initialData ? "Save Changes" : "Generate Interview";
  const toastMessage = initialData
    ? { title: "Updated!", description: "Changes saved successfully." }
    : { title: "Success!", description: "Mock Interview created successfully." };

  const cleanAiResponse = (responseText: string) => {
    // Step 1: Find the first '[' and last ']'
    const start = responseText.indexOf('[');
    const end = responseText.lastIndexOf(']');

    if (start === -1 || end === -1) {
       // Allow failure to log for debugging if needed, but for now throw
       // Maybe the AI returned strict JSON without array? 
       // Let's print to console to help debugging if this happens again
       console.error("AI Response Error - No Array Found:", responseText); 
       throw new Error("No JSON array found in response");
    }

    // Step 2: Extract the JSON array string
    const jsonString = responseText.substring(start, end + 1);

    // Step 3: Parse the clean JSON text into an array of objects
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("AI Response Error - Invalid JSON:", jsonString); 
      throw new Error("Invalid JSON format: " + (error as Error)?.message);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error("Failed to convert file."));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const generateAiResponse = async (data: FormData, resumeProfile?: any) => {
    
    // Determine the active mode based on form data
    const hasPosition = !!data.position && data.position.trim().length > 0;
    const isResumeOnly = !hasPosition && resumeProfile;
    const isHybrid = hasPosition && resumeProfile;
    const isFormOnly = hasPosition && !resumeProfile;

    let prompt = `As a Senior Technical Interviewer, your task is to generate a comprehensive technical interview based on the candidate's profile.\n\n`;

    if (isResumeOnly) {
      prompt += `
        Input Mode: Resume Only
        The candidate has provided their resume profile. 
        Determine their likely target role, seniority level, and core tech stack directly from this Resume Profile: ${JSON.stringify(resumeProfile)}
        
        Generate a JSON array of ${data?.questionCount} technical interview questions tailored to the skills and projects mentioned in the resume.
        - Probe deeper into their specific projects and claims.
        - The questions should scale appropriately to their inferred years of experience.
        - Reflect the selected Interviewer Style: ${data?.interviewerStyle} (e.g., if "Friendly", use encouraging phrasing; if "Strict", be direct and probing).
      `;
    } else if (isFormOnly) {
      prompt += `
        Input Mode: Option Form Only
        Candidate Profile:
        - Role: ${data?.position}
        - Experience Level: ${data?.experience}
        - Job Description: ${data?.description}
        - Tech Stack: ${data?.techStack}
        - Interviewer Style: ${data?.interviewerStyle}
        
        Generate a JSON array of ${data?.questionCount} technical interview questions.
        - Tailor the questions to the specified experience level and tech stack.
        - Reflect the selected Interviewer Style (${data?.interviewerStyle}).
      `;
    } else if (isHybrid) {
      prompt += `
        Input Mode: Hybrid (Resume + Option Form)
        Candidate Profile:
        - Role: ${data?.position}
        - Experience Level: ${data?.experience}
        - Job Description: ${data?.description}
        - Tech Stack: ${data?.techStack}
        - Interviewer Style: ${data?.interviewerStyle}
        - Resume Profile: ${JSON.stringify(resumeProfile)}
        
        Generate a JSON array of ${data?.questionCount} technical interview questions using BOTH sources.
        - Focus primarily on the requested Role and Tech Stack from the Option Form.
        - Enrich the interview by probing deep into their Resume Profile, specifically connecting their past projects/skills to the requested Role.
        - Reflect the selected Interviewer Style (${data?.interviewerStyle}).
      `;
    }

    prompt += `
        Each object in the array must have:
        1. "question": A challenging and practical interview question.
        2. "answer": A concise but informative answer (max 3-4 sentences).

        Output Format:
        Return ONLY a raw JSON array. Do not include any markdown formatting (like \`\`\`json), explanations, or text outside the JSON array.
        IMPORTANT: The "answer" field MUST use Markdown formatting (e.g., code blocks with language tags, bullet points, bold text) for better readability.

        Example Output:
        [
          { "question": "Explain the concept of closure in JavaScript...", "answer": "A closure is..." },
          ...
        ]
        `;

    // 1. Fetch previous questions and select focus areas
    let focusAreas: string[] = [];
    if (userId) {
      try {
        const previousQuestions = await QuestionRandomizer.getPreviousQuestions(userId);
        focusAreas = QuestionRandomizer.selectFocusAreas(previousQuestions);
        console.log("Selected Focus Areas for Interview:", focusAreas);
      } catch (err) {
        console.warn("Failed to fetch previous questions/focus areas:", err);
        // Continue without randomization if it fails
      }
    }

    // 2. Append randomization logic to the prompt
    const randomizationPrompt = focusAreas.length > 0 
      ? `
        IMPORTANT: To ensure a diverse interview, please prioritize questions related to these specific topics (but do not limit yourself potentially to just these if the tech stack is broader):
        - ${focusAreas.join("\n- ")}
        
        Also, try to avoid repeating questions that are very similar to standard/common questions if possible, and instead focus on unique scenarios within the candidate's experience level.
      `
      : "";

    const finalPrompt = prompt + randomizationPrompt;

    const aiResponseText = await generateAiContent({ prompt: finalPrompt });
    const cleanedResponse = cleanAiResponse(aiResponseText);

    return cleanedResponse;
  };

  const [open, setOpen] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);

  const cleanOldAnswers = async (interviewId: string) => {
    if (!userId) return;

    try {
      const q = query(
        collection(db, "users", userId, "userAnswers"),
        where("mockIdRef", "==", interviewId)
      );
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error("Error clearing old answers:", error);
      throw new Error("Failed to clear old answers");
    }
  };

  const onSubmit = async (data: FormData) => {
    if (initialData) {
      // If editing, open confirmation dialog
      setPendingData(data);
      setOpen(true);
    } else {
      // If creating, proceed directly
      await createInterview(data);
    }
  };

  const createInterview = async (data: FormData) => {
    try {
      setLoading(true);
      if (isValid) {
        
        // Handle Global Custom Error from Zod (e.g. Empty form but no resume)
        if (form.formState.errors.useResume?.message?.includes("entire option form")) {
           toast.error("Validation Error", { description: form.formState.errors.useResume.message });
           setLoading(false);
           return;
        }

        let resumeProfile = undefined;

        if (data.useResume && data.resumeFile && data.resumeFile.length > 0) {
          const file = data.resumeFile[0] as File;
          if (file.size > 5 * 1024 * 1024) {
             toast.error("File size exceeded", { description: "Max file size is 5MB for Resume PDF." });
             setLoading(false);
             return;
          }
          const base64Str = await convertFileToBase64(file);
          
          const parseResumeCall = httpsCallable(functions, "processResumeV2");
          
          try {
            toast("Analyzing Resume...", { description: "Extracting profile data." });
            const result = await parseResumeCall({ fileData: base64Str, userId: userId });
            resumeProfile = result.data;
          } catch(err: any) {
             console.error("Resume Parse Error", err);
             toast.error("Invalid Resume Protocol", {
                 description: "The uploaded PDF is not recognized as a valid resume. Please upload a properly structured resume in PDF format." 
             });
             form.setValue("resumeFile", undefined); // Automatically clear the rejected file
             setLoading(false);
             return;
          }
        }

        const aiResult = await generateAiResponse(data, resumeProfile);

        if (userId) {
          const isResumeOnly = (!data.position || data.position.trim().length === 0) && resumeProfile;
          
          const newDocData: any = {
            position: isResumeOnly ? "Resume Based Interview" : data.position,
            description: isResumeOnly ? "Interview generated directly from the uploaded resume profile." : data.description,
            experience: isResumeOnly ? "Inferred from Resume" : data.experience,
            techStack: isResumeOnly ? "Inferred from Resume" : data.techStack,
            interviewerStyle: data.interviewerStyle,
            userId,
            questions: aiResult,
            createdAt: serverTimestamp(),
          };

          if (resumeProfile) {
            newDocData.resumeProfile = resumeProfile;
          }

          await addDoc(collection(db, "users", userId, "interviews"), newDocData);
        }

        toast(toastMessage.title, { description: toastMessage.description });
        navigate("/generate", { replace: true });
      }
    } catch (error) {
      console.log(error);
      toast.error("Error", {
        description: `Something went wrong. Please try again later.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const onConfirmUpdate = async () => {
    if (!pendingData || !initialData) return;

    try {
      setLoading(true);
      setOpen(false); // Close dialog immediately or keep open with loading state? Better keep open or use global loading

      if (isValid) {
        // 1. Generate new questions
        // (Editing does not re-upload resume in this basic flow, it re-uses the form data. Optionally we could add editing of resume too)
        const aiResult = await generateAiResponse(pendingData, initialData?.resumeProfile);

        // 2. Clear old answers
        await cleanOldAnswers(initialData.id);

        // 3. Update interview
        if (userId) {
          const isResumeOnly = (!pendingData.position || pendingData.position.trim().length === 0) && initialData?.resumeProfile;

          await updateDoc(doc(db, "users", userId, "interviews", initialData.id), {
            questions: aiResult,
            position: isResumeOnly ? "Resume Based Interview" : pendingData.position,
            description: isResumeOnly ? "Interview generated directly from the uploaded resume profile." : pendingData.description,
            experience: isResumeOnly ? "Inferred from Resume" : pendingData.experience,
            techStack: isResumeOnly ? "Inferred from Resume" : pendingData.techStack,
            interviewerStyle: pendingData.interviewerStyle,
            updatedAt: serverTimestamp(),
          });
        }

        toast(toastMessage.title, { description: toastMessage.description });
        navigate("/generate", { replace: true });
      }
    } catch (error) {
      console.log(error);
      const errorMessage = (error as Error)?.message || "Something went wrong";
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
      setPendingData(null);
    }
  };

  useEffect(() => {
    if (initialData) {
      form.reset({
        position: initialData.position,
        description: initialData.description,
        experience: String(initialData.experience), // Ensure string for legacy number data
        techStack: initialData.techStack,
        questionCount: initialData.questions.length,
        interviewerStyle: initialData.interviewerStyle || "Neutral",
      });
    }
  }, [initialData, form]);

  return (
    <div className="w-full flex-col space-y-4">
      <CustomBreadCrumb
        breadCrumbPage={breadCrumpPage}
        breadCrumpItems={[{ label: "Mock Interviews", link: "/generate" }]}
      />

      <div className="mt-4 flex items-center justify-between w-full">
        <Headings title={title} isSubHeading />


      </div>

      <Separator className="my-4" />

      {initialData?.resumeProfile && (
        <div className="my-6">
            <ResumeProfileCard 
              profile={initialData.resumeProfile} 
              hideInferredBadge={initialData.techStack !== "Inferred from Resume"}
            />
        </div>
      )}

      {!initialData && (
        <div className="my-6">
          <p className="text-sm text-muted-foreground">
            You can create an interview using your <strong>Resume Only</strong> (upload resume, select Interviewer Style and Number of Questions, leave other options empty), the <strong>Option Form Only</strong> (fill all fields), or a <strong>Hybrid</strong> of both. Partial forms are not accepted.
          </p>
        </div>
      )}

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full flex-col flex items-start justify-start gap-6"
        >
          {/* SECTION 1: Job Details */}
          <div className="w-full bg-white border border-neutral-200/60 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-800">1. Job Details</h3>
            </div>
            
            <div className="space-y-6">
          {/* Job Role */}
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem className="w-full space-y-4">
                <div className="w-full">
                  <FormLabel>Job Role / Position</FormLabel>
                   <p className="text-xs text-muted-foreground">The specific role you are applying for (e.g. "Senior Frontend Developer")</p>
                  <FormMessage className="text-sm text-red-500 mt-1" />
                </div>
                <FormControl>
                  <Input
                    className="h-12 bg-neutral-50/50 focus-visible:bg-white transition-colors"
                    disabled={loading || isRestrictedMode}
                    placeholder="e.g. Full Stack Developer"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Job Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-full space-y-4">
                <div className="w-full">
                  <FormLabel>Job Description</FormLabel>
                  <p className="text-xs text-muted-foreground">Paste the job description or describe the key requirements.</p>
                  <FormMessage className="text-sm text-red-500 mt-1" />
                </div>
                  <FormControl>
                    <Textarea
                      className="min-h-[140px] resize-y text-base p-4 bg-neutral-50/50 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/20 border-neutral-200 transition-all shadow-sm focus:shadow-md"
                      disabled={loading || isRestrictedMode}
                      placeholder="e.g. We are looking for a React developer with experience in Node.js and AWS. The candidate should be proficient in..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
              </FormItem>
            )}
          />
          </div>
          </div>

          {/* SECTION 2: Skills & Experience */}
          <div className="w-full bg-white border border-neutral-200/60 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Code className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-800">2. Skills & Experience</h3>
            </div>
            
            <div className="space-y-6">

          {/* Tech Stack */}
          <FormField
            control={form.control}
            name="techStack"
            render={({ field }) => (
              <FormItem className="w-full space-y-4">
                <div className="w-full">
                  <FormLabel>Tech Stack</FormLabel>
                  <p className="text-xs text-muted-foreground">List the technologies relevant to this interview (press Enter to add).</p>
                  <FormMessage className="text-sm text-red-500 mt-1" />
                </div>
                <FormControl>
                  <TechStackInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    disabled={loading || isRestrictedMode}
                    placeholder="Type and press Enter (e.g. React, Next.js)"
                    error={form.formState.errors.techStack?.message}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {/* Experience Level */}
             <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem className="w-full space-y-4">
                 <div className="w-full">
                  <FormLabel>Years of Experience</FormLabel>
                  <p className="text-xs text-muted-foreground">Select experience level for tailored question difficulty.</p>
                   <FormMessage className="text-sm text-red-500 mt-1" />
                </div>
                <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(
                            [
                              { value: "Junior (0-2 Years)", label: "Junior", desc: "0-2 Years" },
                              { value: "Mid-Level (3-5 Years)", label: "Mid-Level", desc: "3-5 Years" },
                              { value: "Senior (6+ Years)", label: "Senior", desc: "6+ Years" }
                            ]
                        ).map((level) => (
                             <div
                                key={level.value}
                                className={`
                                    cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-200
                                    ${field.value === level.value 
                                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20" 
                                      : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50"
                                    }
                                `}
                                onClick={() => !loading && field.onChange(level.value)}
                             >
                                <span className={`text-base font-semibold ${field.value === level.value ? "text-primary" : "text-neutral-700"}`}>{level.label}</span>
                                <span className="text-xs text-neutral-500 mt-1">{level.desc}</span>
                             </div>
                        ))}
                    </div>
                </FormControl>
                  <Input type="hidden" {...field} />
              </FormItem>
            )}
          />
          </div>
          </div>

          {/* SECTION 3: Interview Settings */}
          <div className="w-full bg-white border border-neutral-200/60 rounded-2xl shadow-sm p-6 md:p-8 space-y-8">
             <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-800">3. Interview Settings</h3>
            </div>
            
            <div className="space-y-8">

             {/* Interviewer Style */}
             <FormField
              control={form.control}
              name="interviewerStyle"
              render={({ field }) => (
                <FormItem className="w-full space-y-4">
                  <div className="w-full">
                    <FormLabel>Interviewer Style</FormLabel>
                    <p className="text-xs text-muted-foreground">Choose the personality of your interviewer.</p>
                    <FormMessage className="text-sm text-red-500 mt-1" />
                  </div>
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={loading}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select Style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Friendly">Friendly & Supportive</SelectItem>
                      <SelectItem value="Neutral">Neutral (Realistic)</SelectItem>
                      <SelectItem value="Challenging">Challenging / Strict</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Resume Upload Integration */}
            {!initialData && (
              <div className={`w-full space-y-4 border rounded-xl overflow-hidden transition-all duration-300 ${useResumeVal ? 'border-primary/40 bg-primary/[0.02] shadow-sm' : 'border-neutral-200 bg-neutral-50/30 hover:border-neutral-300'}`}>
                 <FormField
                    control={form.control}
                    name="useResume"
                    render={({ field }) => (
                      <FormItem 
                         className="flex flex-row items-center justify-between p-5 cursor-pointer" 
                         onClick={() => !loading && field.onChange(!field.value)}
                      >
                        <div className="space-y-1.5 leading-none pr-4">
                          <FormLabel className="text-base font-semibold cursor-pointer text-neutral-800">Use Resume to Personalize Questions</FormLabel>
                          <p className="text-sm text-neutral-500 leading-relaxed">
                            Upload your resume PDF to allow our AI to extract your core skills, work history, and exact project details for highly targeted questions.
                          </p>
                        </div>
                        <FormControl>
                          <div className={`relative flex-shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${field.value ? 'bg-primary' : 'bg-neutral-300'}`}>
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${field.value ? 'translate-x-5' : 'translate-x-1'}`} />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                 />

                 <div className={`overflow-hidden transition-all duration-300 ease-in-out ${useResumeVal ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-5 pb-5 pt-2 border-t border-primary/10">
                      <FormField
                        control={form.control}
                        name="resumeFile"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormControl>
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer bg-white border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 w-full relative">
                                            {field.value && field.value.length > 0 ? (
                                                <>
                                                  <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-8 w-8 text-neutral-500 hover:text-red-500 hover:bg-red-50"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        field.onChange(undefined);
                                                    }}
                                                  >
                                                      <X className="w-5 h-5" />
                                                  </Button>
                                                  <UploadCloud className="w-10 h-10 mb-3 text-primary" />
                                                  <div className="text-center px-8">
                                                    <p className="mb-1 text-sm text-primary font-semibold break-words max-w-xs">{field.value[0].name}</p>
                                                    <p className="text-xs text-primary/70">{(field.value[0].size / (1024 * 1024)).toFixed(2)} MB</p>
                                                  </div>
                                                </>
                                            ) : (
                                                <>
                                                  <UploadCloud className="w-10 h-10 mb-3 text-neutral-400" />
                                                  <div className="text-center space-y-1">
                                                      <p className="text-sm text-neutral-600"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                                                      <p className="text-xs text-neutral-500">PDF File (Max 5MB)</p>
                                                  </div>
                                                </>
                                            )}
                                        </div>
                                        <Input 
                                          type="file"
                                          accept=".pdf"
                                          disabled={loading}
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.type !== "application/pdf") {
                                                    toast.error("Invalid File Type", { description: "Only PDF files are allowed." });
                                                    e.target.value = '';
                                                    field.onChange(undefined);
                                                    return;
                                                }
                                                if (file.size > 5 * 1024 * 1024) {
                                                    toast.error("File Too Large", { description: "File size must be less than 5MB." });
                                                    e.target.value = '';
                                                    field.onChange(undefined);
                                                    return;
                                                }
                                                field.onChange(e.target.files);
                                            } else {
                                                field.onChange(undefined);
                                            }
                                          }}
                                        />
                                    </label>
                                </div>
                            </FormControl>
                            <FormMessage className="text-center mt-2"/>
                          </FormItem>
                        )}
                      />
                    </div>
                 </div>
              </div>
            )}
        
          {/* Question Count */}
          <FormField
            control={form.control}
            name="questionCount"
            render={({ field }) => (
               <FormItem className="w-full space-y-4">
                <div className="w-full">
                    <FormLabel>Number of Questions: {field.value}</FormLabel>
                    <p className="text-xs text-muted-foreground">Set the number of questions for the interview (5-20).</p>
                     <FormMessage className="text-sm text-red-500 mt-1" />
                </div>
                <FormControl>
                   <Slider
                        value={[field.value || 5]}
                        min={5}
                        max={20}
                        step={1}
                        onValueChange={(value: number[]) => field.onChange(value[0])}
                        disabled={loading}
                        className="py-4"
                    />
                </FormControl>
               </FormItem>
            )}
          />
          </div>
          </div>

          <div className="w-full flex items-center justify-end gap-6 pt-4">
            <Button
              type="button"
              size={"sm"}
              variant={"outline"}
              disabled={form.formState.isSubmitting || loading}
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button
              type="submit"
              size={"lg"}
              disabled={isButtonDisabled}
              className="min-w-[150px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>{actions}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </FormProvider>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-0 shadow-2xl">
           <div className="bg-white p-6 pt-8 flex flex-col items-center text-center gap-4">
               <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-2">
                  <AlertTriangle className="w-8 h-8 text-amber-500 fill-amber-500/10" />
               </div>
               
               <div className="space-y-2">
                  <DialogTitle className="text-xl font-bold text-neutral-800">
                    Update Interview Details?
                  </DialogTitle>
                  <DialogDescription className="text-neutral-500 max-w-[300px] mx-auto leading-relaxed">
                    This action will <span className="font-semibold text-red-600">permanently remove</span> your previous answers and regenerate new questions.
                  </DialogDescription>
               </div>
           </div>
           
           <div className="bg-neutral-50 p-6 flex items-center gap-3 border-t">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="w-full h-11 border-neutral-200 hover:bg-white hover:text-neutral-900 font-medium"
              >
                Cancel
              </Button>
              <Button 
                onClick={onConfirmUpdate} 
                disabled={loading}
                className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-md transition-all active:scale-95"
              >
                {loading ? (
                   <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                   </div>
                ) : (
                  "Yes, Update It"
                )}
              </Button>
           </div>
        </DialogContent>
      </Dialog>

      {loading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-card p-8 rounded-lg shadow-lg border max-w-md w-full text-center space-y-4">
                   <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader className="w-8 h-8 text-primary animate-spin" />
                   </div>
                  <h3 className="text-xl font-semibold">Generating Interview</h3>
                  <p className="text-muted-foreground">
                      Our AI is analyzing your profile and crafting tailored questions. This may take 10-15 seconds.
                  </p>
              </div>
          </div>
      )}
    </div>
  );
};

