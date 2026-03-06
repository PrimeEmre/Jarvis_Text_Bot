// Character counter
document.getElementById("text-input").addEventListener("input", function () {
    document.getElementById("char-count").textContent = this.value.length;
});

// Playback speed slider
document.getElementById("rate").addEventListener("input", function () {
    document.getElementById("rate-value").textContent = parseFloat(this.value).toFixed(1) + "x";
});

// Main button click
document.getElementById("action-btn").addEventListener("click", synthesizeSpeech);

// Main function
async function synthesizeSpeech() {
    // getting the values from the UI
    const text = document.getElementById("text-input").value.trim();
    const lang = document.getElementById("voice-select").value;
    const rate = parseFloat(document.getElementById("rate").value)
    const btn = document.getElementById("action-btn");

    // show warning if empty
    if (!text) {
        showError("Please enter some text first!");
        return;
    }

    // show loading
    btn.disabled = true;
    btn.querySelector(".btn-text").textContent = "Generating...";
    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("error-msg").classList.add("hidden");
    document.getElementById("audio-section").classList.add("hidden");

    try {
        // send to Flask backend
        const response = await fetch("/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text, lang: lang })
        });

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.error || "Something went wrong")
        }

        // get audio blob
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        // set audio player
        const player = document.getElementById("audio-player")
        player.src = audioUrl
        player.playbackRate = rate
        player.play()

        // set download link
        document.getElementById("download-btn").href = audioUrl

        // show audio section
        document.getElementById("audio-section").classList.remove("hidden")

    } catch (error) {
        showError("Error: " + error.message)
    }

    // reset button
    btn.disabled = false;
    btn.querySelector(".btn-text").textContent = "🎙️ Synthesize Speech"
    document.getElementById("loading").classList.add("hidden")
}

function showError(message) {
    const err = document.getElementById("error-msg")
    err.textContent = message
    err.classList.remove("hidden")
}