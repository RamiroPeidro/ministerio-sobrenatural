"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuizModal } from "@/components/QuizModal";
import { PortableText } from "@portabletext/react";
import { VideoPlayer } from "@/components/VideoPlayer";

interface LessonPageClientProps {
  lesson: {
    _id: string;
    title?: string;
    description?: string;
    videoUrl?: string;
    content?: any[];
  };
  studentId: string;
}

export function LessonPageClient({ lesson, studentId }: LessonPageClientProps) {
  const [showQuiz, setShowQuiz] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleVideoCompleted = (event: CustomEvent) => {
      if (event.detail.lessonId === lesson._id) {
        setShowQuiz(true);
      }
    };

    window.addEventListener("videoCompleted", handleVideoCompleted as EventListener);

    return () => {
      window.removeEventListener("videoCompleted", handleVideoCompleted as EventListener);
    };
  }, [lesson._id]);

  const handleQuizPassed = () => {
    setShowQuiz(false);
    router.refresh();
  };

  return (
    <>
      <div className="space-y-8">
        {/* Video Section */}
        {lesson.videoUrl && <VideoPlayer url={lesson.videoUrl} lessonId={lesson._id} />}

        {/* Lesson Content */}
        {lesson.content && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Lesson Notes</h2>
            <div className="prose prose-blue dark:prose-invert max-w-none">
              <PortableText value={lesson.content} />
            </div>
          </div>
        )}
      </div>

      <QuizModal
        lessonId={lesson._id}
        studentId={studentId}
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        onQuizPassed={handleQuizPassed}
      />
    </>
  );
}
