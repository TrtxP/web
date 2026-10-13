import { useContext } from "react";
import { CurrentUserContext } from "./CurrentUserContext.ts";

export const useCurrentUser = () => useContext(CurrentUserContext);

