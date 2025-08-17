/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';

// ===================================================================================
// KLUCZ API - ZOSTAŁ JUŻ DODANY
// ===================================================================================
const API_KEY = "AIzaSyDh9CmaXZYKPLz4ESTuYH8aFYBeXR6mbh8";
// ===================================================================================


// --- STATE MANAGEMENT ---
const state = {
    dailyFact: '',
    factLoading: false,
    reminders: [],
};

// --- GEMINI API SETUP ---
let ai = null;
try {
    if (API_KEY && API_KEY !== "WLEJ_TUTAJ_SWÓJ_KLUCZ_API") {
        ai = new GoogleGenAI({ apiKey: API_KEY });
    }
} catch (error) {
    console.error("Nie udało się zainicjować GoogleGenAI:", error);
}

async function fetchDailyFact() {
    if (!ai) {
        state.dailyFact = "Klucz API nie został dodany lub jest nieprawidłowy. Postępuj zgodnie z instrukcją, aby włączyć tę funkcję.";
        state.factLoading = false;
        render();
        return;
    }
    state.factLoading = true;
    render();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Opowiedz mi krótką, interesującą i pozytywną ciekawostkę, która spodobałaby się seniorowi. Maksymalnie 30 słów.',
        });
        state.dailyFact = response.text;
    } catch (error) {
        console.error("Błąd podczas pobierania ciekawostki:", error);
        if (error.message && error.message.includes('API key not valid')) {
             state.dailyFact = "Twój klucz API jest nieprawidłowy. Sprawdź, czy został poprawnie skopiowany i wklejony.";
        } else {
             state.dailyFact = "Nie udało się dziś pobrać ciekawostki. Może to być problem z połączeniem internetowym. Spróbuj ponownie później.";
        }
    } finally {
        state.factLoading = false;
        render();
    }
}


// --- REMINDERS LOGIC ---
function loadReminders() {
    try {
        const savedReminders = localStorage.getItem('reminders');
        if (savedReminders) {
            state.reminders = JSON.parse(savedReminders);
            sortReminders();
        }
    } catch (e) {
        console.error("Błąd podczas wczytywania przypomnień:", e);
        state.reminders = [];
    }
}

function saveReminders() {
    try {
        localStorage.setItem('reminders', JSON.stringify(state.reminders));
    } catch (e) {
        console.error("Błąd podczas zapisywania przypomnień:", e);
    }
}

function sortReminders() {
    state.reminders.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
    });
}

function addReminder(text, date, time) {
    if (!text || !date || !time) {
        alert("Proszę wypełnić wszystkie pola przypomnienia.");
        return;
    }
    const newReminder = { id: Date.now(), text, date, time };
    state.reminders.push(newReminder);
    sortReminders();
    saveReminders();
    render();

    const list = document.querySelector('.reminders-list');
    if (list && list.lastElementChild && !list.lastElementChild.classList.contains('empty-message')) {
        (list.lastElementChild).classList.add('new-item-fade-in');
    }
}

function deleteReminder(id) {
    const reminderItem = document.querySelector(`[data-reminder-id='${id}']`);
    if (reminderItem) {
        reminderItem.classList.add('fade-out');
        setTimeout(() => {
            state.reminders = state.reminders.filter(r => r.id !== id);
            saveReminders();
            render();
        }, 500);
    } else {
        state.reminders = state.reminders.filter(r => r.id !== id);
        saveReminders();
        render();
    }
}


// --- RENDER FUNCTIONS (UI COMPONENTS) ---
const root = document.getElementById('root');

function render() {
    const factContent = document.getElementById('fact-content');
    const factCard = document.querySelector('.fact-card');

    if (factCard) {
        factCard.classList.toggle('is-loading', state.factLoading);
    }
    if (factContent) {
        factContent.textContent = state.dailyFact || 'Kliknij przycisk, aby pobrać ciekawostkę!';
    }

    const remindersList = document.querySelector('.reminders-list');
    if (remindersList) {
        renderRemindersList(remindersList);
    }
}

function createFullUI() {
    root.innerHTML = '';
    const appContainer = document.createElement('div');
    appContainer.className = 'app-container';

    appContainer.appendChild(createHeader());
    appContainer.appendChild(createFactSection());
    appContainer.appendChild(createGamesSection());
    appContainer.appendChild(createRemindersSection());
    
    root.appendChild(appContainer);
    root.appendChild(createFooterNav());
    root.appendChild(createBackToTopButton());
}


function createHeader() {
    const header = document.createElement('header');
    header.className = 'app-header';
    header.innerHTML = `
        <div class="header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
        </div>
        <h1>Kącik Seniora</h1>
        <p class="welcome-message">Proste, pomocne i przyjemne miejsce dla Ciebie.</p>
    `;
    return header;
}


function createFactSection() {
    const section = document.createElement('section');
    section.id = 'fact-section';
    section.className = 'page-section';

    const factCard = document.createElement('div');
    factCard.className = 'card fact-card';
    const factTitle = document.createElement('h3');
    factTitle.textContent = '💡 Ciekawostka na dziś';
    
    const loader = document.createElement('div');
    loader.className = 'loader';

    const factContent = document.createElement('p');
    factContent.id = 'fact-content';
    factContent.textContent = state.dailyFact || 'Kliknij przycisk, aby pobrać ciekawostkę!';
    
    const refreshButton = createButton('Nowa ciekawostka', fetchDailyFact);
    refreshButton.className += ' small-button';
    factCard.append(factTitle, loader, factContent, refreshButton);
    section.appendChild(factCard);
    return section;
}


function createGamesSection() {
    const section = document.createElement('section');
    section.id = 'games-section';
    section.className = 'page-section';

    const title = document.createElement('h2');
    title.textContent = 'Gry';

    const navGrid = document.createElement('div');
    navGrid.className = 'nav-grid';

    const memoryGameButton = createNavCard('Gra Pamięciowa', '🖼️', () => openGameModal('memory', 'Gra Pamięciowa'));
    const checkersButton = createNavCard('Warcaby', ' checkers-icon ', () => openGameModal('checkers', 'Warcaby')); // Icon placeholder
    const englishButton = createNavCard('Nauka Angielskiego', '🇬🇧', () => openGameModal('english', 'Nauka Angielskiego'));
    const proverbButton = createNavCard('Dokończ Przysłowia', '📜', () => openGameModal('proverb', 'Dokończ Przysłowia'));
    const mathButton = createNavCard('Ćwiczenia Matematyczne', '🔢', () => openGameModal('math', 'Ćwiczenia Matematyczne'));
    
    // Quick hack for checkers icon
    checkersButton.querySelector('.nav-card-icon').innerHTML = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" fill="#312e2b"/>
            <circle cx="50" cy="50" r="30" fill="#4a4441"/>
        </svg>`;

    navGrid.append(memoryGameButton, checkersButton, englishButton, proverbButton, mathButton);
    section.append(title, navGrid);
    return section;
}


function createRemindersSection() {
    const section = document.createElement('section');
    section.id = 'reminders-section';
    section.className = 'page-section';

    const title = document.createElement('h2');
    title.textContent = 'Moje Przypomnienia';

    const formCard = document.createElement('div');
    formCard.className = 'card';
    const form = document.createElement('form');
    form.onsubmit = (e) => {
        e.preventDefault();
        const textInput = form.querySelector('#reminder-text');
        const dateInput = form.querySelector('#reminder-date');
        const timeInput = form.querySelector('#reminder-time');
        addReminder(textInput.value, dateInput.value, timeInput.value);
        form.reset();
    };

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.id = 'reminder-text';
    textInput.placeholder = 'O czym chcesz pamiętać?';
    textInput.setAttribute('aria-label', 'Opis przypomnienia');

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.id = 'reminder-date';
    dateInput.setAttribute('aria-label', 'Data przypomnienia');

    const timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.id = 'reminder-time';
    timeInput.setAttribute('aria-label', 'Godzina przypomnienia');

    const addButton = createButton('Dodaj przypomnienie');
    addButton.type = 'submit';

    form.append(textInput, dateInput, timeInput, addButton);
    formCard.appendChild(form);

    const list = document.createElement('ul');
    list.className = 'reminders-list';
    renderRemindersList(list);

    section.append(title, formCard, list);
    return section;
}

function renderRemindersList(listElement) {
    listElement.innerHTML = '';
    if (state.reminders.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'Nie masz ustawionych żadnych przypomnień.';
        emptyMessage.className = 'empty-message';
        listElement.appendChild(emptyMessage);
    } else {
        state.reminders.forEach(reminder => {
            const item = document.createElement('li');
            item.dataset.reminderId = reminder.id.toString();
            const date = new Date(`${reminder.date}T${reminder.time}`);
            item.innerHTML = `
                <div class="reminder-info">
                    <strong>${reminder.text}</strong>
                    <span>${date.toLocaleDateString('pl-PL')} o ${date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            `;
            const deleteBtn = createButton('Usuń', () => deleteReminder(reminder.id));
            deleteBtn.className += ' delete-button';
            item.appendChild(deleteBtn);
            listElement.appendChild(item);
        });
    }
}

// --- GAME MODAL ---
function openGameModal(gameType, title) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    const modalTitle = document.createElement('h2');
    modalTitle.textContent = title;
    modalHeader.appendChild(modalTitle);

    const closeButton = createButton('X', () => document.body.removeChild(modalOverlay));
    closeButton.className = 'modal-close-btn';
    closeButton.setAttribute('aria-label', 'Zamknij grę');
    modalHeader.appendChild(closeButton);

    let gameView;
    switch(gameType) {
        case 'memory':
            gameView = createMemoryGameView();
            break;
        case 'checkers':
            gameView = createCheckersGameView();
            break;
        case 'english':
            gameView = createEnglishGameView();
            break;
        case 'proverb':
            gameView = createProverbGameView();
            break;
        case 'math':
            gameView = createMathGameView();
            break;
    }
    
    modalContent.append(modalHeader, gameView);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
}

// --- MEMORY GAME ---
function createMemoryGameView() {
    const container = document.createElement('div');
    container.className = 'game-container';

    const controls = document.createElement('div');
    controls.className = 'game-controls';
    const movesCounter = document.createElement('p');
    movesCounter.id = 'moves-counter';
    const newGameButton = createButton('Nowa Gra', startMemoryGame);
    controls.append(movesCounter, newGameButton);

    const board = document.createElement('div');
    board.className = 'game-board';
    container.append(controls, board);

    setTimeout(startMemoryGame, 0);

    return container;
}

function startMemoryGame() {
    const board = document.querySelector('.game-board');
    if (!board) return;

    const ANIMAL_IMAGES = [
        'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/2295744/pexels-photo-2295744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/247502/pexels-photo-247502.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1665243/pexels-photo-1665243.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/4001296/pexels-photo-4001296.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/51187/squirrrel-animal-cute-rodents-51187.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/145939/pexels-photo-145939.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ];
    const cardValues = [...ANIMAL_IMAGES, ...ANIMAL_IMAGES].sort(() => 0.5 - Math.random());

    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    const movesCounter = document.getElementById('moves-counter');
    if(movesCounter) movesCounter.textContent = `Ruchy: 0`;
    
    const existingWinMessage = board.querySelector('.game-win-message');
    if (existingWinMessage) existingWinMessage.remove();

    board.innerHTML = '';
    cardValues.forEach(value => {
        const card = document.createElement('div');
        card.className = 'card-game';
        card.dataset.value = value;
        card.innerHTML = `<div class="card-face card-front"></div><div class="card-face card-back"><img src="${value}" alt="Karta ze zwierzęciem"></div>`;
        card.addEventListener('click', () => onCardClick(card));
        board.appendChild(card);
    });

    function onCardClick(card) {
        if (card.classList.contains('flipped') || card.classList.contains('matched') || flippedCards.length === 2) {
            return;
        }

        card.classList.add('flipped');
        flippedCards.push(card);

        if (flippedCards.length === 2) {
            moves++;
            if(movesCounter) movesCounter.textContent = `Ruchy: ${moves}`;
            checkForMatch();
        }
    }

    function checkForMatch() {
        const [card1, card2] = flippedCards;
        if (card1.dataset.value === card2.dataset.value) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            flippedCards = [];
            if (matchedPairs === ANIMAL_IMAGES.length) {
                const winMessage = document.createElement('div');
                winMessage.className = 'game-win-message';
                winMessage.textContent = `Gratulacje! Wygrałeś w ${moves} ruchach!`;
                board.appendChild(winMessage);
            }
        } else {
            card1.classList.add('shake');
            card2.classList.add('shake');
            setTimeout(() => {
                card1.classList.remove('flipped', 'shake');
                card2.classList.remove('flipped', 'shake');
                flippedCards = [];
            }, 1500);
        }
    }
}

// --- CHECKERS GAME (WARCABY) ---
function createCheckersGameView() {
    const container = document.createElement('div');
    container.className = 'game-container checkers-container';

    const gameArea = document.createElement('div');

    function selectDifficulty() {
        gameArea.innerHTML = '<div class="difficulty-selector"></div>';
        const selector = gameArea.querySelector('.difficulty-selector');
        const easyBtn = createButton('Łatwy', () => startGame('easy'));
        const mediumBtn = createButton('Średni', () => startGame('medium'));
        const hardBtn = createButton('Trudny', () => startGame('hard'));
        selector.append(easyBtn, mediumBtn, hardBtn);
    }
    
    function startGame(difficulty) {
        gameArea.innerHTML = '';
        const statusDisplay = document.createElement('p');
        statusDisplay.className = 'game-status';

        const board = document.createElement('div');
        board.className = 'checkers-board';
        
        const newGameButton = createButton('Nowa Gra (zmień poziom)', selectDifficulty);

        gameArea.append(statusDisplay, board, newGameButton);

        const PLAYER = 'white';
        const COMPUTER = 'black';
        let currentPlayer = PLAYER;
        let boardState = [];
        let selectedPiece = null;
        let mustJump = false;

        function initializeBoard() {
            boardState = Array(8).fill(null).map(() => Array(8).fill(null));
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 8; col++) {
                    if ((row + col) % 2 !== 0) {
                        boardState[row][col] = { player: COMPUTER, isKing: false };
                    }
                }
            }
            for (let row = 5; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if ((row + col) % 2 !== 0) {
                        boardState[row][col] = { player: PLAYER, isKing: false };
                    }
                }
            }
        }

        function renderBoard() {
            board.innerHTML = '';
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const square = document.createElement('div');
                    square.className = `checkers-square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                    square.dataset.row = row;
                    square.dataset.col = col;

                    const pieceData = boardState[row][col];
                    if (pieceData) {
                        const piece = document.createElement('div');
                        piece.className = `piece ${pieceData.player}-piece ${pieceData.isKing ? 'king' : ''}`;
                        square.appendChild(piece);
                    }
                    board.appendChild(square);
                }
            }
            addEventListeners();
            updateStatus();
        }

        function addEventListeners() {
            document.querySelectorAll('.checkers-square.dark').forEach(square => {
                square.addEventListener('click', onSquareClick);
            });
        }

        function onSquareClick(e) {
            if (currentPlayer !== PLAYER) return;
            const square = e.currentTarget;
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);

            if (selectedPiece) {
                const validMoves = getValidMoves(selectedPiece.row, selectedPiece.col);
                const move = validMoves.find(m => m.to.row === row && m.to.col === col);
                if (move) {
                    makeMove(move);
                } else {
                    deselectPiece();
                }
            } else {
                const piece = boardState[row][col];
                if (piece && piece.player === PLAYER) {
                    selectPiece(row, col);
                }
            }
        }
        
        function selectPiece(row, col) {
            deselectPiece();
            selectedPiece = { row, col };
            const square = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
            if(square) square.classList.add('selected');
            
            const validMoves = getValidMoves(row, col);
            validMoves.forEach(move => {
                const moveSquare = document.querySelector(`[data-row='${move.to.row}'][data-col='${move.to.col}']`);
                if(moveSquare) moveSquare.classList.add('valid-move');
            });
        }

        function deselectPiece() {
            if (selectedPiece) {
                const oldSquare = document.querySelector(`[data-row='${selectedPiece.row}'][data-col='${selectedPiece.col}']`);
                if(oldSquare) oldSquare.classList.remove('selected');
            }
            document.querySelectorAll('.valid-move').forEach(s => s.classList.remove('valid-move'));
            selectedPiece = null;
        }

        function makeMove(move) {
            const { from, to, jump } = move;
            const piece = boardState[from.row][from.col];
            boardState[to.row][to.col] = piece;
            boardState[from.row][from.col] = null;
            
            if (jump) {
                const jumpRow = (from.row + to.row) / 2;
                const jumpCol = (from.col + to.col) / 2;
                boardState[jumpRow][jumpCol] = null;
            }

            if (to.row === 0 && piece.player === PLAYER) piece.isKing = true;
            if (to.row === 7 && piece.player === COMPUTER) piece.isKing = true;
            
            deselectPiece();
            renderBoard();

            const furtherJumps = getValidMoves(to.row, to.col).filter(m => m.jump);
            if(jump && furtherJumps.length > 0){
                currentPlayer = PLAYER; 
                mustJump = true;
                selectPiece(to.row, to.col);
                updateStatus();
            } else {
                switchPlayer();
            }
        }
        
        function switchPlayer() {
            currentPlayer = (currentPlayer === PLAYER) ? COMPUTER : PLAYER;
            mustJump = false;
            updateStatus();
            if (currentPlayer === COMPUTER) {
                setTimeout(makeComputerMove, 500);
            }
        }
        
        function updateStatus() {
            const winner = checkWinner();
            if (winner) {
                statusDisplay.textContent = `Wygrywa ${winner === PLAYER ? 'Gracz' : 'Komputer'}!`;
            } else {
                statusDisplay.textContent = `Tura: ${currentPlayer === PLAYER ? 'Twoja (białe)' : 'Komputera (czarne)'}`;
            }
        }

        function getValidMoves(row, col) {
            const piece = boardState[row][col];
            if (!piece) return [];
            
            let moves = [];
            const directions = piece.isKing ? [[-1,-1], [-1,1], [1,-1], [1,1]] : (piece.player === PLAYER ? [[-1,-1], [-1,1]] : [[1,-1], [1,1]]);

            for(const [dr, dc] of directions){
                const newRow = row + dr, newCol = col + dc;
                if(newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    if(!boardState[newRow][newCol]) {
                        moves.push({ from: {row, col}, to: {row: newRow, col: newCol}, jump: false });
                    } else if (boardState[newRow][newCol].player !== piece.player) {
                        const jumpRow = newRow + dr, jumpCol = newCol + dc;
                        if(jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 && !boardState[jumpRow][jumpCol]){
                           moves.push({ from: {row, col}, to: {row: jumpRow, col: jumpCol}, jump: true });
                        }
                    }
                }
            }

            const jumpMoves = moves.filter(m => m.jump);
            const allPlayerPieces = [];
            for(let r=0; r<8; r++) for(let c=0; c<8; c++) if(boardState[r][c]?.player === piece.player) allPlayerPieces.push({r,c});

            const anyJumpsAvailable = allPlayerPieces.some(p => getValidMoves(p.r, p.c).some(m => m.jump));
            
            if(anyJumpsAvailable) return jumpMoves;
            return mustJump ? [] : moves;
        }

        function makeComputerMove() {
            const allComputerMoves = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (boardState[r][c]?.player === COMPUTER) {
                        getValidMoves(r, c).forEach(move => allComputerMoves.push(move));
                    }
                }
            }

            if (allComputerMoves.length === 0) return;

            let bestMove;
            const jumpMoves = allComputerMoves.filter(m => m.jump);

            if (jumpMoves.length > 0) {
                 bestMove = jumpMoves[Math.floor(Math.random() * jumpMoves.length)];
            } else {
                if(difficulty === 'easy') {
                    bestMove = allComputerMoves[Math.floor(Math.random() * allComputerMoves.length)];
                } else { // Medium & Hard
                    let scoredMoves = allComputerMoves.map(move => {
                        let score = 0;
                        if (difficulty === 'hard') {
                            if (move.to.row === 7) score += 2; // King promotion
                            if (move.from.row > 3) score -= 1; // Move back
                        }
                        return { move, score };
                    });
                    scoredMoves.sort((a, b) => b.score - a.score);
                    bestMove = scoredMoves[0].move;
                }
            }
            
            makeMove(bestMove);
        }

        function checkWinner() {
            let playerCount = 0, computerCount = 0;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (boardState[r][c]?.player === PLAYER) playerCount++;
                    if (boardState[r][c]?.player === COMPUTER) computerCount++;
                }
            }
            if (playerCount === 0) return COMPUTER;
            if (computerCount === 0) return PLAYER;
            return null;
        }
        
        initializeBoard();
        renderBoard();
    }
    
    selectDifficulty();
    return container;
}


// --- ENGLISH LEARNING GAME ---
function createEnglishGameView() {
    const container = document.createElement('div');
    container.className = 'game-container english-container';

    const gameArea = document.createElement('div');
    
    const words = [
        { pl: 'Kot', en: 'Cat', options: ['Dog', 'Mouse', 'Bird'] },
        { pl: 'Pies', en: 'Dog', options: ['Cat', 'Fish', 'Lion'] },
        { pl: 'Dom', en: 'House', options: ['Car', 'School', 'Home'] },
        { pl: 'Woda', en: 'Water', options: ['Fire', 'Milk', 'Juice'] },
        { pl: 'Chleb', en: 'Bread', options: ['Butter', 'Cheese', 'Ham'] }
    ];
    const sentences = [
        { pl: 'Jak się masz?', en: 'How are you?', options: ['What is your name?', 'Where are you from?', 'How old are you?'] },
        { pl: 'Nazywam się Jan.', en: 'My name is John.', options: ['I am a doctor.', 'I like apples.', 'This is my house.'] },
        { pl: 'Dziękuję bardzo.', en: 'Thank you very much.', options: ['You are welcome.', 'Excuse me.', 'Good morning.'] },
        { pl: 'Gdzie jest toaleta?', en: 'Where is the toilet?', options: ['How much is this?', 'Can you help me?', 'I am lost.'] }
    ];

    function startQuiz(mode) {
        gameArea.innerHTML = '';
        const data = mode === 'words' ? words : sentences;
        let currentItem;

        const questionDisplay = document.createElement('p');
        questionDisplay.className = 'proverb-display';

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'proverb-options';

        const statusDisplay = document.createElement('p');
        statusDisplay.className = 'game-status';

        const newButton = createButton('Następne', newQuestion);
        newButton.style.marginTop = '1rem';
        
        const changeModeButton = createButton('Zmień tryb', selectMode);
        changeModeButton.style.marginTop = '0.5rem';

        function newQuestion() {
            currentItem = data[Math.floor(Math.random() * data.length)];
            questionDisplay.textContent = `Przetłumacz: "${currentItem.pl}"`;
            statusDisplay.textContent = '';
            
            const options = [currentItem.en, ...currentItem.options].sort(() => Math.random() - 0.5);
            
            optionsContainer.innerHTML = '';
            options.forEach(optionText => {
                const button = createButton(optionText, () => handleAnswer(optionText, button));
                button.classList.add('option-button');
                optionsContainer.appendChild(button);
            });
        }

        function handleAnswer(selectedOption, button) {
            const isCorrect = selectedOption === currentItem.en;
            
            Array.from(optionsContainer.children).forEach(child => {
                const btn = child;
                btn.disabled = true;
                if (btn.textContent === currentItem.en) btn.classList.add('correct-answer');
                else if (btn.textContent === selectedOption) btn.classList.add('incorrect-answer');
            });

            statusDisplay.textContent = isCorrect ? 'Doskonale! Prawidłowa odpowiedź.' : 'Niestety, to nie to.';
        }
        
        gameArea.append(questionDisplay, optionsContainer, statusDisplay, newButton, changeModeButton);
        newQuestion();
    }
    
    function selectMode() {
        gameArea.innerHTML = '<div class="difficulty-selector"></div>';
        const selector = gameArea.querySelector('.difficulty-selector');
        const wordsBtn = createButton('Podstawowe Słówka', () => startQuiz('words'));
        const sentencesBtn = createButton('Podstawowe Zdania', () => startQuiz('sentences'));
        selector.append(wordsBtn, sentencesBtn);
    }
    
    container.appendChild(gameArea);
    selectMode();
    return container;
}


// --- PROVERB GAME ---
function createProverbGameView() {
    const container = document.createElement('div');
    container.className = 'game-container proverb-container';

    const proverbDisplay = document.createElement('p');
    proverbDisplay.className = 'proverb-display';
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'proverb-options';
    const statusDisplay = document.createElement('p');
    statusDisplay.className = 'game-status';
    const newButton = createButton('Nowe przysłowie', newProverb);
    newButton.style.marginTop = '1rem';

    const proverbs = [
        { start: 'Gdzie kucharek sześć,', correct: 'tam nie ma co jeść', incorrect: ['tam jest pyszne ciasto', 'tam każdy się naje', 'tam jest wielki bal'] },
        { start: 'Gdy się człowiek spieszy,', correct: 'to się diabeł cieszy', incorrect: ['to zawsze zdąży', 'to na pociąg nie zdąży', 'to anioł się smuci'] },
        { start: 'Lepszy wróbel w garści,', correct: 'niż gołąb na dachu', incorrect: ['niż orzeł na niebie', 'niż kura w zupie', 'niż nic nie mieć'] },
        { start: 'Kto rano wstaje,', correct: 'temu Pan Bóg daje', incorrect: ['ten jest niewyspany', 'ten chodzi zły cały dzień', 'ten idzie spać wcześnie'] },
        { start: 'Niedaleko pada jabłko', correct: 'od jabłoni', incorrect: ['od gruszy', 'od śliwki', 'w trawę'] },
        { start: 'Apetyt rośnie', correct: 'w miarę jedzenia', incorrect: ['przed obiadem', 'na deser', 'gdy się jest głodnym'] },
    ];
    let currentProverb;
    let lastProverbIndex = -1;

    function newProverb() {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * proverbs.length);
        } while (proverbs.length > 1 && newIndex === lastProverbIndex);
        lastProverbIndex = newIndex;
        
        currentProverb = proverbs[newIndex];
        proverbDisplay.textContent = currentProverb.start + ' ...';
        statusDisplay.textContent = '';
        
        const options = [currentProverb.correct, ...currentProverb.incorrect].sort(() => Math.random() - 0.5);
        
        optionsContainer.innerHTML = '';
        options.forEach(optionText => {
            const button = createButton(optionText, () => handleAnswerClick(optionText, button));
            button.classList.add('option-button');
            optionsContainer.appendChild(button);
        });
    }

    function handleAnswerClick(selectedOption, button) {
        const isCorrect = selectedOption === currentProverb.correct;
        
        Array.from(optionsContainer.children).forEach(child => {
            const btn = child;
            btn.disabled = true;
            if (btn.textContent === currentProverb.correct) btn.classList.add('correct-answer');
            else if (btn.textContent === selectedOption) btn.classList.add('incorrect-answer');
        });

        statusDisplay.textContent = isCorrect ? 'Doskonale! Prawidłowa odpowiedź.' : `Niestety, to nie to.`;
    }

    container.append(proverbDisplay, optionsContainer, statusDisplay, newButton);
    setTimeout(newProverb, 0);
    return container;
}


// --- MATH GAME ---
function createMathGameView() {
    const container = document.createElement('div');
    container.className = 'game-container math-container';

    const gameArea = document.createElement('div');
    let currentAnswer;

    function startGame(difficulty) {
        gameArea.innerHTML = '';
        let score = 0;
        const scoreDisplay = document.createElement('p');
        scoreDisplay.className = 'game-score';
        const problemDisplay = document.createElement('p');
        problemDisplay.className = 'math-problem';
        const input = document.createElement('input');
        input.type = 'number';
        input.placeholder = '?';
        const statusDisplay = document.createElement('p');
        statusDisplay.className = 'game-status';
        const controls = document.createElement('div');
        controls.className = 'math-controls';
        
        const checkButton = createButton('Sprawdź', checkAnswer);
        const newProblemButton = createButton('Nowe zadanie', generateProblem);
        controls.append(checkButton, newProblemButton);
        
        gameArea.append(scoreDisplay, problemDisplay, input, statusDisplay, controls);
        
        function updateScore() { scoreDisplay.textContent = `Punkty: ${score}`; }
        
        function generateProblem() {
            input.value = '';
            input.disabled = false;
            statusDisplay.textContent = '';
            input.classList.remove('correct', 'incorrect');
            
            const rand = (max, min = 1) => Math.floor(Math.random() * (max - min + 1)) + min;
            let num1, num2, operator;

            if (difficulty === 'easy') { num1 = rand(20); num2 = rand(20); if (Math.random() > 0.5) { operator = '+'; currentAnswer = num1 + num2; } else { operator = '-'; if (num1 < num2) [num1, num2] = [num2, num1]; currentAnswer = num1 - num2; }
            } else if (difficulty === 'medium') { const opType = rand(3); if (opType === 1) { num1 = rand(100); num2 = rand(100); operator = '+'; currentAnswer = num1 + num2; } else if (opType === 2) { num1 = rand(100); num2 = rand(100); if(num1<num2) [num1, num2] = [num2, num1]; operator = '-'; currentAnswer = num1 - num2; } else { num1 = rand(12); num2 = rand(12); operator = '*'; currentAnswer = num1 * num2; }
            } else { const opType = rand(4); if (opType === 1) { num1 = rand(200, 50); num2 = rand(200, 50); operator = '+'; currentAnswer = num1 + num2; } else if (opType === 2) { num1 = rand(300, 20); num2 = rand(200, 20); if(num1<num2) [num1, num2] = [num2, num1]; operator = '-'; currentAnswer = num1 - num2; } else if (opType === 3) { num1 = rand(20, 5); num2 = rand(20, 5); operator = '*'; currentAnswer = num1 * num2; } else { num2 = rand(15, 2); num1 = num2 * rand(15, 2); operator = '/'; currentAnswer = num1 / num2; }
            }
            problemDisplay.textContent = `${num1} ${operator.replace('*', '×').replace('/', '÷')} ${num2} =`;
        }

        function checkAnswer() {
            const userAnswer = parseInt(input.value, 10);
            if (isNaN(userAnswer)) { statusDisplay.textContent = 'Proszę wpisać liczbę.'; return; }
            if (userAnswer === currentAnswer) { statusDisplay.textContent = 'Dobrze!'; input.classList.add('correct'); score++; updateScore(); input.disabled = true; setTimeout(generateProblem, 1500);
            } else { statusDisplay.textContent = `Źle. Prawidłowa odpowiedź to ${currentAnswer}.`; input.classList.add('incorrect'); input.disabled = true; }
        }
        
        updateScore();
        generateProblem();
    }
    
    const difficultySelector = document.createElement('div');
    difficultySelector.className = 'difficulty-selector';
    const easyBtn = createButton('Łatwy', () => startGame('easy'));
    const mediumBtn = createButton('Średni', () => startGame('medium'));
    const hardBtn = createButton('Trudny', () => startGame('hard'));
    difficultySelector.append(easyBtn, mediumBtn, hardBtn);
    
    gameArea.appendChild(difficultySelector);
    container.appendChild(gameArea);
    return container;
}


// --- UTILITY FUNCTIONS ---
function createButton(text, onClick) {
    const button = document.createElement('button');
    button.className = 'button';
    button.textContent = text;
    if (onClick) button.onclick = onClick;
    return button;
}

function createNavCard(text, icon, onClick) {
    const card = document.createElement('button');
    card.className = 'card nav-card';
    card.onclick = onClick;
    card.setAttribute('aria-label', text);
    card.innerHTML = `<div class="nav-card-icon">${icon}</div><p>${text}</p>`;
    return card;
}

function createFooterNav() {
    const footer = document.createElement('footer');
    footer.className = 'app-footer';

    const scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const factButton = createButton('💡', () => scrollToSection('fact-section'));
    factButton.setAttribute('aria-label', 'Przejdź do ciekawostki');
    const gamesButton = createButton('🎲', () => scrollToSection('games-section'));
    gamesButton.setAttribute('aria-label', 'Przejdź do gier');
    const remindersButton = createButton('🔔', () => scrollToSection('reminders-section'));
    remindersButton.setAttribute('aria-label', 'Przejdź do przypomnień');
    
    footer.append(factButton, gamesButton, remindersButton);
    return footer;
}

function createBackToTopButton() {
    const button = document.createElement('button');
    button.textContent = '🔼';
    button.className = 'back-to-top-btn';
    button.setAttribute('aria-label', 'Wróć na górę');
    button.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    return button;
}

// --- INITIALIZATION ---
function initializeApp() {
    if (!root) {
        console.error("Nie znaleziono elementu #root. Aplikacja nie może wystartować.");
        return;
    }
    createFullUI();
    fetchDailyFact();
    loadReminders();
    render();

    const backToTopBtn = document.querySelector('.back-to-top-btn');
    if (backToTopBtn) {
        window.onscroll = () => {
            if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        };
    }
}

initializeApp();