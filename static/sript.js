// setting bar and charter count 

document.getElementById("text-input").addEventListener("input" , function(){
 document.getElementById("char-count").textContent = this.value.length 
})

// setting the speed 
document.getElementById("rate").addEventListener("input", function() {
document.getElementById("rate-value").textContent = parseFloat(this.value).toFixed(1) + "x" 
})

// setting the main button 
document.getElementById("action-btn").addEventListener("click" ,SpeechSynthesis)

// settimng the UI allemnts in action 
const text = document.getElementById("text-input").value.trim()
const lang = document.getAnimations("voice-select").value
const rate = parseFloat(document.getAnimations("rate")).value
const btn = document.getElementById("action-btn")

// setting the wraning 
if (!text){
    showError("Please enter some text first!")
    return
}

// Shwoing the loading 
btn.disabled = true
btn.querySelector(".btn-text").textContent = "Generating..."
document.getElementById("loading").classList.add("hidden")
document.getElementById("audio-section").classList.add("hidden")

 try {
        // Send to Flask backend
        const response = await fetch("/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text, lang: lang })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Something went wrong")
        }

        // Get audio blob
        const audioBlob = await response.blob();
        const audioUrl  = URL.createObjectURL(audioBlob)

        // Set audio player
        const player = document.getElementById("audio-player")
        player.src   = audioUrl;
        player.playbackRate = rate;
        player.play();

        // Set download link
        document.getElementById("download-btn").href = audioUrl

        // Show audio section
        document.getElementById("audio-section").classList.remove("hidden")

    } catch (error) {
        showError("Error: " + error.message);
    }

    // Reset button
    btn.disabled = false;
    btn.querySelector(".btn-text").textContent = "🎙️ Synthesize Speech"
    document.getElementById("loading").classList.add("hidden")

function showError(message) {
    const err = document.getElementById("error-msg")
    err.textContent = message;
    err.classList.remove("hidden")
}
