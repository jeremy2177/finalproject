import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
// import './App.css'
import Dashboard from "./pages/Dashboard.jsx";
import SideBar from "./components/SideBar.jsx";

function App() {
  const [count, setCount] = useState(0)

  return (
   <div className="app-shell">
     <SideBar />
     <Dashboard />
   </div>
  )
}

export default App
