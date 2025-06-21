import React, { useState, useEffect } from "react";
import "./App.css";

const GENIUS_TOKEN = "YOUR_GENIUS_API_TOKEN_HERE";

function App() {
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [songInfo, setSongInfo] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "";
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const downloadLyrics = () => {
    const blob = new Blob([lyrics], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${artist} - ${song} lyrics.txt`;
    link.href = url;
    link.click();
  };

  const fetchLyrics = async () => {
    if (!artist || !song) return;

    setLoading(true);
    setError("");
    setLyrics("");
    setSongInfo(null);

    try {
      // Primary API: lyrics.ovh
      const res = await fetch(`https://api.lyrics.ovh/v1/${artist}/${song}`);
      const data = await res.json();

      if (data.lyrics) {
        setLyrics(data.lyrics);
      } else {
        // Fallback: Genius API
        const geniusRes = await fetch(
          `https://api.genius.com/search?q=${encodeURIComponent(artist + " " + song)}`,
          {
            headers: {
              Authorization: `Bearer ${GENIUS_TOKEN}`,
            },
          }
        );
        const geniusData = await geniusRes.json();
        const hit = geniusData?.response?.hits[0]?.result;

        if (hit?.path) {
          setLyrics(`Lyrics not found in API. View them here:\nhttps://genius.com${hit.path}`);
        } else {
          setError("Lyrics not found. Please try another song.");
        }
      }

      // Song info from iTunes
      const itunesRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(artist + " " + song)}&entity=song&limit=1`
      );
      const itunesData = await itunesRes.json();

      if (itunesData.results.length > 0) {
        const info = itunesData.results[0];
        setSongInfo({
          album: info.collectionName,
          artwork: info.artworkUrl100,
          releaseDate: info.releaseDate.substring(0, 10),
          previewUrl: info.previewUrl,
        });
      }

    } catch (err) {
      setError("An error occurred. Please try again.");
    }

    setLoading(false);
  };

  const renderLyrics = () => {
    if (!lyrics) return null;

    if (lyrics.startsWith("Lyrics not found in API")) {
      const link = lyrics.split("\n")[1];
      return (
        <div className="lyrics-link">
          <p>Lyrics not available in API.</p>
          <a href={link} target="_blank" rel="noreferrer">🔗 View on Genius</a>
        </div>
      );
    }

    return <pre className="lyrics">{lyrics}</pre>;
  };

  return (
    <div className="App">
      <h1>🎵 Lyrics Finder</h1>

      <button className="toggle-mode" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
      </button>

      <div className="inputs">
        <input
          type="text"
          placeholder="Artist"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
        />
        <input
          type="text"
          placeholder="Song Title"
          value={song}
          onChange={(e) => setSong(e.target.value)}
        />
        <button onClick={fetchLyrics}>Search Lyrics</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {songInfo && (
        <div className="song-info">
          <img src={songInfo.artwork} alt="Album" />
          <h3>💿 Album: {songInfo.album}</h3>
          <p>📅 Release Date: {songInfo.releaseDate}</p>
          {songInfo.previewUrl && (
            <audio controls>
              <source src={songInfo.previewUrl} type="audio/mpeg" />
              Your browser does not support the audio tag.
            </audio>
          )}
        </div>
      )}

      {renderLyrics()}

      {lyrics && !lyrics.startsWith("Lyrics not found") && (
        <button onClick={downloadLyrics}>📥 Download Lyrics</button>
      )}
    </div>
  );
}

export default App;
