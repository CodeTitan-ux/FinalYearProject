import { useNavigate } from "react-router-dom";
import {
  Card,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { TooltipButton } from "./tooltip-button";
import { Eye, Loader, Newspaper, Sparkles, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { toast } from "sonner";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/config/firebase.config";
import Modal from "./modal";
import { Interview } from "@/types";

import { useAuth } from "@clerk/clerk-react";

interface InterviewPinProps {
  interview: Interview;
  onMockPage?: boolean;
}

export const InterviewPin = ({
  interview,
  onMockPage = false,
}: InterviewPinProps) => {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const onDelete = async () => {
    setLoading(true);

    try {
      if (!userId) {
         toast.error("Error", {
          description: "User not authenticated",
         });
         return;
      }
      const interviewRef = doc(db, "users", userId, "interviews", interview.id);
      const userAnswerQuery = query(
        collection(db, "users", userId, "userAnswers"),
        where("mockIdRef", "==", interview.id)
      );

      // get all the user answers
      const querySnap = await getDocs(userAnswerQuery);

      const batch = writeBatch(db);

      // delete the interview
      batch.delete(interviewRef);

      // delete the user answers
      querySnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      toast("Success", {
        description: "Your interview has been deleted successfully",
      });
    } catch (error) {
      console.log(error);
      toast("Error", {
        description: "Something went wrong. Please try again later",
      });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Card className="p-4 rounded-md shadow-none hover:shadow-md shadow-gray-100 cursor-pointer transition-all space-y-4">
      <CardTitle className="text-lg">{interview?.position}</CardTitle>
      <CardDescription>{interview?.description}</CardDescription>
      <div className="w-full flex items-center gap-2 flex-wrap">
        {interview?.techStack.split(",").map((word, index) => (
          <Badge
            key={index}
            variant={"outline"}
            className="text-xs text-muted-foreground hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-900"
          >
            {word}
          </Badge>
        ))}
        {interview?.resumeProfile && (
          <Badge
            variant={"secondary"}
            className="text-xs text-indigo-700 bg-indigo-50 border-indigo-200"
          >
            Resume Used
          </Badge>
        )}
      </div>

      <CardFooter
        className={cn(
          "w-full flex items-center p-0",
          onMockPage ? "justify-end" : "justify-between"
        )}
      >
        <p className="text-[12px] text-muted-foreground truncate whitespace-nowrap">
          {`${new Date(interview?.createdAt.toDate()).toLocaleDateString(
            "en-US",
            { dateStyle: "long" }
          )} - ${new Date(interview?.createdAt.toDate()).toLocaleTimeString(
            "en-US",
            { timeStyle: "short" }
          )}`}
        </p>

        {!onMockPage && (
          <div className="flex items-center justify-center">
            <TooltipButton
              content="View"
              buttonVariant={"ghost"}
              onClick={() => {
                navigate(`/generate/${interview?.id}`, { replace: true });
              }}
              disabled={false}
              buttonClassName="hover:text-sky-500"
              icon={<Eye />}
              loading={false}
            />

            <TooltipButton
              content="Feedback"
              buttonVariant={"ghost"}
              onClick={() => {
                navigate(`/generate/feedback/${interview?.id}`, {
                  replace: true,
                });
              }}
              disabled={false}
              buttonClassName="hover:text-yellow-500"
              icon={<Newspaper />}
              loading={false}
            />

            <TooltipButton
              content="Start"
              buttonVariant={"ghost"}
              onClick={() => {
                navigate(`/generate/interview/${interview?.id}`, {
                  replace: true,
                });
              }}
              disabled={false}
              buttonClassName="hover:text-sky-500"
              icon={<Sparkles />}
              loading={false}
            />

            <TooltipButton
              content="Delete"
              buttonVariant={"ghost"}
              onClick={() => setOpen(true)}
              disabled={false}
              buttonClassName="hover:text-red-500"
              icon={<Trash2 />}
              loading={false}
            />
          </div>
        )}
      </CardFooter>
      <Modal
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete your interview and all associated data."
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        <div className="pt-6 space-x-2 flex items-center justify-end w-full">
          <Button
            variant={"outline"}
            onClick={() => setOpen(false)}
            disabled={loading}
            className="hover:text-gray-500"
          >
            Cancel
          </Button>

          <Button
            variant={"destructive"}
            onClick={onDelete}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? (
              <Loader className="min-w-4 min-h-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </Modal>
    </Card>
  );
};
