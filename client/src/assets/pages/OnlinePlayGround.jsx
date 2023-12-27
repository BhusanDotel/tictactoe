import React, { useState, useEffect } from "react";
import Line from "../components/Line";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/OnlinePlayGround.css";
import {
  allowPlayagainRoute,
  denyPlayagainRoute,
  getRoomInfoRoute,
  host,
  joinRoomRoute,
  playagainRoute,
  turnDecidingRoute,
} from "../utils/apiRoutes";
import axios from "axios";
import io from "socket.io-client";

const socket = io.connect(host);

function OnlinePlayGround() {
  let name = localStorage.getItem("name");
  if (!name) {
    function generateRandomCode() {
      const randomCode = Math.floor(Math.random() * 9000) + 1000;
      return randomCode.toString();
    }

    name = prompt("Please enter your name");
    localStorage.setItem("name", `${name}#${generateRandomCode()}`);
  }
  const { roomCodeIn } = useParams();
  const [isWon, setWon] = useState(false);
  const [playersData, setPlayersData] = useState({
    player1: "",
    player2: "",
    player1Score: 0,
    player2Score: 0,
  });
  const [trigger, setTrigger] = useState(0);
  const [winLineCoords, setWinLineCoords] = React.useState();
  const [cellState, setCellState] = useState({});
  const [myName, setMyname] = useState(name);
  const [isMyTurn, setMyTurn] = useState(false);
  const [playAgainVote, setPlayAgainVote] = useState([]);
  const [activeUsers, setActiveUsers] = React.useState([]);
  const navigate = useNavigate();

  const lineCoords = {
    fr: "M10,75 L450,75",
    sr: "M10,225 L450,225",
    tr: "M10,375 L450,375",
    fc: "M75,10 L75,450",
    sc: "M225,10 L225,450",
    tc: "M375,10 L375,450",
    fd: "M10,10 L450,450",
    sd: "M430,10 L10,450",
  };

  socket.emit("roomCode", roomCodeIn);

  useEffect(() => {
    async function checkRoomAvailable() {
      if (name && roomCodeIn) {
        axios.post(joinRoomRoute, { name, roomCodeIn }).then((res) => {
          if (res.data !== "room is available") {
            alert(res.data);
            navigate("/room");
          }
        });
      }
    }

    checkRoomAvailable();
  }, [myName]);

  useEffect(() => {
    const roomcode = roomCodeIn;
    async function getPlayersData() {
      await axios.post(getRoomInfoRoute, { roomcode, name }).then((res) => {
        if (res.data) {
          const _cellState = { ...cellState };
          _cellState[11] = res.data[11];
          _cellState[12] = res.data[12];
          _cellState[13] = res.data[13];
          _cellState[21] = res.data[21];
          _cellState[22] = res.data[22];
          _cellState[23] = res.data[23];
          _cellState[31] = res.data[31];
          _cellState[32] = res.data[32];
          _cellState[33] = res.data[33];
          setCellState(_cellState);
          if (res.data.winCoordsInitials) {
            setWon(true);
            setWinLineCoords(res.data.winCoordsInitials);
          } else {
            setWon(false);
          }
          if (res.data.turn === name) {
            setMyTurn(true);
          } else {
            setMyTurn(false);
          }
          setPlayAgainVote(res.data.playAgainVote);

          const _playersData = { ...playersData };
          if (name === res.data.player1) {
            _playersData.player1 = name;
            _playersData.player1Score = res.data.player1Score;
            _playersData.player2 = res.data.player2;
            _playersData.player2Score = res.data.player2Score;
          } else {
            _playersData.player1 = name;
            _playersData.player1Score = res.data.player2Score;
            _playersData.player2 = res.data.player1;
            _playersData.player2Score = res.data.player1Score;
          }

          setPlayersData(_playersData);
        }
      });
    }
    if (roomcode && name) {
      getPlayersData();
    }

    socket.on("cellState", (data) => {
      if (data) {
        setTrigger(trigger + 1);
      }
    });

    socket.on("playAgain", (data) => {
      if (data) {
        setTrigger(trigger + data);
      }
    });
  }, [trigger, myName, socket]);

  useEffect(() => {
    const activeUserInfo = { username: myName, roomCode: roomCodeIn };
    socket.emit("activeUserInfo", activeUserInfo);
    socket.on("activeUsers", (activeUser) => {
      const _activeUser = [];
      activeUser.forEach((item) => {
        const code1 = parseInt(item.roomcode);
        const code2 = parseInt(roomCodeIn);
        if (code1 === code2) {
          _activeUser.push(item.username);
        }
      });
      setActiveUsers(_activeUser);
    });
  }, [socket]);

  const handleCellClick = async (a, b) => {
    const roomcode = roomCodeIn;
    if (!isWon && a && b && roomcode && name) {
      await axios
        .post(turnDecidingRoute, { a, b, roomcode, name })
        .then((res) => {
          if (res.data) {
            if (res.data === "your turn registered") {
              setTrigger(trigger + 1);
            }
          }
        });
      await socket.emit("cellState", a.toString() + b.toString());
    }
  };

  const PlayAgain = async () => {
    const roomcode = roomCodeIn;
    if (roomcode && name) {
      axios
        .post(playagainRoute, {
          roomcode,
          name,
        })
        .then(async (res) => {
          if (res.data) {
            await socket.emit("playAgain", trigger);
          }
        });
    }
  };

  const allowPlayAgain = async () => {
    const roomcode = roomCodeIn;
    if (roomcode && name) {
      axios
        .post(allowPlayagainRoute, {
          roomcode,
          name,
        })
        .then(async (res) => {
          if (res.data) {
            await socket.emit("playAgain", trigger);
          }
        });
    }
  };

  const denyPlayAgain = async () => {
    const roomcode = roomCodeIn;
    if (roomcode && name) {
      axios
        .post(denyPlayagainRoute, {
          roomcode,
          name,
        })
        .then(async (res) => {
          if (res.data) {
            await socket.emit("playAgain", trigger);
          }
        });
    }
  };

  return (
    <>
      <main className="online-ground-main-container">
        <div className="player1-container player-name-container">
          <div
            className={`active-status ${
              activeUsers.includes(playersData.player1)
                ? "active-status-online"
                : "active-status-offline"
            }`}
          ></div>
          <div
            className={`name-and-score-div ${isMyTurn ? "myturn-boder" : ""}`}
          >
            <h2 className="player-name">{playersData.player1}</h2>
            <p className="score-status">score:{playersData.player1Score}</p>
          </div>
        </div>
        <div className="playground-buttons-container">
          <div className="main-root-container">
            <div className="playground-root">
              <div className="first-row rows">
                <div
                  onClick={() => handleCellClick(1, 1)}
                  className="one-one cells"
                >
                  <div style={{ display: cellState[11] ? "block" : "none" }}>
                    <img src={`/images/${cellState[11]}.png`} alt="" />
                  </div>
                </div>
                <div
                  onClick={() => handleCellClick(1, 2)}
                  className="one-two cells"
                >
                  <div style={{ display: cellState[12] ? "block" : "none" }}>
                    <img src={`/images/${cellState[12]}.png`} alt="" />
                  </div>
                </div>
                <div
                  onClick={() => handleCellClick(1, 3)}
                  className="one-three cells"
                >
                  <div style={{ display: cellState[13] ? "block" : "none" }}>
                    <img src={`/images/${cellState[13]}.png`} alt="" />
                  </div>
                </div>
              </div>

              <div className="second-row rows">
                <div
                  onClick={() => handleCellClick(2, 1)}
                  className="two-one cells"
                >
                  <div style={{ display: cellState[21] ? "block" : "none" }}>
                    <img src={`/images/${cellState[21]}.png`} alt="" />
                  </div>
                </div>
                <div
                  onClick={() => handleCellClick(2, 2)}
                  className="two-two cells"
                >
                  <div style={{ display: cellState[22] ? "block" : "none" }}>
                    <img src={`/images/${cellState[22]}.png`} alt="" />
                  </div>
                </div>
                <div
                  onClick={() => handleCellClick(2, 3)}
                  className="two-three cells"
                >
                  <div style={{ display: cellState[23] ? "block" : "none" }}>
                    <img src={`/images/${cellState[23]}.png`} alt="" />
                  </div>
                </div>
              </div>

              <div className="third-row rows">
                <div
                  onClick={() => handleCellClick(3, 1)}
                  className="three-one cells"
                >
                  <div style={{ display: cellState[31] ? "block" : "none" }}>
                    <img src={`/images/${cellState[31]}.png`} alt="" />
                  </div>
                </div>
                <div
                  onClick={() => handleCellClick(3, 2)}
                  className="three-two cells"
                >
                  <div style={{ display: cellState[32] ? "block" : "none" }}>
                    <img src={`/images/${cellState[32]}.png`} alt="" />
                  </div>
                </div>
                <div
                  onClick={() => handleCellClick(3, 3)}
                  className="three-three cells"
                >
                  <div style={{ display: cellState[33] ? "block" : "none" }}>
                    <img src={`/images/${cellState[33]}.png`} alt="" />
                  </div>
                </div>
              </div>
            </div>
            <div className="line-container">
              {isWon && (
                <Line
                  key={"random key"}
                  lineCoords={lineCoords[winLineCoords]}
                />
              )}
            </div>
          </div>
          <div className=" play-again-container">
            {(playAgainVote.length === 0 || playAgainVote.includes(myName)) && (
              <button
                onClick={PlayAgain}
                className="room-button online-play-button"
              >
                Play Again
              </button>
            )}
            {playAgainVote.length !== 0 && !playAgainVote.includes(myName) && (
              <div className="play-again-accept-deny">
                <p>Opponent wants to play again!</p>
                <button className="btn-playagain" onClick={allowPlayAgain}>
                  Allow
                </button>
                <button className="btn-playagain" onClick={denyPlayAgain}>
                  Deny
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="player2-container player-name-container">
          <div
            className={`active-status ${
              activeUsers.includes(playersData.player2)
                ? "active-status-online"
                : "active-status-offline"
            }`}
          ></div>
          <div
            className={`name-and-score-div ${!isMyTurn ? "myturn-boder" : ""}`}
          >
            <h2 className="player-name">{playersData.player2}</h2>
            <p className="score-status">score:{playersData.player2Score}</p>
          </div>
        </div>
      </main>
    </>
  );
}

export default OnlinePlayGround;
