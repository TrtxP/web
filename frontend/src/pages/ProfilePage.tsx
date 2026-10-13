import React from "react";
import { useLocation } from "react-router-dom";
import type { ProfileProps } from "../features/profile-edit/model/types.ts";
import { useProfileEditor } from "../features/profile-edit/hooks/useProfileEditor.ts";
import { useCityAutocomplete } from "../features/profile-edit/hooks/useCityAutocomplete.ts";
import { ProfileSidebarCard } from "../features/profile-edit/ui/ProfileSidebarCard.tsx";
import { ProfileAboutSection } from "../features/profile-edit/ui/ProfileAboutSection.tsx";
import { ProfileInterestsSection } from "../features/profile-edit/ui/ProfileInterestsSection.tsx";
import { ProfilePreferencesSection } from "../features/profile-edit/ui/ProfilePreferencesSection.tsx";
import { EditProfileModal } from "../features/profile-edit/ui/EditProfileModal.tsx";
import type { CitySuggestion } from "../features/profile-edit/model/types.ts";

export const ProfilePage: React.FC<ProfileProps> = ({ onProfileUpdate }) => {
  const location = useLocation();
  const showWarning = location.state?.forceFill === true;

  const {
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
  } = useProfileEditor(onProfileUpdate);

  const {
    citySearch,
    setCitySearch,
    suggestions,
    isSearching,
    selectCity,
    clearSuggestions,
  } = useCityAutocomplete(profile?.city || "", profile?.city || "");

  const onStartEditing = () => {
    handleEditClick();
    if (profile?.city) {
      setCitySearch(profile.city);
    }
  };

  const onCancelEditing = () => {
    handleCancel();
    if (profile?.city) {
      setCitySearch(profile.city);
    }
    clearSuggestions();
  };

  const onCitySelected = (suggestion: CitySuggestion) => {
    selectCity(suggestion);
    handleSelectCity(suggestion);
  };

  const onRecommendByCityOnlyChange = (checked: boolean) => {
    setEditedData((prev) => ({
      ...prev,
      recommendByCityOnly: checked,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="text-4xl mb-2">⚠️</div>
        <h2 className="text-lg font-bold text-red-800">Error</h2>
        <p className="text-red-600 text-sm mt-1">
          {error || "Profile not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {showWarning && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 shadow-sm animate-pulse">
          <span className="text-2xl">⚡</span>
          <div>
            <h4 className="font-bold text-sm">Please complete your profile!</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Fill in your <strong>City</strong>, <strong>Gender</strong>,{" "}
              <strong>Age</strong>, and{" "}
              <strong>What you are looking for</strong> to get access to
              recommendations and other features.
            </p>
          </div>
        </div>
      )}

      {isEditing && isEditDetailsModalOpen && (
        <EditProfileModal
          currentProfile={editedData}
          onSave={handleDetailsModalSave}
          onClose={() => setIsEditDetailsModalOpen(false)}
        />
      )}

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <ProfileSidebarCard
          profile={profile}
          isEditing={isEditing}
          isSaving={isSaving}
          isUploadingPhoto={isUploadingPhoto}
          status={status}
          fileInputRef={fileInputRef}
          onEditClick={onStartEditing}
          onCancel={onCancelEditing}
          onTriggerFileInput={triggerFileInput}
          onFileChange={handleFileChange}
          onDeletePhoto={handleDeletePhoto}
        />

        <div className="md:col-span-2 space-y-6">
          <ProfileAboutSection
            isEditing={isEditing}
            aboutMe={profile.aboutMe}
            editedAboutMe={editedData.aboutMe}
            onChange={handleInputChange}
          />

          <ProfileInterestsSection
            isEditing={isEditing}
            interests={profile.interests}
            editedInterests={editedData.interests}
            onOpenEditModal={() => setIsEditDetailsModalOpen(true)}
          />

          <ProfilePreferencesSection
            isEditing={isEditing}
            profile={profile}
            editedData={editedData}
            onInputChange={handleInputChange}
            onOpenEditModal={() => setIsEditDetailsModalOpen(true)}
            onRecommendByCityOnlyChange={onRecommendByCityOnlyChange}
            citySearch={citySearch}
            onCitySearchChange={setCitySearch}
            suggestions={suggestions}
            isSearching={isSearching}
            onSelectCity={onCitySelected}
          />
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;

