"use client";

import { useParams } from "next/navigation";
import { ClassroomView } from "@/components/ClassroomView";

export default function CoursePage() {
  const params = useParams<{ slug: string }>();
  return <ClassroomView initialCourseSlug={params?.slug} />;
}
