"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addComment as addCommentAction,
  approveComment as approveCommentAction,
  rejectComment as rejectCommentAction,
  deleteComment as deleteCommentAction,
  addReview as addReviewAction,
  approveUser as approveUserAction,
  changePassword as changePasswordAction,
  completeLesson as completeLessonAction,
  createCommunity as createCommunityAction,
  joinCommunity as joinCommunityAction,
  purchaseCommunity as purchaseCommunityAction,
  createMember as createMemberAction,
  createPost as createPostAction,
  approvePost as approvePostAction,
  rejectPost as rejectPostAction,
  deletePost as deletePostAction,
  deleteCourse as deleteCourseAction,
  deleteLesson as deleteLessonAction,
  getAppState,
  heartbeat,
  inviteMember as inviteMemberAction,
  markNotificationRead as markNotificationReadAction,
  markNotificationsRead as markNotificationsReadAction,
  markThreadRead as markThreadReadAction,
  purchaseCourse as purchaseCourseAction,
  rejectUser as rejectUserAction,
  deleteMember as deleteMemberAction,
  releaseMemberLogin as releaseMemberLoginAction,
  quickSwitchRole as quickSwitchRoleAction,
  saveCourse as saveCourseAction,
  saveLesson as saveLessonAction,
  saveProject as saveProjectAction,
  deleteProject as deleteProjectAction,
  saveCalendarEvent as saveCalendarEventAction,
  deleteCalendarEvent as deleteCalendarEventAction,
  updateProjectStatus as updateProjectStatusAction,
  selectMeetProject as selectMeetProjectAction,
  updateProjectMeetSync as updateProjectMeetSyncAction,
  updateProjectProgress as updateProjectProgressAction,
  toggleProjectTask as toggleProjectTaskAction,
  addProjectTask as addProjectTaskAction,
  sendMessage as sendMessageAction,
  saveVideoResource as saveVideoResourceAction,
  deleteVideoResource as deleteVideoResourceAction,
  submitApplication,
  toggleLike as toggleLikeAction,
  togglePin as togglePinAction,
  updateMember as updateMemberAction,
  updateProfile as updateProfileAction,
  upgrade as upgradeAction,
} from "@/lib/actions";
import type {
  ActionResult,
  AppState,
  Application,
  CalendarEvent,
  Community,
  EventType,
  PostCategory,
  PublicUser,
  Role,
  Status,
  VideoResource,
} from "@/lib/types";

type MemberInput = {
  name: string;
  email: string;
  password: string;
  username?: string;
  bio?: string;
  location?: string;
  status: Status;
  role?: Role;
  isPremium?: boolean;
  language?: string;
  saleAmount?: number;
  planName?: string;
};

type MemberUpdateInput = {
  userId: string;
  name?: string;
  email?: string;
  username?: string;
  bio?: string;
  location?: string;
  status?: Status;
  role?: Role;
  isPremium?: boolean;
  language?: string;
  password?: string;
  saleAmount?: number;
  planName?: string;
};

const empty: AppState = {
  user: null,
  users: [],
  posts: [],
  comments: [],
  courses: [],
  progress: [],
  events: [],
  projects: [],
  messages: [],
  notifications: [],
  reviews: [],
  stats: null,
  sales: [],
  limited: false,
  communities: [],
  activeCommunityId: "comm-pss",
  videoResources: [],
};

type AppContextValue = AppState & {
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<ActionResult>;
  quickSwitchRole: (role: Role) => Promise<ActionResult>;
  register: (name: string, email: string, password: string, phone: string, notes: string, ref?: string) => Promise<ActionResult>;
  logout: () => Promise<void>;
  apply: (form: Application) => Promise<ActionResult>;
  createPost: (title: string, body: string, category: PostCategory, communityId?: string) => Promise<ActionResult & { pendingApproval?: boolean; message?: string }>;
  approvePost: (postId: string) => Promise<ActionResult>;
  rejectPost: (postId: string) => Promise<ActionResult>;
  deletePost: (postId: string) => Promise<ActionResult>;
  toggleLike: (postId: string) => Promise<ActionResult>;
  addComment: (postId: string, body: string) => Promise<ActionResult>;
  approveComment: (commentId: string) => Promise<ActionResult>;
  rejectComment: (commentId: string) => Promise<ActionResult>;
  deleteComment: (commentId: string) => Promise<ActionResult>;
  togglePin: (postId: string) => Promise<ActionResult>;
  completeLesson: (courseId: string, lessonId: string) => Promise<ActionResult>;
  saveCourse: (input: { id?: string; title: string; description: string; unlockLevel?: number; badge?: string; price?: number; isPremiumOnly?: boolean }) => Promise<ActionResult>;
  deleteCourse: (courseId: string) => Promise<ActionResult>;
  saveLesson: (input: {
    courseId: string;
    lessonId?: string;
    module: string;
    title: string;
    duration: string;
    notes: string;
    videoUrl: string;
    videoTitle: string;
  }) => Promise<ActionResult>;
  deleteLesson: (courseId: string, lessonId: string) => Promise<ActionResult>;
  saveProject: (input: {
    id?: string;
    title: string;
    description: string;
    version?: string;
    leadId: string;
    leadName?: string;
    memberIds: string[];
    mentionedUsernames?: string[];
    progress: number;
    tasks?: { id: string; title: string; completed: boolean }[];
    status: "active" | "completed" | "paused";
    meetSyncTime?: string;
    meetRoom?: string;
    meetUrl?: string;
  }) => Promise<ActionResult>;
  deleteProject: (projectId: string) => Promise<ActionResult>;
  saveCalendarEvent: (input: {
    id?: string;
    title: string;
    start: string;
    end: string;
    type: EventType;
    description: string;
  }) => Promise<ActionResult>;
  deleteCalendarEvent: (id: string) => Promise<ActionResult>;
  updateProjectStatus: (projectId: string, status: "active" | "completed" | "paused") => Promise<ActionResult>;
  selectMeetProject: (projectId: string) => Promise<ActionResult>;
  updateProjectMeetSync: (projectId: string, meetSyncTime: string, meetRoom: string, meetUrl: string) => Promise<ActionResult>;
  updateProjectProgress: (projectId: string, progress: number) => Promise<ActionResult>;
  toggleProjectTask: (projectId: string, taskId: string) => Promise<ActionResult>;
  addProjectTask: (projectId: string, title: string) => Promise<ActionResult>;
  sendMessage: (receiverId: string, body: string) => Promise<ActionResult>;
  markThreadRead: (otherId: string) => Promise<ActionResult>;
  markNotificationRead: (notificationId: string) => Promise<ActionResult>;
  markNotificationsRead: () => Promise<ActionResult>;
  addReview: (rating: number, body: string) => Promise<ActionResult>;
  updateProfile: (input: { name?: string; bio?: string; location?: string; language?: string }) => Promise<ActionResult>;
  changePassword: (current: string, next: string) => Promise<ActionResult>;
  approveUser: (userId: string) => Promise<ActionResult>;
  rejectUser: (userId: string) => Promise<ActionResult>;
  deleteMember: (userId: string) => Promise<ActionResult>;
  createMember: (input: MemberInput) => Promise<ActionResult>;
  updateMember: (input: MemberUpdateInput) => Promise<ActionResult>;
  releaseMemberLogin: (userId: string) => Promise<ActionResult>;
  upgrade: () => Promise<ActionResult>;
  inviteMember: (email: string) => Promise<ActionResult>;
  createCommunity: (input: { name: string; description: string; isPrivate?: boolean }) => Promise<ActionResult>;
  joinCommunity: (communityId: string) => Promise<ActionResult>;
  purchaseCommunity: (communityId: string) => Promise<ActionResult>;
  switchCommunity: (communityId: string) => void;
  activeCommunity?: Community;
  allCommunities: Community[];
  purchaseCourse: (courseId: string) => Promise<ActionResult>;
  saveVideoResource: (data: Partial<VideoResource>) => Promise<ActionResult & { resource?: VideoResource }>;
  deleteVideoResource: (id: string) => Promise<ActionResult>;
  userById: (id: string) => PublicUser | undefined;
};

const AppContext = createContext<AppContextValue | null>(null);

async function postAuth(url: string, body?: unknown): Promise<ActionResult> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => null)) as ActionResult | null;
    if (!data) return { ok: false, error: "The server sent an unexpected response." };
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, error: "This is taking too long. Please try again." };
    }
    return { ok: false, error: "Could not reach the server. Please try again." };
  } finally {
    window.clearTimeout(timer);
  }
}

function isServerActionMismatch(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("was not found on the server") ||
    msg.includes("failed-to-find-server-action") ||
    msg.includes("Failed to find Server Action") ||
    msg.includes("could not be found on the server") ||
    msg.includes("is not a valid Server Action")
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(empty);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await getAppState();
      setState(next);
    } catch (err) {
      if (isServerActionMismatch(err)) {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
        return;
      }
      setState(empty);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const beat = setInterval(() => {
      heartbeat().catch((err) => {
        if (isServerActionMismatch(err) && typeof window !== "undefined") {
          window.location.reload();
        }
      });
    }, 60000);
    return () => clearInterval(beat);
  }, [refresh]);

  const run = useCallback(
    async (fn: () => Promise<ActionResult>) => {
      try {
        const result = await fn();
        if (result.ok) await refresh();
        return result;
      } catch (error) {
        if (isServerActionMismatch(error)) {
          // A new deployment occurred while the client tab was open.
          // Trigger a reload so the browser fetches the latest server action signatures.
          if (typeof window !== "undefined") {
            setTimeout(() => {
              window.location.reload();
            }, 600);
          }
          return {
            ok: false,
            error: "A new version of the application was deployed. Refreshing to load updates...",
          };
        }
        const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
        return { ok: false, error: message };
      }
    },
    [refresh],
  );

  const login = useCallback(
    async (email: string, password: string, rememberMe?: boolean) => {
      const result = await postAuth("/api/auth/login", { email, password, rememberMe });
      if (result.ok) await refresh();
      return result;
    },
    [refresh],
  );
  const quickSwitchRoleFn = useCallback(
    (role: Role) => run(() => quickSwitchRoleAction(role)),
    [run]
  );
  const register = useCallback(
    async (name: string, email: string, password: string, phone: string, notes: string, ref?: string) => {
      const result = await postAuth("/api/auth/register", { name, email, password, phone, notes, ref });
      if (result.ok) await refresh();
      return result;
    },
    [refresh],
  );
  const logout = useCallback(async () => {
    await postAuth("/api/auth/logout");
    setState(empty);
    setLoading(false);
  }, []);
  const apply = useCallback((form: Application) => run(() => submitApplication(form)), [run]);
  const createPostFn = useCallback(
    (title: string, body: string, category: PostCategory, communityId?: string) =>
      run(() => createPostAction({ title, body, category, communityId: communityId || state.activeCommunityId })),
    [run, state.activeCommunityId],
  );
  const approvePostFn = useCallback((postId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === postId ? { ...p, status: "approved" } : p)),
    }));
    return run(() => approvePostAction(postId));
  }, [run]);

  const rejectPostFn = useCallback((postId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === postId ? { ...p, status: "rejected" } : p)),
    }));
    return run(() => rejectPostAction(postId));
  }, [run]);

  const deletePostFn = useCallback((postId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.filter((p) => p.id !== postId),
    }));
    return run(() => deletePostAction(postId));
  }, [run]);

  const toggleLikeFn = useCallback((postId: string) => run(() => toggleLikeAction(postId)), [run]);
  const addCommentFn = useCallback((postId: string, body: string) => run(() => addCommentAction(postId, body)), [run]);

  const approveCommentFn = useCallback((commentId: string) => {
    setState((prev) => ({
      ...prev,
      comments: prev.comments.map((c) => (c.id === commentId ? { ...c, status: "approved" } : c)),
    }));
    return run(() => approveCommentAction(commentId));
  }, [run]);

  const rejectCommentFn = useCallback((commentId: string) => {
    setState((prev) => ({
      ...prev,
      comments: prev.comments.map((c) => (c.id === commentId ? { ...c, status: "rejected" } : c)),
    }));
    return run(() => rejectCommentAction(commentId));
  }, [run]);

  const deleteCommentFn = useCallback((commentId: string) => {
    setState((prev) => ({
      ...prev,
      comments: prev.comments.filter((c) => c.id !== commentId),
    }));
    return run(() => deleteCommentAction(commentId));
  }, [run]);
  const togglePinFn = useCallback((postId: string) => run(() => togglePinAction(postId)), [run]);
  const completeLessonFn = useCallback(
    (courseId: string, lessonId: string) => run(() => completeLessonAction(courseId, lessonId)),
    [run],
  );
  const saveCourseFn = useCallback(
    (input: { id?: string; title: string; description: string; unlockLevel?: number; badge?: string; price?: number; isPremiumOnly?: boolean }) =>
      run(() => saveCourseAction(input)),
    [run],
  );
  const deleteCourseFn = useCallback((courseId: string) => run(() => deleteCourseAction(courseId)), [run]);
  const saveLessonFn = useCallback(
    (input: {
      courseId: string;
      lessonId?: string;
      module: string;
      title: string;
      duration: string;
      notes: string;
      videoUrl: string;
      videoTitle: string;
    }) => run(() => saveLessonAction(input)),
    [run],
  );
  const deleteLessonFn = useCallback(
    (courseId: string, lessonId: string) => run(() => deleteLessonAction(courseId, lessonId)),
    [run],
  );
  const saveProjectFn = useCallback(
    (input: {
      id?: string;
      title: string;
      description: string;
      version?: string;
      leadId: string;
      leadName?: string;
      memberIds: string[];
      mentionedUsernames?: string[];
      progress: number;
      tasks?: { id: string; title: string; completed: boolean }[];
      status: "active" | "completed" | "paused";
      meetSyncTime?: string;
      meetRoom?: string;
      meetUrl?: string;
    }) => run(() => saveProjectAction(input)),
    [run],
  );
  const deleteProjectFn = useCallback((projectId: string) => run(() => deleteProjectAction(projectId)), [run]);
  const saveCalendarEventFn = useCallback(
    (input: {
      id?: string;
      title: string;
      start: string;
      end: string;
      type: EventType;
      description: string;
    }) => run(() => saveCalendarEventAction(input)),
    [run],
  );
  const deleteCalendarEventFn = useCallback(
    (id: string) => run(() => deleteCalendarEventAction(id)),
    [run],
  );
  const updateProjectStatusFn = useCallback(
    (projectId: string, status: "active" | "completed" | "paused") =>
      run(() => updateProjectStatusAction(projectId, status)),
    [run],
  );
  const selectMeetProjectFn = useCallback(
    (projectId: string) => run(() => selectMeetProjectAction(projectId)),
    [run],
  );
  const updateProjectMeetSyncFn = useCallback(
    (projectId: string, meetSyncTime: string, meetRoom: string, meetUrl: string) =>
      run(() => updateProjectMeetSyncAction(projectId, meetSyncTime, meetRoom, meetUrl)),
    [run],
  );
  const updateProjectProgressFn = useCallback(
    (projectId: string, progress: number) => run(() => updateProjectProgressAction(projectId, progress)),
    [run],
  );
  const toggleProjectTaskFn = useCallback(
    (projectId: string, taskId: string) => run(() => toggleProjectTaskAction(projectId, taskId)),
    [run],
  );
  const addProjectTaskFn = useCallback(
    (projectId: string, title: string) => run(() => addProjectTaskAction(projectId, title)),
    [run],
  );
  const sendMessageFn = useCallback(
    (receiverId: string, body: string) => run(() => sendMessageAction(receiverId, body)),
    [run],
  );
  const markThreadReadFn = useCallback((otherId: string) => markThreadReadAction(otherId).then((r) => {
    if (r.ok) refresh();
    return r;
  }), [refresh]);
  const markNotificationReadFn = useCallback(
    (notificationId: string) => {
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
      }));
      return run(() => markNotificationReadAction(notificationId));
    },
    [run]
  );
  const markNotificationsReadFn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
    return run(() => markNotificationsReadAction());
  }, [run]);
  const addReviewFn = useCallback((rating: number, body: string) => run(() => addReviewAction(rating, body)), [run]);
  const updateProfileFn = useCallback(
    (input: { name?: string; bio?: string; location?: string; language?: string }) =>
      run(() => updateProfileAction(input)),
    [run],
  );
  const changePasswordFn = useCallback(
    (current: string, next: string) => run(() => changePasswordAction(current, next)),
    [run],
  );
  const approveUserFn = useCallback(
    (userId: string) => {
      setState((prev) => {
        const target = prev.users.find((u) => u.id === userId);
        const targetEmail = target?.email?.trim().toLowerCase();
        return {
          ...prev,
          users: prev.users.map((u) =>
            u.id === userId || (targetEmail && u.email?.trim().toLowerCase() === targetEmail)
              ? { ...u, status: "approved" }
              : u
          ),
        };
      });
      return run(() => approveUserAction(userId));
    },
    [run]
  );
  const rejectUserFn = useCallback(
    (userId: string) => {
      setState((prev) => {
        const target = prev.users.find((u) => u.id === userId);
        const targetEmail = target?.email?.trim().toLowerCase();
        return {
          ...prev,
          users: prev.users.map((u) =>
            u.id === userId || (targetEmail && u.email?.trim().toLowerCase() === targetEmail)
              ? { ...u, status: "rejected" }
              : u
          ),
        };
      });
      return run(() => rejectUserAction(userId));
    },
    [run]
  );
  const deleteMemberFn = useCallback(
    (userId: string) => {
      setState((prev) => {
        const target = prev.users.find((u) => u.id === userId);
        const targetEmail = target?.email?.trim().toLowerCase();
        return {
          ...prev,
          users: prev.users.filter(
            (u) => u.id !== userId && (!targetEmail || u.email?.trim().toLowerCase() !== targetEmail)
          ),
        };
      });
      return run(() => deleteMemberAction(userId));
    },
    [run]
  );
  const createMemberFn = useCallback((input: MemberInput) => run(() => createMemberAction(input)), [run]);
  const updateMemberFn = useCallback((input: MemberUpdateInput) => run(() => updateMemberAction(input)), [run]);
  const releaseMemberLoginFn = useCallback(
    (userId: string) => run(() => releaseMemberLoginAction(userId)),
    [run],
  );
  const upgradeFn = useCallback(() => run(() => upgradeAction()), [run]);
  const inviteMemberFn = useCallback((email: string) => run(() => inviteMemberAction(email)), [run]);
  const purchaseCourseFn = useCallback(
    (courseId: string) =>
      run(async () => {
        const result = await purchaseCourseAction(courseId);
        if (result.ok) await refresh();
        return result;
      }),
    [run, refresh],
  );
  const createCommunityFn = useCallback(
    (input: { name: string; description: string; isPrivate?: boolean }) =>
      run(async () => {
        const result = await createCommunityAction(input);
        if (result.ok && result.id) {
          setState((prev) => ({ ...prev, activeCommunityId: result.id! }));
        }
        return result;
      }),
    [run],
  );
  const saveVideoResourceFn = useCallback(
    (data: Partial<VideoResource>) =>
      run(async () => {
        const result = await saveVideoResourceAction(data);
        if (result.ok) await refresh();
        return result;
      }),
    [run, refresh],
  );
  const deleteVideoResourceFn = useCallback(
    (id: string) =>
      run(async () => {
        const result = await deleteVideoResourceAction(id);
        if (result.ok) await refresh();
        return result;
      }),
    [run, refresh],
  );
  const switchCommunity = useCallback((communityId: string) => {
    setState((prev) => ({ ...prev, activeCommunityId: communityId }));
  }, []);

  const joinCommunityFn = useCallback(
    (communityId: string) =>
      run(async () => {
        const result = await joinCommunityAction(communityId);
        if (result.ok) {
          await refresh();
          switchCommunity(communityId);
        }
        return result;
      }),
    [run, refresh, switchCommunity],
  );

  const purchaseCommunityFn = useCallback(
    (communityId: string) =>
      run(async () => {
        const result = await purchaseCommunityAction(communityId);
        if (result.ok) {
          await refresh();
          switchCommunity(communityId);
        }
        return result;
      }),
    [run, refresh, switchCommunity],
  );

  const accessibleCommunities = useMemo(() => {
    const list = state.communities || [];
    if (!state.user) {
      return list.filter((c) => {
        const isTeam = c.type === "team" || c.slug === "team-members" || c.id === "comm-team" || c.name.toLowerCase().includes("team");
        return !isTeam && (c.id === "comm-ai-architects" || !c.isPrivate);
      });
    }
    const isStaff = state.user.role === "admin" || state.user.role === "manager";
    const isTeamMember = state.user.role === "team_member";
    const canSeeTeam = isStaff || isTeamMember;

    return list.filter((c) => {
      const isTeam = c.type === "team" || c.slug === "team-members" || c.id === "comm-team" || c.name.toLowerCase().includes("team");
      if (isTeam && !canSeeTeam) return false;

      if (isStaff) return true;
      if (isTeamMember && isTeam) return true;

      // Regular user / student / premium user
      // ONLY the communities that the user purchased or joined for free (or created)
      const joined = state.user?.joinedCommunityIds && state.user.joinedCommunityIds.length > 0
        ? state.user.joinedCommunityIds
        : ["comm-ai-architects"];
      const purchased = state.user?.purchasedCommunityIds || [];
      const isJoined = joined.includes(c.id) || purchased.includes(c.id) || c.createdBy === state.user?.id;
      return isJoined;
    });
  }, [state.communities, state.user]);

  const activeCommunity = useMemo(() => {
    const available = accessibleCommunities.length > 0 ? accessibleCommunities : state.communities || [];
    return available.find((c) => c.id === state.activeCommunityId) || available[0];
  }, [accessibleCommunities, state.communities, state.activeCommunityId]);

  const userById = useCallback(
    (id: string) => state.users.find((u) => u.id === id) || (state.user?.id === id ? state.user : undefined),
    [state.users, state.user],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      communities: accessibleCommunities,
      allCommunities: state.communities || [],
      loading,
      refresh,
      login,
      quickSwitchRole: quickSwitchRoleFn,
      register,
      logout,
      apply,
      createPost: createPostFn,
      approvePost: approvePostFn,
      rejectPost: rejectPostFn,
      deletePost: deletePostFn,
      toggleLike: toggleLikeFn,
      addComment: addCommentFn,
      approveComment: approveCommentFn,
      rejectComment: rejectCommentFn,
      deleteComment: deleteCommentFn,
      togglePin: togglePinFn,
      completeLesson: completeLessonFn,
      saveCourse: saveCourseFn,
      deleteCourse: deleteCourseFn,
      saveLesson: saveLessonFn,
      deleteLesson: deleteLessonFn,
      saveProject: saveProjectFn,
      deleteProject: deleteProjectFn,
      saveCalendarEvent: saveCalendarEventFn,
      deleteCalendarEvent: deleteCalendarEventFn,
      updateProjectStatus: updateProjectStatusFn,
      selectMeetProject: selectMeetProjectFn,
      updateProjectMeetSync: updateProjectMeetSyncFn,
      updateProjectProgress: updateProjectProgressFn,
      toggleProjectTask: toggleProjectTaskFn,
      addProjectTask: addProjectTaskFn,
      sendMessage: sendMessageFn,
      markThreadRead: markThreadReadFn,
      markNotificationRead: markNotificationReadFn,
      markNotificationsRead: markNotificationsReadFn,
      addReview: addReviewFn,
      updateProfile: updateProfileFn,
      changePassword: changePasswordFn,
      approveUser: approveUserFn,
      rejectUser: rejectUserFn,
      deleteMember: deleteMemberFn,
      createMember: createMemberFn,
      updateMember: updateMemberFn,
      releaseMemberLogin: releaseMemberLoginFn,
      upgrade: upgradeFn,
      inviteMember: inviteMemberFn,
      purchaseCourse: purchaseCourseFn,
      createCommunity: createCommunityFn,
      joinCommunity: joinCommunityFn,
      purchaseCommunity: purchaseCommunityFn,
      saveVideoResource: saveVideoResourceFn,
      deleteVideoResource: deleteVideoResourceFn,
      switchCommunity,
      activeCommunity,
      userById,
    }),
    [
      state,
      loading,
      refresh,
      login,
      quickSwitchRoleFn,
      register,
      logout,
      apply,
      createPostFn,
      approvePostFn,
      rejectPostFn,
      deletePostFn,
      toggleLikeFn,
      addCommentFn,
      approveCommentFn,
      rejectCommentFn,
      deleteCommentFn,
      togglePinFn,
      completeLessonFn,
      saveCourseFn,
      deleteCourseFn,
      saveLessonFn,
      deleteLessonFn,
      saveProjectFn,
      deleteProjectFn,
      saveCalendarEventFn,
      deleteCalendarEventFn,
      updateProjectStatusFn,
      selectMeetProjectFn,
      updateProjectMeetSyncFn,
      updateProjectProgressFn,
      toggleProjectTaskFn,
      addProjectTaskFn,
      sendMessageFn,
      markThreadReadFn,
      markNotificationReadFn,
      markNotificationsReadFn,
      addReviewFn,
      updateProfileFn,
      changePasswordFn,
      approveUserFn,
      rejectUserFn,
      deleteMemberFn,
      createMemberFn,
      updateMemberFn,
      releaseMemberLoginFn,
      upgradeFn,
      inviteMemberFn,
      purchaseCourseFn,
      createCommunityFn,
      joinCommunityFn,
      purchaseCommunityFn,
      saveVideoResourceFn,
      deleteVideoResourceFn,
      switchCommunity,
      activeCommunity,
      userById,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
