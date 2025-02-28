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
let meetingCode = ""; // Store the current meeting code

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing...");
    
    // Set default values
    // participantsInput.value = "Charlie\nChandler\nJace\nJustin";
    
    // Add event listener for generate code button if it exists
    const generateCodeButton = document.getElementById('generateCodeButton');
    if (generateCodeButton) {
        generateCodeButton.addEventListener('click', function() {
            const codeInput = document.getElementById('meetingCode');
            codeInput.value = generateMeetingCode();
        });
    }
    
    // Add event listeners
    startButton.addEventListener('click', function() {
        console.log("Start button clicked");
        const participants = document.getElementById('participants').value.split('\n').filter(name => name.trim() !== '');
        const totalTime = document.getElementById('totalTime').value;

        // Get or generate a meeting code
        meetingCode = document.getElementById('meetingCode')?.value || generateMeetingCode();
        if (document.getElementById('meetingCode')) {
            document.getElementById('meetingCode').value = meetingCode;
        }
        
        // Update the active code display if it exists
        const activeCodeElement = document.getElementById('activeCode');
        if (activeCodeElement) {
            activeCodeElement.textContent = meetingCode;
        }
        
        // Update participant count if the element exists
        const participantCountElement = document.getElementById('participantCount');
        if (participantCountElement) {
            participantCountElement.textContent = participants.length;
        }

        // Retrieve existing meetings from local storage
        const meetings = JSON.parse(localStorage.getItem('meetings')) || [];

        // Create a new meeting entry
        const newMeeting = {
            date: new Date().toISOString(),
            participants: participants,
            totalTime: totalTime,
            code: meetingCode
        };

        // Add the new meeting to the array
        meetings.push(newMeeting);

        // Save the updated meetings array to local storage
        localStorage.setItem('meetings', JSON.stringify(meetings));
        
        // Save the current meeting code for remote connections
        localStorage.setItem('currentMeetingCode', meetingCode);

        // Log to confirm data is saved
        console.log('New meeting saved:', newMeeting);
        
        // Create meeting in MeetingData if available
        if (window.MeetingData) {
            window.MeetingData.createMeeting(meetingCode, 'Host', totalTime);
            
            // Add each participant to the meeting
            participants.forEach(name => {
                window.MeetingData.addParticipant(meetingCode, name, 0);
            });
        }

        // Start the meeting
        startMeeting();
    });
    
    prevButton.addEventListener('click', previousSpeaker);
    pauseButton.addEventListener('click', togglePause);
    nextButton.addEventListener('click', nextSpeaker);
    resetButton.addEventListener('click', resetMeeting);
});

// Function to generate a random meeting code
function generateMeetingCode() {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar looking characters
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Poll for remote participants (simulates real-time updates)
function pollForRemoteParticipants() {
    // Check if MeetingData is available
    if (!window.MeetingData) return;
    
    // Get the current meeting code
    const meetingCode = localStorage.getItem('currentMeetingCode');
    if (!meetingCode) return;
    
    // Get the meeting data
    const meeting = window.MeetingData.getMeeting(meetingCode);
    if (!meeting) return;
    
    // Update the participant count
    const participantCountElement = document.getElementById('participantCount');
    if (participantCountElement) {
        participantCountElement.textContent = meeting.participants.length;
    }
    
    // Update the speakers list with remote participants
    if (speakersListElement && meeting.participants.length > 0) {
        // Get the current speakers already displayed
        const currentSpeakers = new Set();
        speakersListElement.querySelectorAll('.speaker-item').forEach(item => {
            // Extract just the name text, not any additional elements
            const name = item.childNodes[0]?.nodeValue;
            if (name) currentSpeakers.add(name.trim());
        });
        
        // Add any new remote participants
        meeting.participants.forEach(participant => {
            if (!currentSpeakers.has(participant.name) && !participants.includes(participant.name)) {
                // Add to the local participants array
                participants.push(participant.name);
                
                // Recalculate time per speaker
                const totalMinutes = parseInt(totalTimeInput.value) || 30;
                timePerSpeaker = Math.floor((totalMinutes * 60) / participants.length);
                
                // Update the speakers list
                updateSpeakersList();
            }
        });
    }
    
    // Poll again after a short delay
    setTimeout(pollForRemoteParticipants, 5000);
}

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
    
    // Save participants to local storage
    localStorage.setItem('meetingParticipants', JSON.stringify(participants));
    localStorage.setItem('meetingTotalTime', totalTimeInput.value);
    
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
    
    // Start polling for remote participants
    pollForRemoteParticipants();
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
            
            // Update meeting state in MeetingData if available
            if (window.MeetingData && meetingCode) {
                window.MeetingData.updateMeetingState(
                    meetingCode, 
                    participants[currentSpeakerIndex], 
                    0, 
                    true
                );
            }
            
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
                    
                    // Update meeting state in MeetingData if available
                    if (window.MeetingData && meetingCode) {
                        window.MeetingData.updateMeetingState(
                            meetingCode, 
                            participants[currentSpeakerIndex], 
                            timeRemaining, 
                            false
                        );
                    }
                    
                    updateTimerDisplay();
                    updateSpeakersList();
                    startTimer();
                }
            }, 1000);
        } else {
            timeRemaining--;
            updateTimerDisplay();
            
            // Update meeting state in MeetingData if available (less frequently)
            if (window.MeetingData && meetingCode && timeRemaining % 5 === 0) {
                window.MeetingData.updateMeetingState(
                    meetingCode, 
                    participants[currentSpeakerIndex], 
                    timeRemaining, 
                    false
                );
            }
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
    
    // Add all speakers
    participants.forEach((name, index) => {
        const speakerElement = document.createElement('div');
        speakerElement.textContent = name;
        speakerElement.className = 'speaker-item';
        
        if (completedSpeakers.has(name)) {
            speakerElement.classList.add('completed');
        } else if (index === currentSpeakerIndex) {
            speakerElement.classList.add('current');
        }
        
        speakerElement.addEventListener('click', () => {
            if (confirm(`Jump to ${name}?`)) {
                currentSpeakerIndex = index;
                timeRemaining = timePerSpeaker;
                updateTimerDisplay();
                startTimer();
                
                // Update meeting state in MeetingData if available
                if (window.MeetingData && meetingCode) {
                    window.MeetingData.updateMeetingState(
                        meetingCode, 
                        participants[currentSpeakerIndex], 
                        timeRemaining, 
                        false
                    );
                }
            }
        });
        
        speakersListElement.appendChild(speakerElement);
    });
    
    // Add the "+ Add" button and input field at the end
    const addButton = document.createElement('div');
    addButton.className = 'speaker-item';
    addButton.textContent = '+ Add';
    addButton.style.cursor = 'pointer';
    addButton.id = 'addSpeakerButton';
    
    // Add input field (hidden by default)
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.id = 'newSpeakerName';
    inputField.placeholder = 'New speaker name';
    inputField.style.display = 'none';
    inputField.style.marginRight = '10px';
    inputField.style.padding = '8px';
    inputField.style.borderRadius = '8px';
    inputField.style.border = '1px solid var(--medium-gray)';
    
    // Create a container for the add button and input
    const addContainer = document.createElement('div');
    addContainer.style.display = 'flex';
    addContainer.style.alignItems = 'center';
    addContainer.appendChild(inputField);
    addContainer.appendChild(addButton);
    
    speakersListElement.appendChild(addContainer);
    
    // Add event listener for the add button
    document.getElementById('addSpeakerButton').addEventListener('click', function() {
        const inputField = document.getElementById('newSpeakerName');
        
        // If input is hidden, show it and focus
        if (inputField.style.display === 'none') {
            inputField.style.display = 'inline-block';
            inputField.focus();
        } 
        // If input is visible and has text, add the speaker
        else if (inputField.value.trim() !== '') {
            const newName = inputField.value.trim();
            participants.push(newName);
            
            // Add to MeetingData if available
            if (window.MeetingData && meetingCode) {
                window.MeetingData.addParticipant(meetingCode, newName, 0);
            }
            
            // Recalculate time per speaker
            const totalMinutes = parseInt(totalTimeInput.value) || 30;
            timePerSpeaker = Math.floor((totalMinutes * 60) / participants.length);
            
            // Update displays
            updateSpeakersList();
            
            // Clear the input field
            inputField.value = '';
            inputField.style.display = 'none';
        }
        // If input is visible but empty, just hide it
        else {
            inputField.style.display = 'none';
        }
    });
    
    // Add keypress event for the input field
    document.getElementById('newSpeakerName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim() !== '') {
            const newName = this.value.trim();
            participants.push(newName);
            
            // Add to MeetingData if available
            if (window.MeetingData && meetingCode) {
                window.MeetingData.addParticipant(meetingCode, newName, 0);
            }
            
            // Recalculate time per speaker
            const totalMinutes = parseInt(totalTimeInput.value) || 30;
            timePerSpeaker = Math.floor((totalMinutes * 60) / participants.length);
            
            // Update displays
            updateSpeakersList();
            
            // Clear the input field
            this.value = '';
            this.style.display = 'none';
        }
    });
}

// Move to the previous speaker
function previousSpeaker() {
    if (currentSpeakerIndex > 0) {
        currentSpeakerIndex--;
        timeRemaining = timePerSpeaker;
        updateTimerDisplay();
        updateSpeakersList();
        startTimer();
        
        // Update meeting state in MeetingData if available
        if (window.MeetingData && meetingCode) {
            window.MeetingData.updateMeetingState(
                meetingCode, 
                participants[currentSpeakerIndex], 
                timeRemaining, 
                false
            );
        }
    }
}

// Toggle pause/resume
function togglePause() {
    if (isPaused) {
        // Resume
        startTimer();
    } else {
        // Pause
        clearInterval(timerInterval);
        isPaused = true;
        pauseButton.textContent = 'Resume';
        
        // Update meeting state in MeetingData if available
        if (window.MeetingData && meetingCode) {
            window.MeetingData.updateMeetingState(
                meetingCode, 
                participants[currentSpeakerIndex], 
                timeRemaining, 
                true
            );
        }
    }
}

// Mark current speaker as done and move to the next speaker
function nextSpeaker() {
    // Mark current speaker as completed
    completedSpeakers.add(participants[currentSpeakerIndex]);
    
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
        clearInterval(timerInterval);
        alert('All speakers have completed their turns!');
        updateSpeakersList();
        
        // End meeting in MeetingData if available
        if (window.MeetingData && meetingCode) {
            window.MeetingData.endMeeting(meetingCode);
        }
    } else {
        currentSpeakerIndex = nextIndex;
        timeRemaining = timePerSpeaker;
        updateTimerDisplay();
        updateSpeakersList();
        startTimer();
        
        // Update meeting state in MeetingData if available
        if (window.MeetingData && meetingCode) {
            window.MeetingData.updateMeetingState(
                meetingCode, 
                participants[currentSpeakerIndex], 
                timeRemaining, 
                false
            );
        }
    }
}

// Reset meeting
function resetMeeting() {
    if (confirm('Are you sure you want to reset the meeting?')) {
        clearInterval(timerInterval);
        timerSection.style.display = 'none';
        setupSection.style.display = 'block';
        
        // End meeting in MeetingData if available
        if (window.MeetingData && meetingCode) {
            window.MeetingData.endMeeting(meetingCode);
        }
        
        // Clear the meeting code
        meetingCode = "";
        localStorage.removeItem('currentMeetingCode');
    }
}
