import { useState, useEffect, useRef } from "react";
import type { PrivateAggregatedProfile } from "../../../entities/user/model/types.ts";
import type { CitySuggestion } from "../model/types.ts";
import {
  getMyFullProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
} from "../../../entities/user/api/userApi.ts";
import { useStompSubscription } from "../../../shared/ws/useStompSubscription.ts";
import { getUserStatus, type UserStatus } from "../../../shared/utils/date.ts";

export function useProfileEditor(onProfileUpdate?: () => void) {
  const [profile, setProfile] = useState<PrivateAggregatedProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);
  const [editedData, setEditedData] = useState<
    Partial<PrivateAggregatedProfile>
  >({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  const status: UserStatus | null = profile
    ? getUserStatus(!!profile.isOnline, profile.lastSeenAt)
    : null;

  useEffect(() => {
    let active = true;

    const fetchMyProfile = async () => {
      try {
        setLoading(true);
        const data = await getMyFullProfile();
        if (active) {
          setProfile(data);
          setEditedData(data);
        }
      } catch (err) {
        console.error(`Error loading profile: ${err}`);
        if (active) {
          setError("Failed load profile data");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchMyProfile();

    return () => {
      active = false;
    };
  }, []);

  useStompSubscription(
    "/topic/users.status",
    (message: unknown) => {
      const serverData = message as { userId: number; status: string };

      if (serverData && profile?.id && serverData.userId === profile.id) {
        setProfile((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            isOnline: serverData.status === "ONLINE",
            lastSeenAt:
              serverData.status === "OFFLINE"
                ? new Date().toISOString()
                : prev.lastSeenAt,
          };
        });
      }
    },
    Boolean(profile?.id),
  );

  const handleEditClick = () => {
    if (profile) {
      setEditedData({ ...profile });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({ ...profile });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({
      ...prev,
      [name]: name === "preferredDistance" ? Number(value) : value,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith("image/")) {
      alert("Please, select your photo!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large! Max file size - 5MB.");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const result = await uploadProfilePicture(file);
      const url =
        typeof result === "string" ? result : result.profilePictureUrl;

      setProfile((prev) =>
        prev ? { ...prev, profilePictureUrl: url } : null,
      );
      alert("Profile photo updated successfully");
    } catch (err) {
      console.error(`Error loading photo: ${err}`);
      alert("Falied load your photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (
      !profile ||
      !window.confirm("Are you sure to want to delete a profile photo?")
    ) {
      return;
    }

    try {
      setIsUploadingPhoto(true);
      await deleteProfilePicture();

      setProfile((prev) => (prev ? { ...prev, profilePictureUrl: "" } : null));
      alert("Photo deleted!");
    } catch (err) {
      console.error(`Error deleting photo: ${err}`);
      alert("Failed deleting photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSelectCity = (suggestion: CitySuggestion) => {
    setEditedData((prev) => ({
      ...prev,
      city: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    }));
  };

  const handleDetailsModalSave = (
    updatedProfile: Partial<PrivateAggregatedProfile>,
  ) => {
    setEditedData((prev) => ({
      ...prev,
      ...updatedProfile,
      interests: updatedProfile.interests,
    }));
    setIsEditDetailsModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setIsSaving(true);
      const updatedName = editedData.name || profile.name;

      const profileDTO = {
        aboutMe: editedData.aboutMe,
        city: editedData.city,
        age: editedData.age ? Number(editedData.age) : undefined,
        gender: editedData.gender,
        latitude: editedData.latitude,
        longitude: editedData.longitude,
        preferredDistance: editedData.preferredDistance
          ? Number(editedData.preferredDistance)
          : undefined,
        recommendByCityOnly: editedData.recommendByCityOnly,
      };

      const bioDTO = {
        interests: editedData.interests,
        lookingFor: editedData.lookingFor,
        favoriteFood: editedData.favoriteFood,
        favoriteMusic: editedData.favoriteMusic,
        likesLongWalks: editedData.likesLongWalks,
      };

      await updateProfile(updatedName, profileDTO, bioDTO);

      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...editedData,
          profilePictureUrl: prev.profilePictureUrl,
        };
      });
      setIsEditing(false);

      alert("Profile updated successfully!");

      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (err) {
      console.error(`Error saving profile: ${err}`);
      alert("Failed save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    profile,
    loading,
    error,
    isEditing,
    editedData,
    isSaving,
    isUploadingPhoto,
    isEditDetailsModalOpen,
    fileInputRef,
    status,
    setEditedData,
    setIsEditDetailsModalOpen,
    handleEditClick,
    handleCancel,
    handleInputChange,
    handleFileChange,
    handleDeletePhoto,
    triggerFileInput,
    handleSelectCity,
    handleDetailsModalSave,
    handleSave,
  };
}

