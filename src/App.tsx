import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Link, Route, Routes } from 'react-router-dom';
import Charts from './components/Charts';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" ></Route>
        <Route path="/charts" element={<Charts />}></Route>
      </Routes>
    </div>
  );
}

export default App;
