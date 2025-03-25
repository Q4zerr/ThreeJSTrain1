import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Burger from './components/Menu/Burger'
import Home from './pages/Home'
import Samurai from './pages/Samurai'

function App() {

  return (
    <Router>
      <Burger/>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/samurai" element={<Samurai/>}/>
      </Routes>
    </Router>
  )
}

export default App
