 // App state
 const state = {
    decks: [],
    currentDeck: null,
    currentCard: null,
    cardIsFlipped: false,
    cardsToStudy: [],
    studyStats: {
        totalCards: 0,
        studiedToday: 0,
        totalSessions: 0,
        correctAnswers: 0,
        totalAnswers: 0
    }
};

// Retrieve data from localStorage if available
function loadData() {
    const savedDecks = localStorage.getItem('simpleAnkiDecks');
    if (savedDecks) {
        state.decks = JSON.parse(savedDecks);
    } else {
        // Add a default deck if none exists
        state.decks = [{
            id: generateId(),
            name: 'Default Deck',
            cards: []
        }];
    }
    
    const savedStats = localStorage.getItem('simpleAnkiStats');
    if (savedStats) {
        state.studyStats = JSON.parse(savedStats);
    }
    
    updateDeckList();
    updateCardDeckSelect();
    updateStats();
}

// Generate a unique ID for decks and cards
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('simpleAnkiDecks', JSON.stringify(state.decks));
    localStorage.setItem('simpleAnkiStats', JSON.stringify(state.studyStats));
}

// Update the deck list display
function updateDeckList() {
    const deckList = document.getElementById('deck-list');
    deckList.innerHTML = '';
    
    state.decks.forEach(deck => {
        const dueCards = countDueCards(deck);
        
        const li = document.createElement('li');
        li.className = 'deck-item';
        li.innerHTML = `
            <div class="deck-info">
                <div class="deck-title">${deck.name}</div>
                <div class="deck-count">${deck.cards.length} cards | ${dueCards} due</div>
            </div>
            <div class="deck-actions">
                <button class="study-btn" data-id="${deck.id}">Study</button>
                <button class="delete-btn" data-id="${deck.id}">Delete</button>
            </div>
        `;
        deckList.appendChild(li);
    });
    
    // Add event listeners for the study and delete buttons
    document.querySelectorAll('.study-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const deckId = this.getAttribute('data-id');
            startStudySession(deckId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const deckId = this.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this deck and all its cards?')) {
                state.decks = state.decks.filter(deck => deck.id !== deckId);
                saveData();
                updateDeckList();
                updateCardDeckSelect();
            }
        });
    });
}

// Count how many cards are due in a deck
function countDueCards(deck) {
    const now = new Date();
    return deck.cards.filter(card => {
        return !card.nextReview || new Date(card.nextReview) <= now;
    }).length;
}

// Update the deck select dropdown in the add card form
function updateCardDeckSelect() {
    const select = document.getElementById('card-deck');
    select.innerHTML = '';
    
    state.decks.forEach(deck => {
        const option = document.createElement('option');
        option.value = deck.id;
        option.textContent = deck.name;
        select.appendChild(option);
    });
}

// Update the stats display
function updateStats() {
    document.getElementById('total-cards').textContent = state.studyStats.totalCards;
    document.getElementById('studied-today').textContent = state.studyStats.studiedToday;
    document.getElementById('total-sessions').textContent = state.studyStats.totalSessions;
    
    const retention = state.studyStats.totalAnswers > 0 
        ? Math.round((state.studyStats.correctAnswers / state.studyStats.totalAnswers) * 100) 
        : 0;
    document.getElementById('avg-retention').textContent = `${retention}%`;
}

// Start a study session for a deck
function startStudySession(deckId) {
    state.currentDeck = state.decks.find(deck => deck.id === deckId);
    
    if (!state.currentDeck) {
        alert('Deck not found!');
        return;
    }
    
    // Filter cards that are due for review
    const now = new Date();
    state.cardsToStudy = state.currentDeck.cards.filter(card => {
        return !card.nextReview || new Date(card.nextReview) <= now;
    });
    
    if (state.cardsToStudy.length === 0) {
        alert('No cards due for review in this deck!');
        return;
    }
    
    // Increment total sessions
    state.studyStats.totalSessions++;
    saveData();
    
    // Update study screen
    document.getElementById('study-deck-title').textContent = `Studying: ${state.currentDeck.name}`;
    document.getElementById('cards-left').textContent = state.cardsToStudy.length;
    
    // Count types of cards
    const newCards = state.cardsToStudy.filter(card => !card.interval).length;
    const learningCards = state.cardsToStudy.filter(card => card.interval && card.interval < 1).length;
    const reviewCards = state.cardsToStudy.filter(card => card.interval && card.interval >= 1).length;
    
    document.getElementById('new-count').textContent = newCards;
    document.getElementById('learning-count').textContent = learningCards;
    document.getElementById('review-count').textContent = reviewCards;
    
    // Show first card
    showNextCard();
    
    // Switch to study screen
    showScreen('study-screen');
}

// Show the next card to study
function showNextCard() {
    if (state.cardsToStudy.length === 0) {
        document.getElementById('card-content').textContent = 'Congratulations! You have finished reviewing all due cards.';
        document.getElementById('flip-btn').style.display = 'none';
        document.getElementById('finish-btn').style.display = 'block';
        document.querySelector('.rating-buttons').style.display = 'none';
        return;
    }
    
    // Get next card (randomize order)
    const randomIndex = Math.floor(Math.random() * state.cardsToStudy.length);
    state.currentCard = state.cardsToStudy[randomIndex];
    state.cardsToStudy.splice(randomIndex, 1);
    
    // Reset card display
    state.cardIsFlipped = false;
    document.getElementById('card-content').textContent = state.currentCard.front;
    document.getElementById('card-content').className = 'card-front';
    document.getElementById('flip-btn').textContent = 'Show Answer';
    document.getElementById('flip-btn').style.display = 'block';
    document.querySelector('.rating-buttons').style.display = 'none';
    
    // Update cards left
    document.getElementById('cards-left').textContent = state.cardsToStudy.length;
}

// Flip the current card
function flipCard() {
    state.cardIsFlipped = !state.cardIsFlipped;
    
    if (state.cardIsFlipped) {
        document.getElementById('card-content').textContent = state.currentCard.back;
        document.getElementById('card-content').className = 'card-back';
        document.getElementById('flip-btn').textContent = 'Show Question';
        document.querySelector('.rating-buttons').style.display = 'flex';
    } else {
        document.getElementById('card-content').textContent = state.currentCard.front;
        document.getElementById('card-content').className = 'card-front';
        document.getElementById('flip-btn').textContent = 'Show Answer';
        document.querySelector('.rating-buttons').style.display = 'none';
    }
}

// Process the user's rating of a card
function processCardRating(rating) {
    // Update card scheduling based on rating
    const card = state.currentCard;
    
    // Track stats
    state.studyStats.studiedToday++;
    state.studyStats.totalAnswers++;
    if (rating >= 3) state.studyStats.correctAnswers++;
    
    // Calculate next review date using spaced repetition algorithm
    // 1: Again (reset), 2: Hard, 3: Good, 4: Easy
    if (!card.interval) {
        // New card
        switch(rating) {
            case 1: // Again
                card.interval = 0.003; // ~5 minutes
                break;
            case 2: // Hard
                card.interval = 0.042; // ~1 hour
                break;
            case 3: // Good
                card.interval = 0.167; // ~4 hours
                break;
            case 4: // Easy
                card.interval = 1; // 1 day
                break;
        }
        card.ease = 2.5; // Initialize ease factor
    } else {
        // Review card
        switch(rating) {
            case 1: // Again
                card.interval = card.interval * 0.2;
                card.ease = Math.max(1.3, card.ease - 0.2);
                break;
            case 2: // Hard
                card.interval = card.interval * 1.2;
                card.ease = Math.max(1.3, card.ease - 0.15);
                break;
            case 3: // Good
                card.interval = card.interval * card.ease;
                break;
            case 4: // Easy
                card.interval = card.interval * card.ease * 1.3;
                card.ease = Math.min(2.5, card.ease + 0.15);
                break;
        }
    }
    
    // Calculate next review date
    const now = new Date();
    const nextReview = new Date(now.getTime() + (card.interval * 24 * 60 * 60 * 1000));
    card.nextReview = nextReview.toISOString();
    
    // Save the updated card
    const deckIndex = state.decks.findIndex(deck => deck.id === state.currentDeck.id);
    const cardIndex = state.decks[deckIndex].cards.findIndex(c => c.id === card.id);
    state.decks[deckIndex].cards[cardIndex] = card;
    
    saveData();
    updateStats();
    
    // Show next card
    showNextCard();
}

// Navigation functions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.querySelectorAll('.nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(screenId).classList.add('active');
    
    if (screenId === 'decks-screen') {
        document.getElementById('decks-nav').classList.add('active');
    } else if (screenId === 'add-screen') {
        document.getElementById('add-nav').classList.add('active');
    } else if (screenId === 'stats-screen') {
        document.getElementById('stats-nav').classList.add('active');
        updateStats();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load data
    loadData();
    
    // Navigation events
    document.getElementById('decks-nav').addEventListener('click', function() {
        showScreen('decks-screen');
    });
    
    document.getElementById('add-nav').addEventListener('click', function() {
        showScreen('add-screen');
    });
    
    document.getElementById('stats-nav').addEventListener('click', function() {
        showScreen('stats-screen');
    });
    
    // Add deck form
    document.getElementById('add-deck-btn').addEventListener('click', function() {
        document.getElementById('add-deck-form').style.display = 'block';
        document.getElementById('deck-name').focus();
    });
    
    document.getElementById('save-deck-btn').addEventListener('click', function() {
        const deckName = document.getElementById('deck-name').value.trim();
        
        if (deckName) {
            const newDeck = {
                id: generateId(),
                name: deckName,
                cards: []
            };
            
            state.decks.push(newDeck);
            saveData();
            updateDeckList();
            updateCardDeckSelect();
            
            // Reset and hide form
            document.getElementById('deck-name').value = '';
            document.getElementById('add-deck-form').style.display = 'none';
        } else {
            alert('Please enter a deck name');
        }
    });
    
    // Add card form
    document.getElementById('save-card-btn').addEventListener('click', function() {
        const deckId = document.getElementById('card-deck').value;
        const front = document.getElementById('card-front').value.trim();
        const back = document.getElementById('card-back').value.trim();
        
        if (front && back) {
            const newCard = {
                id: generateId(),
                front: front,
                back: back,
                created: new Date().toISOString(),
                nextReview: null,
                interval: null,
                ease: 2.5
            };
            
            const deckIndex = state.decks.findIndex(deck => deck.id === deckId);
            state.decks[deckIndex].cards.push(newCard);
            state.studyStats.totalCards++;
            
            saveData();
            updateDeckList();
            updateStats();
            
            // Reset form
            document.getElementById('card-front').value = '';
            document.getElementById('card-back').value = '';
            document.getElementById('card-front').focus();
            
            alert('Card added successfully!');
        } else {
            alert('Please fill out both front and back of the card');
        }
    });
    
    // Study session events
    document.getElementById('flip-btn').addEventListener('click', flipCard);
    
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            processCardRating(rating);
        });
    });
    
    document.getElementById('finish-btn').addEventListener('click', function() {
        showScreen('decks-screen');
    });
});