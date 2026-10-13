import React, { useEffect, useState } from "react";
import {
  type FullProfileModalProps,
  type UserProfileStatusUpdate,
} from "../types";
import { api } from "../services/matchService";
import { websocketService } from "../services/websocket";
import { getAvatarUrl } from "../utils/avatar";

export const FullProfileModal: React.FC<FullProfileModalProps> = ({
  profile: initialProfile,
  onClose,
}) => {
  const profile = initialProfile;
  const initialOnline =
    initialProfile.isOnline ??
    (initialProfile as { online?: boolean }).online ??
    false;

  const [statusOverride, setStatusOverride] =
    useState<UserProfileStatusUpdate | null>(null);

  const isOnline =
    statusOverride?.userId === initialProfile.id
      ? statusOverride.isOnline
      : Boolean(initialOnline);

  // 1. При открытии модалки сразу запрашиваем актуальный статус пользователя
  useEffect(() => {
    if (!initialProfile?.id) return;

    api
      .get<{ isOnline?: boolean; online?: boolean }>(
        `/users/${initialProfile.id}/profile`
      )
      .then((res) => {
        const currentStatus = res.data.isOnline ?? res.data.online;
        if (typeof currentStatus === "boolean") {
          setStatusOverride({
            userId: initialProfile.id,
            isOnline: currentStatus,
            lastSeenAt: initialProfile.lastSeenAt || "",
          });
        }
      })
      .catch(() => {
        // Fallback на /users/{id}
        api
          .get<{ isOnline?: boolean; online?: boolean }>(
            `/users/${initialProfile.id}`
          )
          .then((res) => {
            const currentStatus = res.data.isOnline ?? res.data.online;
            if (typeof currentStatus === "boolean") {
              setStatusOverride({
                userId: initialProfile.id,
                isOnline: currentStatus,
                lastSeenAt: initialProfile.lastSeenAt || "",
              });
            }
          })
          .catch(console.error);
      });
  }, [initialProfile?.id, initialProfile?.lastSeenAt]);

  // 2. Слушаем изменения статуса в реальном времени без перезагрузки
  useEffect(() => {
    if (!initialProfile?.id) return;

    const unsubscribe = websocketService.subscribe(
      `/topic/users.status`,
      (data: unknown) => {
        const serverData = data as { userId: number; status: string };

        if (
          serverData &&
          Number(serverData.userId) === Number(initialProfile.id)
        ) {
          setStatusOverride({
            userId: Number(serverData.userId),
            isOnline: serverData.status === "ONLINE",
            lastSeenAt:
              serverData.status === "OFFLINE"
                ? new Date().toISOString()
                : initialProfile.lastSeenAt || "",
          });
        }
      },
    );

    return () => unsubscribe();
  }, [initialProfile?.id, initialProfile?.lastSeenAt]);

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex justify-center items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-10 relative overflow-y-auto max-h-[95vh] animate-in slide-in-from-bottom-5 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full w-10 h-10 flex items-center justify-center text-2xl transition-colors z-10"
          title="Close profile"
        >
          &times;
        </button>

        <div className="flex flex-col items-center text-center border-b border-gray-100 pb-8 mb-8">
          <div className="relative w-36 h-36 mb-6">
            {profile.profilePictureUrl ? (
              <img
                src={getAvatarUrl(profile.profilePictureUrl)}
                alt={profile.name}
                className="w-full h-full object-cover rounded-full border-4 border-gray-50 shadow-md"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-6xl font-bold shadow-inner">
                👤
              </div>
            )}
          </div>

          <h2 className="text-3xl font-black text-gray-900 mb-2">
            {profile.name}
          </h2>

          <div className="flex items-center gap-2 text-gray-500 text-base mb-5">
            <span>📍 {profile.city || "Not specified"}</span>
            {profile.age && <span>• {profile.age} years old</span>}
            {profile.gender && <span>• {profile.gender}</span>}
          </div>

          <span
            className={`${
              isOnline
                ? "inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 inset-ring inset-ring-green-600/20"
                : "inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 inset-ring inset-ring-yellow-600/20"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 shadow-inner">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <span>📝</span> About Me
            </h3>
            <p className="text-gray-700 leading-relaxed text-base italic bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              {profile.aboutMe
                ? `"${profile.aboutMe}"`
                : "User hasn't shared a bio yet."}
            </p>
          </div>

          <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 shadow-inner">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <span>🔥</span> Interests & Hobbies
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {profile.interests && profile.interests.length > 0 ? (
                profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-2 rounded-xl border border-blue-100/50 shadow-sm"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No interests specified.</p>
              )}
            </div>
          </div>

          <div className="md:col-span-2 bg-gray-50/50 border border-gray-100 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 shadow-inner">
            <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
                Looking For
              </span>
              <span className="text-base font-semibold text-gray-800">
                {profile.lookingFor || "Relationships"}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
                Favorite Food
              </span>
              <span className="text-base font-semibold text-gray-800">
                {profile.favoriteFood || "Not specified"}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
                Favorite Music
              </span>
              <span className="text-base font-semibold text-gray-800">
                {profile.favoriteMusic || "Not specified"}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 uppercase font-bold block">
                  Long Walks
                </span>
                <span className="text-base font-semibold text-gray-800">
                  Likes to walk?
                </span>
              </div>
              <span className="text-3xl">
                {profile.likesLongWalks ? "❤️" : "🤷‍♂️"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
