import { api } from "../shared/api/httpClient.ts";
import {
  resolveProfileData,
  getMyFullProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
} from "../entities/user/api/userApi.ts";
import { recommendationsApi } from "../features/recommendations/api/recommendationsApi.ts";
import { connectionsApi } from "../features/connections/api/connectionsApi.ts";
import { chatApi } from "../features/chat/api/chatApi.ts";

export { api, resolveProfileData };

export const matchService = {
  getRecommendations: recommendationsApi.getRecommendations,
  dismissRecommendation: recommendationsApi.dismissRecommendation,
  getFullRecommendations: recommendationsApi.getFullRecommendations,
  getConnections: connectionsApi.getConnections,
  getFullConnections: connectionsApi.getFullConnections,
  getIncomingRequests: connectionsApi.getIncomingRequests,
  connectWithUser: connectionsApi.connectWithUser,
  respondToRequest: connectionsApi.respondToRequest,
  disconnectFromUser: connectionsApi.disconnectFromUser,
  getMyFullProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getOrCreateChat: chatApi.getOrCreateChat,
  getUserChats: chatApi.getUserChats,
};
