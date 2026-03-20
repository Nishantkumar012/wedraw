import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'
import { Routes, Route } from "react-router-dom";
import Home from './Home';

import './App.css'
import Signup from './features/auth/Signup';
import Login from './features/auth/Login';

function App() {
  return (
    <Routes >
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup/>}/>
      <Route path="/login" element={<Login/>}/>
      {/* <Route path="/about" element={<About />} /> */}
      {/* <Route path="/contact" element={<Contact />} /> */}
      // should be boards
      {/* <Route path="/rooms" element={<Rooms/>}/> */}
      {/* <Route path="/room/:boardId" element={<Board/>}/> */}
    </Routes>
  );
}

export default App;


