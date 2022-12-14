import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import EditorPage from './pages/EditorPage';
import Home from './pages/Home';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    // <div className="App">
    //   CoCo
    // </div>
    <>
      <div>
        <Toaster 
          position="top-right"
        ></Toaster>
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/editor/:room_id" element={<EditorPage />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
