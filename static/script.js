// script.js

const connectBtn = document.getElementById("connectBtn");
const statusEl = document.getElementById("status");

connectBtn.addEventListener("click", async () => {
  try {
    // 1. Fetch LiveKit token from backend
    const res = await fetch("http://127.0.0.1:8000/token");
    const data = await res.json();

    if (!data.livekit_url || !data.token) {
      throw new Error("Invalid response from backend");
    }

    // 2. Connect to LiveKit room
    const room = new LivekitClient.Room();
    await room.connect(data.livekit_url, data.token);

    statusEl.textContent = "✅ Connected to LiveKit!";
    console.log("Connected:", room);

    // 3. Publish local microphone & camera
    const localTracks = await LivekitClient.createLocalTracks({
      audio: true,
      video: true,
    });

    for (const track of localTracks) {
      await room.localParticipant.publishTrack(track);
    }
    console.log("🎤 Mic & 📷 Camera published!");

    // 4. Play any remote audio/video (bot or participants)
    room.on("trackSubscribed", (track, publication, participant) => {
      console.log(
        `Subscribed to ${track.kind} from ${participant.identity}`
      );

      if (track.kind === "audio") {
        const audioEl = track.attach();
        audioEl.autoplay = true;
        document.body.appendChild(audioEl); // plays bot/user voice
      }

      if (track.kind === "video") {
        const videoEl = track.attach();
        videoEl.style.width = "300px";
        videoEl.style.height = "200px";
        document.body.appendChild(videoEl);
      }
    });

    // 5. Log participants joining/leaving
    room.on("participantConnected", (participant) => {
      console.log("👤 Participant joined:", participant.identity);
    });

    room.on("participantDisconnected", (participant) => {
      console.log("👋 Participant left:", participant.identity);
    });
  } catch (err) {
    console.error("Connection failed:", err);
    statusEl.textContent = "❌ Connection failed, check console.";
  }
});
