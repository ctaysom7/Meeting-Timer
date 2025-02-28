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
            // participantsInput.value = "Charlie\nChandler\nJace\nJustin";
            
            // Add event listeners
            startButton.addEventListener('click', function() {
                console.log("Start button clicked");
                const participants = document.getElementById('participants').value.split('\n').filter(name => name.trim() !== '');
                const totalTime = document.getElementById('totalTime').value;

                // Retrieve existing meetings from local storage
                const meetings = JSON.parse(localStorage.getItem('meetings')) || [];

                // Create a new meeting entry
                const newMeeting = {
                    date: new Date().toISOString(),
                    participants: participants,
                    totalTime: totalTime
                };

                // Add the new meeting to the array
                meetings.push(newMeeting);

                // Save the updated meetings array to local storage
                localStorage.setItem('meetings', JSON.stringify(meetings));

                // Log to confirm data is saved
                console.log('New meeting saved:', newMeeting);

                // Redirect to the timer section or start the meeting
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
                    
                    // Recalculate time per speaker
                    const totalMinutes = parseInt(totalTimeInput.value) || 30;
                    timePerSpeaker = Math.floor((totalMinutes * 60) / participants.length);
                    
                    // Update displays
                    updateSpeakersList();
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
                    
                    // Recalculate time per speaker
                    const totalMinutes = parseInt(totalTimeInput.value) || 30;
                    timePerSpeaker = Math.floor((totalMinutes * 60) / participants.length);
                    
                    // Update displays
                    updateSpeakersList();
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
            } else {
                currentSpeakerIndex = nextIndex;
                timeRemaining = timePerSpeaker;
                updateTimerDisplay();
                updateSpeakersList();
                startTimer();
            }
        }
        
        // Reset meeting
        function resetMeeting() {
            if (confirm('Are you sure you want to reset the meeting?')) {
                clearInterval(timerInterval);
                timerSection.style.display = 'none';
                setupSection.style.display = 'block';
            }
        }
