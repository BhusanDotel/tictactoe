import React from "react";
import Home from "./assets/pages/Home";
import { Route, Routes } from "react-router-dom";
import LocalPlayGround from "./assets/pages/LocalPlayGround";
// import OnlinePlayGround from "./assets/pages/OnlinePlayGround";
import Room from "./assets/pages/Room";

function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="/playlocal" element={<LocalPlayGround />} />
      <Route path="/playonline" element={<Room />} />
    </Routes>
  );
}

export default App;
