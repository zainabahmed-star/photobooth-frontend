import './App.css'
import { Routes, Route, Navigate } from "react-router"
import PhotoBooth from "./components/PhotoBooth"
import DesignStudio from "./components/DesignStudio"

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<PhotoBooth />} />
      {import.meta.env.DEV && <Route path='/design' element={<DesignStudio />} />}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}

export default App