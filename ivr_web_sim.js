 // Configuration
        const API_BASE_URL = 'http://localhost:8000';  // Your FastAPI backend
        
        // State
        let callActive = false;
        let callStartTime = null;
        let durationInterval = null;
        let currentMenu = 'main';
        let callLog = [];

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            setupKeypad();
        });

        // Setup keypad click handlers
        function setupKeypad() {
            const keys = document.querySelectorAll('.key');
            keys.forEach(key => {
                key.addEventListener('click', function() {
                    if (callActive) {
                        const digit = this.getAttribute('data-key');
                        handleKeyPress(digit);
                    }
                });
            });
        }

        // Start call
        async function startCall() {
            callActive = true;
            callStartTime = Date.now();
            
            // Update UI
            document.getElementById('statusIcon').textContent = '📞';
            document.getElementById('statusText').textContent = 'Call Connected';
            document.getElementById('btnCall').disabled = true;
            document.getElementById('btnHangup').disabled = false;
            document.getElementById('keypad').style.opacity = '1';
            document.getElementById('keypad').style.pointerEvents = 'auto';
            
            // Start call duration timer
            durationInterval = setInterval(updateCallDuration, 1000);
            
            // Log call
            logCall('Outgoing', 'Connected');
            
            // Play welcome message
            await playWelcomeMessage();
        }

        // End call
        function endCall() {
            callActive = false;
            
            // Update UI
            document.getElementById('statusIcon').textContent = '📵';
            document.getElementById('statusText').textContent = 'Call Ended';
            document.getElementById('btnCall').disabled = false;
            document.getElementById('btnHangup').disabled = true;
            document.getElementById('keypad').style.opacity = '0.5';
            document.getElementById('keypad').style.pointerEvents = 'none';
            
            // Stop call duration timer
            clearInterval(durationInterval);
            
            // Log call
            const duration = Math.floor((Date.now() - callStartTime) / 1000);
            logCall('Outgoing', `Ended (${duration}s)`);
            
            // Reset after delay
            setTimeout(() => {
                document.getElementById('statusIcon').textContent = '📞';
                document.getElementById('statusText').textContent = 'Ready to Call';
                document.getElementById('callDuration').textContent = '00:00';
                document.getElementById('ivrOutput').innerHTML = '<p style="opacity: 0.7;">Press "Start Call" to begin...</p>';
                currentMenu = 'main';
            }, 2000);
        }

        // Update call duration
        function updateCallDuration() {
            if (!callStartTime) return;
            
            const seconds = Math.floor((Date.now() - callStartTime) / 1000);
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            
            document.getElementById('callDuration').textContent = 
                `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

        // Play welcome message
        async function playWelcomeMessage() {
            await speakText("Welcome to Air India Airlines Customer Support.");
            await wait(500);
            await speakText("Press 1 for Booking Enquiry.");
            await wait(300);
            await speakText("Press 2 for Flight Status.");
            await wait(300);
            await speakText("Press 9 to speak with an agent.");
        }

        // Handle key press
        async function handleKeyPress(digit) {
            // Visual feedback
            playBeep();
            addToOutput(`[You pressed: ${digit}]`);
            
            // Process based on current menu
            if (currentMenu === 'main') {
                await handleMainMenu(digit);
            } else if (currentMenu === 'booking') {
                await handleBookingMenu(digit);
            }
        }

        // Handle main menu
        async function handleMainMenu(digit) {
            if (digit === '1') {
                currentMenu = 'booking';
                await speakText("You selected Booking Enquiry.");
                await wait(500);
                await speakText("Press 1 for Domestic Flights.");
                await wait(300);
                await speakText("Press 2 for International Flights.");
                await wait(300);
                await speakText("Press 0 to go back to main menu.");
            } else if (digit === '2') {
                await speakText("You selected Flight Status.");
                await wait(500);
                await speakText("Please enter your 6-digit PNR number followed by hash.");
            } else if (digit === '9') {
                await speakText("Transferring you to an agent. Please hold.");
                await wait(2000);
                endCall();
            } else {
                await speakText("Sorry, that was not a valid option. Please try again.");
            }
        }

        // Handle booking menu
        async function handleBookingMenu(digit) {
            if (digit === '1') {
                await speakText("You selected Domestic Flights.");
                await wait(500);
                await speakText("Our team will call you back within 5 minutes.");
                await wait(500);
                await speakText("Thank you for calling Air India. Goodbye.");
                await wait(1000);
                endCall();
            } else if (digit === '2') {
                await speakText("You selected International Flights.");
                await wait(500);
                await speakText("Please visit our website airindia.com for international bookings.");
                await wait(500);
                await speakText("Thank you. Goodbye.");
                await wait(1000);
                endCall();
            } else if (digit === '0') {
                currentMenu = 'main';
                await playWelcomeMessage();
            } else {
                await speakText("Invalid option. Please try again.");
            }
        }

        // Speak text (simulated)
        async function speakText(text) {
            const outputDiv = document.getElementById('ivrOutput');
            const speakingIndicator = document.getElementById('speakingIndicator');
            
            // Show speaking indicator
            speakingIndicator.classList.add('active');
            
            // Add text to output
            const p = document.createElement('p');
            p.textContent = `🔊 ${text}`;
            outputDiv.appendChild(p);
            
            // Auto-scroll to bottom
            outputDiv.scrollTop = outputDiv.scrollHeight;
            
            // Simulate speaking duration (based on text length)
            const duration = text.length * 50; // 50ms per character
            await wait(duration);
            
            // Hide speaking indicator
            speakingIndicator.classList.remove('active');
        }

        // Add text to output
        function addToOutput(text) {
            const outputDiv = document.getElementById('ivrOutput');
            const p = document.createElement('p');
            p.textContent = text;
            p.style.color = '#4ecca3';
            outputDiv.appendChild(p);
            outputDiv.scrollTop = outputDiv.scrollHeight;
        }

        // Play DTMF beep sound (simulated)
        function playBeep() {
            // In real implementation, play actual DTMF tone
            console.log('DTMF tone played');
        }

        // Log call
        function logCall(type, status) {
            const time = new Date().toLocaleTimeString();
            const logEntry = `${time} - ${type} - ${status}`;
            callLog.unshift(logEntry);
            
            const historyDiv = document.getElementById('callHistory');
            historyDiv.innerHTML = callLog.slice(0, 5).map(entry => 
                `<div class="history-item">${entry}</div>`
            ).join('');
        }

        // Utility: Wait
        function wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }