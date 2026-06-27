import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/home/Home';
import Login from './components/login/Login';
import Register from './components/register/Register';
import Admin from './components/admin/Admin';
import ForgotPassword from './components/forgot-password/ForgotPassword';
// import Todo from './components/todo/Todo';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* <Route path="/todo" element={<Todo />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
