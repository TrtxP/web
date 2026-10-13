export interface UserStatus {
  text: string;
  colorClass: string;
  isOnline: boolean;
}

export const getUserStatus = (
  isOnline: boolean,
  lastSeenAt?: string | null,
): UserStatus => {
  if (isOnline) {
    return { text: "Online", colorClass: "status-success", isOnline: true };
  }

  if (!lastSeenAt) {
    return { text: "Offline", colorClass: "status-secondary", isOnline: false };
  }

  const now = new Date();
  const lastSeen = new Date(lastSeenAt);
  const diffInMs = now.getTime() - lastSeen.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 1) {
    return {
      text: "Last seen now",
      colorClass: "status-warning",
      isOnline: false,
    };
  }
  if (diffInMinutes < 60) {
    return {
      text: `Last seen ${diffInMinutes} ${diffInMinutes > 1 ? "minutes" : "minute"} ago`,
      colorClass: "status-warning",
      isOnline: false,
    };
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return {
      text: `Last seen ${diffInHours} hours ago`,
      colorClass: "status-secondary",
      isOnline: false,
    };
  }

  return {
    text: `Last seen ${lastSeen.toLocaleDateString("uk-UA")}`,
    colorClass: "status-offline",
    isOnline: false,
  };
};

