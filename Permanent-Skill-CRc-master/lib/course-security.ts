import type { Course } from "./types";

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
  // If user is not yet logged in or hydrating, course access is restricted by default
  if (!user) return false;

  // 1. Staff (Admin & Manager) have master access to all courses
  if (user.role === "admin" || user.role === "manager") {
    return true;
  }

  // 2. Direct individual course purchase
  if (user.purchasedCourseIds && user.purchasedCourseIds.includes(course.id)) {
    return true;
  }

  // 3. VIP / Premium member access unlocks all courses
  if (user.isPremium) {
    return true;
  }

  // 4. If course is VIP-exclusive (isPremiumOnly or VIP badge) and user is not VIP, it is strictly locked
  if (course.isPremiumOnly || course.badge?.toUpperCase() === "VIP") {
    return false;
  }

  // 5. Level-based unlock for regular members
  // Level 1 courses (e.g. Getting Started / Onboarding) are always open to all members
  const reqLevel = course.unlockLevel ?? 1;
  if (reqLevel <= 1) {
    return true;
  }

  // User's current level (calculated from points: 20 pts per level, min 1, max 9)
  const userLevel = Math.min(9, Math.floor((user.points || 0) / 20) + 1);
  return userLevel >= reqLevel;
}
