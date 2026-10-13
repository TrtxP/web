import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { CurrentUserProvider } from "./providers/CurrentUserProvider.tsx";
import { AppRouter } from "./router/AppRouter.tsx";

export const App: React.FC = () => {
  return (
    <CurrentUserProvider>
      <Router>
        <AppRouter />
      </Router>
    </CurrentUserProvider>
  );
};

export default App;

