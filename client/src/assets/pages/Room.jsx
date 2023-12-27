import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Room.css";
import { host } from "../utils/apiRoutes";
import { myBaseURL } from "../utils/apiRoutes";
import { createRoomRoute } from "../utils/apiRoutes";
import io from "socket.io-client";

const socket = io.connect(host);

function Room() {
  const _name = localStorage.getItem("name");
  const [rooomURL, setRoomURL] = useState(null);
  const [isCreating, setCreating] = useState(false);
  const [name, setName] = useState(_name);
  const [copied, setCopied] = useState(false);

  const handleName = (e) => {
    setName(e.target.value);
  };

  useEffect(() => {
    socket.on("roomCode", (code) => {
      const roomCode = localStorage.getItem("roomCode");
      if (code === roomCode) {
        window.location.href = `${myBaseURL}/playonline/${code}`;
      }
    });
  }, [socket]);

  const createRoom = () => {
    if (name) {
      name !== _name ? localStorage.setItem("name", name) : "";
      setCreating(true);
      axios.post(createRoomRoute, { name }).then((res) => {
        if (res.data) {
          setRoomURL(`${myBaseURL}/playonline/${res.data}`);
          localStorage.setItem("roomCode", res.data);
          setCreating(false);
        }
      });
    }
  };

  const handleCopyClick = async () => {
    const textToCopy = document.getElementById("textToCopy").innerText;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const doNothing = () => {};

  return (
    <main className="room-main-container">
      <div className="room-content-container">
        <div className="room-name-input-container">
          <input
            value={name}
            name="name"
            onChange={handleName}
            className="room-name-input room-input"
            type="text"
            placeholder="Enter name to play online"
          />
        </div>

        <div className="room-buttons-container">
          <div className="room-create-container">
            <button
              onClick={name ? createRoom : doNothing}
              className={`${
                name ? "room-button" : "room-button disble-button"
              } `}
            >
              Create room
            </button>
            {!isCreating ? (
              rooomURL && (
                <div className="room-url-copy-container">
                  <p id="textToCopy" className="room-code">
                    {rooomURL}
                  </p>
                  <button onClick={handleCopyClick} className="copy-btn">
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )
            ) : (
              <p className="room-code">creating room....</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Room;
