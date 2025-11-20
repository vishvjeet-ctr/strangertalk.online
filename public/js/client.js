/* ===========================
   public/js/client.js
   =========================== */

// ---------- UI refs ----------
const btnStart  = document.getElementById("btnStart");
const btnNext   = document.getElementById("btnNext");
const btnStop   = document.getElementById("btnStop");
const btnMute   = document.getElementById("btnMute");
const btnCam    = document.getElementById("btnCam");

const localVideo  = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const statusDot  = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

const msgBox    = document.getElementById("messages");
const chatForm  = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

// ---------- Socket.IO ----------
const socket = io();
let myId = null;

socket.on("connect", () => {
  myId = socket.id;
  setStatus("Connected • Idle", "idle");
});

socket.on("disconnect", () => {
  setStatus("Disconnected", "bad");
  addMsg("Disconnected from signaling server.", "sys");
  cleanupPeer(false);
});

// ---------- WebRTC State ----------
let pc;
let localStream;
let peerSocketId = null;
let iAmCaller = false;

const rtcConfig = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302"] },
  ],
};

// ---------- Helpers ----------
function setStatus(text, state = "idle") {
  statusText.textContent = text;
  statusDot.style.background = {
    idle: "#777",
    search: "#ffbe55",
    ok: "#3ddc97",
    bad: "#ff5d5d"
  }[state] || "#777";
}

function addMsg(text, type = "sys") {
  const el = document.createElement("div");
  el.className = `msg ${type}`;
  el.innerHTML =
    type === "in"  ? `<span class="who">Stranger:</span> ${escapeHtml(text)}`
  : type === "out" ? `<span class="who">You:</span> ${escapeHtml(text)}`
  : text;
  msgBox.appendChild(el);
  msgBox.scrollTop = msgBox.scrollHeight;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
}

async function ensureMedia() {
  if (localStream) return localStream;
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
  return localStream;
}

function createPC() {
  if (pc) return pc;
  pc = new RTCPeerConnection(rtcConfig);

  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  pc.ontrack = e => remoteVideo.srcObject = e.streams[0];

  pc.onicecandidate = e => e.candidate && socket.emit("signal", { type:"ice", candidate:e.candidate });

  return pc;
}

async function makeOffer() {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit("signal", { type: "offer", sdp: offer });
}

async function makeAnswer(remoteOffer) {
  await pc.setRemoteDescription(remoteOffer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit("signal", { type: "answer", sdp: answer });
}

async function setRemoteAnswer(remoteAnswer) { await pc.setRemoteDescription(remoteAnswer); }

function cleanupPeer() {
  if (pc) pc.close();
  pc = null;
  remoteVideo.srcObject = null;
  peerSocketId = null;
}

// ---------- Buttons ----------
btnStart.onclick = async () => {
  await ensureMedia();
  socket.emit("find");
  setStatus("Searching…", "search");
  addMsg("Searching for stranger...", "sys");
};

btnNext.onclick = () => {
  socket.emit("next");
  cleanupPeer();
  setStatus("Searching…", "search");
};

btnStop.onclick = () => {
  socket.emit("stop");
  cleanupPeer();
  setStatus("Stopped", "idle");
};

// Mic toggle

function cleanupPeer(stopLocal = false) {
  if (pc) pc.close();
  pc = null;

  if (stopLocal && localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
    localVideo.srcObject = null;
  }

  remoteVideo.srcObject = null;
  peerSocketId = null;
  iAmCaller = false;
}


// Cam toggle
btnCam.onclick = () => {
  const t = localStream.getVideoTracks()[0];
  if (t) t.enabled = !t.enabled;
};

// ---------- Chat Send ----------
chatForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text || !peerSocketId) return;
  addMsg(text, "out");
  socket.emit("chat", { text });
  chatInput.value = "";
});

// ---------- Chat Receive (IMPORTANT: Only Once!) ----------
socket.on("chat", ({ text }) => addMsg(text, "in"));

// ---------- Matchmaking Events ----------
socket.on("waiting", () => setStatus("Waiting…", "search"));

socket.on("matched", async ({ peerID }) => {
  peerSocketId = peerID;
  setStatus("Matched! Connecting…", "ok");
  await ensureMedia();
  createPC();

  iAmCaller = myId < peerID;
  if (iAmCaller) makeOffer();
});

socket.on("peer-left", () => {
  addMsg("Stranger left.", "sys");
  cleanupPeer();
  setStatus("Searching…", "search");
});

// ---------- Signaling ----------
socket.on("signal", async (msg) => {
  if (!pc) { await ensureMedia(); createPC(); }

  if (msg.type === "offer") return makeAnswer(msg.sdp);
  if (msg.type === "answer") return setRemoteAnswer(msg.sdp);
  if (msg.type === "ice") return pc.addIceCandidate(msg.candidate);
});

// ---------- On tab close ----------
window.addEventListener("beforeunload", () => socket.emit("stop"));
