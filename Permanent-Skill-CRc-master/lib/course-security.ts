import type { Course } from "./types";
import { getLevel } from "./levels";

/**
 * Universal security & unlock check for courses.
 * Single source of truth used across Classroom, All Courses, About, and Modals.
 */
export function isCourseAccessible(
  course: Course | null | undefined,
  user: {
    role?: string;
    isPremium?: boolean;
    purchasedCourseIds?: string[];
    points?: number;
  } | null | undefined
): boolean {
  if (!course) return false;

  // 1. Staff (Admin & Manager) have master access to all courses
  if (user?.role === "admin" || user?.role === "manager") {
    return true;
  }

  // 2. Direct individual course purchase unlocks this course
  if (user?.purchasedCourseIds && user.purchasedCourseIds.includes(course.id)) {
    return true;
  }

  // 3. VIP / Premium member access unlocks all courses
  if (user?.isPremium) {
    return true;
  }

  // 4. If course is VIP-exclusive (isPremiumOnly or VIP/PREMIUM badge) and user is not VIP, it is strictly locked
  const isVipCourse = Boolean(
    course.isPremiumOnly ||
    course.badge?.toUpperCase() === "VIP" ||
    course.badge?.toUpperCase() === "PREMIUM"
  );
  if (isVipCourse) {
    return false;
  }

  // 5. Level 1 courses (e.g. Getting Started / Onboarding) are free and always unlocked
  const reqLevel = course.unlockLevel ?? 1;
  if (reqLevel <= 1) {
    return true;
  }

  // 6. If course requires Level > 1 and user is not logged in, course is locked
  if (!user) {
    return false;
  }

  // 7. Canonical level calculation via getLevel(points)
  const userLevel = getLevel(user.points || 0).level;
  return userLevel >= reqLevel;
}
