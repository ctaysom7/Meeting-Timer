// This file simulates a server-side database using localStorage
// In a real implementation, this would be replaced with a proper backend

const MeetingData = {
    // Create a new meeting
    createMeeting: function(meetingCode, hostName, totalTime) {
        const meeting = {
            code: meetingCode,
            host: hostName,
            totalTime: totalTime,
            participants: [],
            currentSpeaker: null,
            timeRemaining: 0,
            isPaused: true,
            startTime: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
        };
        
        // Store in localStorage
        this.saveMeeting(meeting);
        return meeting;
    },
    
    // Get meeting by code
    getMeeting: function(meetingCode) {
        const meetings = JSON.parse(localStorage.getItem('activeMeetings') || '{}');
        return meetings[meetingCode] || null;
    },
    
    // Save meeting
    saveMeeting: function(meeting) {
        const meetings = JSON.parse(localStorage.getItem('activeMeetings') || '{}');
        meetings[meeting.code] = meeting;
        localStorage.setItem('activeMeetings', JSON.stringify(meetings));
    },
    
    // Add participant to meeting
    addParticipant: function(meetingCode, participantName, painScore) {
        const meeting = this.getMeeting(meetingCode);
        if (!meeting) return null;
        
        // Check if participant already exists
        const existingIndex = meeting.participants.findIndex(p => p.name === participantName);
        
        if (existingIndex >= 0) {
            // Update existing participant
            meeting.participants[existingIndex].painScore = painScore;
            meeting.participants[existingIndex].lastSeen = new Date().toISOString();
        } else {
            // Add new participant
            meeting.participants.push({
                name: participantName,
                painScore: painScore,
                joined: new Date().toISOString(),
                lastSeen: new Date().toISOString()
            });
        }
        
        meeting.lastUpdate = new Date().toISOString();
        this.saveMeeting(meeting);
        return meeting;
    },
    
    // Update meeting timer state
    updateMeetingState: function(meetingCode, currentSpeaker, timeRemaining, isPaused) {
        const meeting = this.getMeeting(meetingCode);
        if (!meeting) return null;
        
        meeting.currentSpeaker = currentSpeaker;
        meeting.timeRemaining = timeRemaining;
        meeting.isPaused = isPaused;
        meeting.lastUpdate = new Date().toISOString();
        
        this.saveMeeting(meeting);
        return meeting;
    },
    
    // Add a chat message to the meeting
    addChatMessage: function(meetingCode, sender, message) {
        const meeting = this.getMeeting(meetingCode);
        if (!meeting) return null;
        
        // Initialize messages array if it doesn't exist
        if (!meeting.messages) {
            meeting.messages = [];
        }
        
        // Add the message
        meeting.messages.push({
            sender: sender,
            message: message,
            timestamp: new Date().toISOString()
        });
        
        // Limit to last 100 messages
        if (meeting.messages.length > 100) {
            meeting.messages = meeting.messages.slice(-100);
        }
        
        meeting.lastUpdate = new Date().toISOString();
        this.saveMeeting(meeting);
        return meeting;
    },
    
    // End meeting and archive it
    endMeeting: function(meetingCode) {
        const meeting = this.getMeeting(meetingCode);
        if (!meeting) return false;
        
        // Add to meeting history
        const meetingHistory = JSON.parse(localStorage.getItem('meetings') || '[]');
        
        // Create a history entry
        const historyEntry = {
            date: meeting.startTime,
            endDate: new Date().toISOString(),
            participants: meeting.participants.map(p => p.name),
            totalTime: meeting.totalTime
        };
        
        meetingHistory.push(historyEntry);
        localStorage.setItem('meetings', JSON.stringify(meetingHistory));
        
        // Remove from active meetings
        const meetings = JSON.parse(localStorage.getItem('activeMeetings') || '{}');
        delete meetings[meetingCode];
        localStorage.setItem('activeMeetings', JSON.stringify(meetings));
        
        return true;
    },
    
    // Poll for updates (simulate real-time updates)
    pollForUpdates: function(meetingCode, lastUpdate) {
        const meeting = this.getMeeting(meetingCode);
        if (!meeting) return null;
        
        // Check if there are any updates since lastUpdate
        if (new Date(meeting.lastUpdate) > new Date(lastUpdate)) {
            return meeting;
        }
        
        return null;
    }
};

// Export the MeetingData object
window.MeetingData = MeetingData;
