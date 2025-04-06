import { PortableTextBlock } from "sanity";

export type CourseProgress = {
  courseProgress: number;
  completedLessons: number;
  totalLessons: number;
};

export type Course = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  instructor?: {
    name: string;
    bio?: string;
    imageUrl?: string;
  };
  category?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  modules?: Module[];
};

export type Module = {
  _id: string;
  title: string;
  description?: string;
  lessons?: Lesson[];
  position: number;
};

export type Lesson = {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  position: number;
  isCompleted?: boolean;
  courseId?: string;
  moduleId?: string;
  content?: PortableTextBlock[];
  videoDuration?: number;
};

export type Category = {
  _id: string;
  name: string;
  description?: string;
  zoomLink?: string;
  zoomPassword?: string;
  nextMeetingDate?: string;
  meetingDuration?: number;
  isPresential?: boolean;
};

export type Student = {
  _id: string;
  clerkId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  username?: string;
  email?: string;
  imageUrl?: string;
  category?: {
    _ref: string;
    _type: "reference";
  };
  categoryInfo?: Category;
};

export type Meeting = {
  _id: string;
  title: string;
  date: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  isVirtual: boolean;
  zoomLink?: string;
  zoomPassword?: string;
  useCustomZoomLink?: boolean;
  location?: string;
  categoryInfo?: Category;
  attendanceCount?: number;
  category?: {
    _ref: string;
    _type: "reference";
  };
};

export type Attendance = {
  _id: string;
  student: {
    _ref: string;
    _type: "reference";
  };
  studentInfo?: Student;
  category: {
    _ref: string;
    _type: "reference";
  };
  categoryInfo?: Category;
  meeting?: {
    _ref: string;
    _type: "reference";
  };
  meetingInfo?: Meeting;
  meetingId?: string;
  date: string;
  attended: boolean;
  ip?: string;
  userAgent?: string;
};
