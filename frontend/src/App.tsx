import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Layout } from "./components/Layout"
import { Recommendations } from "./pages/Recommendations"
import { Auth } from "./pages/Auth"
import { Chat } from "./pages/Chat"
import { Profile } from "./components/Profile"

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/recommendations" element={<Recommendations />}/>
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/recommendations" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
