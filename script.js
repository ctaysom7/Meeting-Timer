// DOM Elements
const setupSection = document.getElementById('setup');
const timerSection = document.getElementById('timer');
const participantsInput = document.getElementById('participants');
const totalTimeInput = document.getElementById('totalTime');
const startButton = document.getElementById('startButton');
const currentSpeakerElement = document.getElementById('currentSpeaker');
const currentSpeakerPromptElement = document.getElementById('currentSpeakerPrompt');
const timeDisplayElement = document.getElementById('timeDisplay');
const progressBarElement = document.getElementById('progressBar');
const speakersListElement = document.getElementById('speakersList');
const prevButton = document.getElementById('prevButton');
const pauseButton = document.getElementById('pauseButton');
const nextButton = document.getElementById('nextButton');
const resetButton = document.getElementById('resetButton');

// Timer state
let participants = [];
let currentSpeakerIndex = 0;
let timePerSpeaker = 0; // in seconds
let timeRemaining = 0; // in seconds
let timerInterval = null;
let isPaused = false;
let completedSpeakers = new Set(); // Track completed speakers

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing...");
    
    // Set default values
    participantsInput.value = "Charlie\nWhitney\nCarl\nJerry";
    
    // Add event listeners
    startButton.addEventListener('click', function() {
        console.log("Start button clicked");
        startMeeting();
    });
    
    prevButton.addEventListener('click', previousSpeaker);
    pauseButton.addEventListener('click', togglePause);
    nextButton.addEventListener('click', nextSpeaker);
    resetButton.addEventListener('click', resetMeeting);
});

// Start the meeting
function startMeeting() {
    console.log("Starting meeting...");
    
    // Get participants
    participants = participantsInput.value
        .split('\n')
        .map(name => name.trim())
        .filter(name => name !== '');
    
    if (participants.length === 0) {
        alert('Please enter at least one participant.');
        return;
    }
    
    // Reset completed speakers
    completedSpeakers = new Set();
    
    // Get total meeting time
    const totalMinutes = parseInt(totalTimeInput.value) || 30;
    
    // Calculate time per speaker in seconds
    timePerSpeaker = Math.floor((totalMinutes * 60) / participants.length);
    
    // Show the timer section, hide setup
    setupSection.style.display = 'none';
    timerSection.style.display = 'block';
    
    // Setup first speaker
    currentSpeakerIndex = 0;
    timeRemaining = timePerSpeaker;
    
    // Update displays
    updateTimerDisplay();
    updateSpeakersList();
    
    // Start the timer
    startTimer();
}

// Start the timer countdown
function startTimer() {
    clearInterval(timerInterval);
    isPaused = false;
    pauseButton.textContent = 'Pause';
    
    timerInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            // Time's up for current speaker
            clearInterval(timerInterval);
            timeRemaining = 0;
            updateTimerDisplay();
            
            // Mark speaker as completed
            completedSpeakers.add(participants[currentSpeakerIndex]);
            updateSpeakersList();
            
            // Automatically move to next speaker after a short delay
            setTimeout(() => {
                // Find the next uncompleted speaker
                let nextIndex = currentSpeakerIndex;
                let allCompleted = true;
                
                for (let i = 0; i < participants.length; i++) {
                    nextIndex = (currentSpeakerIndex + i + 1) % participants.length;
                    if (!completedSpeakers.has(participants[nextIndex])) {
                        allCompleted = false;
                        break;
                    }
                }
                
                if (allCompleted) {
                    alert('All speakers have completed their turns!');
                } else {
                    currentSpeakerIndex = nextIndex;
                    timeRemaining = timePerSpeaker;
                    updateTimerDisplay();
                    updateSpeakersList();
                    startTimer();
                }
            }, 1000);
        } else {
            timeRemaining--;
            updateTimerDisplay();
        }
    }, 1000);
}

// Format time as MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update the timer display and progress
function updateTimerDisplay() {
    // Format time
    const formattedTime = formatTime(timeRemaining);
    
    // Update display
    timeDisplayElement.textContent = formattedTime;
    currentSpeakerElement.textContent = participants[currentSpeakerIndex];
    if (currentSpeakerPromptElement) {
        currentSpeakerPromptElement.textContent = participants[currentSpeakerIndex];
    }
    
    // Calculate progress percentage
    const percentComplete = 100 - (timeRemaining / timePerSpeaker * 100);
    
    // Update progress bar
    progressBarElement.style.width = `${100 - percentComplete}%`;
    
    // Update colors based on thresholds
    if (percentComplete >= 90) {
        timeDisplayElement.style.color = 'var(--red)';
        progressBarElement.style.backgroundColor = 'var(--red)';
    } else if (percentComplete >= 50) {
        timeDisplayElement.style.color = 'var(--yellow)';
        progressBarElement.style.backgroundColor = 'var(--yellow)';
    } else {
        timeDisplayElement.style.color = 'var(--green)';
        progressBarElement.style.backgroundColor = 'var(--green)';
    }
}

// Generate and update the speakers list
function updateSpeakersList() {
    speakersListElement.innerHTML = '';
    
    participants.forEach((participant, index) => {
        const speakerItem = document.createElement('div');
        speakerItem.classList.add('speaker-item');
        if (index === currentSpeakerIndex) {
            speakerItem.classList.add('current');
        }
        if (completedSpeakers.has(participant)) {
            speakerItem.classList.add('completed');
        }
        speakerItem.textContent = participant;
        speakersListElement.appendChild(speakerItem);
    });
}

// Move to previous speaker
function previousSpeaker() {
    currentSpeakerIndex = (currentSpeakerIndex - 1 + participants.length) % participants.length;
    timeRemaining = timePerSpeaker;
    updateTimerDisplay();
    updateSpeakersList();
}

// Toggle pause/resume
function togglePause() {
    if (isPaused) {
        isPaused = false;
        pauseButton.textContent = 'Pause';
        startTimer();
    } else {
        isPaused = true;
        pauseButton.textContent = 'Resume';
        clearInterval(timerInterval);
    }
}

// Move to next speaker
function nextSpeaker() {
    completedSpeakers.add(participants[currentSpeakerIndex]);
    currentSpeakerIndex = (currentSpeakerIndex + 1) % participants.length;
    timeRemaining = timePerSpeaker;
    updateTimerDisplay();
    updateSpeakersList();
    startTimer();
}

// Reset the meeting
function resetMeeting() {
    clearInterval(timerInterval);
    setupSection.style.display = 'block';
    timerSection.style.display = 'none';
    participantsInput.value = '';
    totalTimeInput.value = '30';
    currentSpeakerElement.textContent = '';
    timeDisplayElement.textContent = '03:00';
    progressBarElement.style.width = '100%';
    progressBarElement.style.backgroundColor = 'var(--green)';
    speakersListElement.innerHTML = '';
}
