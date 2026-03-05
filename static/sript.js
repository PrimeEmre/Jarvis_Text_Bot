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