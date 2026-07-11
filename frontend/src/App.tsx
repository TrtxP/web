import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Layout } from "./components/Layout"
import { Recommendations } from "./pages/Recommendations"
import { Auth } from "./pages/Auth"
import { Chat } from "./pages/Chat"

// TODO: Реалізувати відображення профілю у файлі Profile.tsx
const MyProfilePlaceHolder = () => (
  <div className="max-w-wd mx-auto text-center py-12 bg-white border rounded-2xl shadow-sm py-6">
    <div className="text-5xl mb-4">👤</div>
    <h2 className="text-xl font-black text-gray-800">My Profile</h2>
    <p className="text-gray-500 text-sm mt-1">
      The personal configuration and editing panel is currently under construction.
    </p>
  </div>
)

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/recommendations" element={<Recommendations />}/>
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<MyProfilePlaceHolder />} />
            <Route path="*" element={<Navigate to="/recommendations" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
