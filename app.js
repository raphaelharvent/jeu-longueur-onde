const socket = new WebSocket("wss://jeu-longueur-onde.onrender.com");

const lobby = document.getElementById("lobby");
const game = document.getElementById("game");
const roomName = document.getElementById("roomName");
const roleEl = document.getElementById("role");
const needle = document.getElementById("needle");
const target = document.getElementById("target");
const scoresEl = document.getElementById("scores");
const historyEl = document.getElementById("history");
const spinSound = document.getElementById("spinSound");

let soundOn = true;

toggleTheme.onclick = () => document.body.classList.toggle("light");
toggleSound.onclick = () => {
  soundOn = !soundOn;
  toggleSound.textContent = soundOn ? "🔊" : "🔇";
};

toggleTarget.onclick = () => target.classList.toggle("hidden");

createRoom.onclick = () => {
  socket.send(JSON.stringify({
    type: "createRoom",
    pseudo: pseudo.value,
    themes: themesInput.value.split("\n").filter(Boolean)
  }));
};

joinRoom.onclick = () => {
  socket.send(JSON.stringify({
    type: "joinRoom",
    pseudo: pseudo.value,
    room: roomInput.value.toUpperCase()
  }));
};

newRound.onclick = () => socket.send(JSON.stringify({ type: "newRound" }));
sendGuess.onclick = () => socket.send(JSON.stringify({ type: "guess", value: Number(guess.value) }));

socket.onmessage = e => {
  const data = JSON.parse(e.data);

  if (data.type === "joined") {
    lobby.classList.add("hidden");
    game.classList.remove("hidden");
    roomName.textContent = "Room : " + data.room;
  }

  if (data.type === "role") roleEl.textContent = "Rôle : " + data.role;

  if (data.type === "round") {
    if (soundOn) spinSound.play();
    needle.style.transform = `translate(-50%, -100%) rotate(${data.angle}deg)`;
  }

  if (data.type === "scores") {
    scoresEl.innerHTML = "";
    data.scores.forEach(p => {
      const li = document.createElement("li");
      li.textContent = `${p.pseudo} : ${p.score} pts`;
      scoresEl.appendChild(li);
    });
  }

  if (data.type === "history") {
    const li = document.createElement("li");
    li.textContent = data.text;
    historyEl.prepend(li);
  }
};
