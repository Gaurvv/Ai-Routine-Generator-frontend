import Login from './components/Login';
import Home from './components/Home';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
    return (
      <>
      <title>AI routinne generator</title>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
    </>
    );
  }

export default App;