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
if (API_KEY && API_KEY !== "WLEJ_TUTAJ_SWÓJ_KLUCZ_API") {
    try {
        ai = new GoogleGenAI({ apiKey: API_KEY });
    } catch (error) {
        console.error("Nie udało się zainicjować GoogleGenAI:", error);
    }
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
    factCard.innerHTML = `
        <h3>💡 Ciekawostka na dziś</h3>
        <div class="loader"></div>
        <p id="fact-content">${state.dailyFact || 'Kliknij przycisk, aby pobrać ciekawostkę!'}</p>
    `;
    const refreshButton = createButton('Nowa ciekawostka', fetchDailyFact);
    refreshButton.className += ' small-button';
    factCard.appendChild(refreshButton);
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
    const checkersButton = createNavCard('Warcaby', '🏁', () => openGameModal('checkers', 'Warcaby'));
    const englishButton = createNavCard('Nauka Angielskiego', '🇬🇧', () => openGameModal('english', 'Nauka Angielskiego'));
    const proverbButton = createNavCard('Dokończ Przysłowia', '📜', () => openGameModal('proverb', 'Dokończ Przysłowia'));
    const mathButton = createNavCard('Ćwiczenia Matematyczne', '🔢', () => openGameModal('math', 'Ćwiczenia Matematyczne'));

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
    form.innerHTML = `
        <input type="text" id="reminder-text" placeholder="O czym chcesz pamiętać?" aria-label="Opis przypomnienia">
        <input type="date" id="reminder-date" aria-label="Data przypomnienia">
        <input type="time" id="reminder-time" aria-label="Godzina przypomnienia">
    `;
    const addButton = createButton('Dodaj przypomnienie');
    addButton.type = 'submit';
    form.appendChild(addButton);
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
        listElement.innerHTML = '<li class="empty-message">Nie masz ustawionych żadnych przypomnień.</li>';
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
    modalHeader.innerHTML = `<h2>${title}</h2>`;

    const closeButton = createButton('X', () => document.body.removeChild(modalOverlay));
    closeButton.className = 'modal-close-btn';
    closeButton.setAttribute('aria-label', 'Zamknij grę');
    modalHeader.appendChild(closeButton);

    let gameView;
    switch(gameType) {
        case 'memory': gameView = createMemoryGameView(); break;
        case 'checkers': gameView = createCheckersView(); break;
        case 'english': gameView = createEnglishLearningView(); break;
        case 'proverb': gameView = createProverbGameView(); break;
        case 'math': gameView = createMathGameView(); break;
    }
    
    modalContent.append(modalHeader, gameView);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
}


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

    // NAPRAWIONE, STABILNE LINKI DO OBRAZKÓW
    const ANIMAL_IMAGES = [
        'https://images.unsplash.com/photo-1474511320723-9a56873867b5?q=80&w=200&auto=format&fit=crop', // Fox
        'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=200&auto=format&fit=crop', // Dog
        'https://images.unsplash.com/photo-1570458425275-6b7051a1c435?q=80&w=200&auto=format&fit=crop', // Cat
        'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?q=80&w=200&auto=format&fit=crop', // Rabbit
        'https://images.unsplash.com/photo-1527118732049-c88155f2107c?q=80&w=200&auto=format&fit=crop', // Panda
        'https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?q=80&w=200&auto=format&fit=crop', // Squirrel
        'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=200&auto=format&fit=crop', // Hedgehog
        'https://images.unsplash.com/photo-1546182990-dffeaf781f3b?q=80&w=200&auto=format&fit=crop'  // Lion
    ];
    const cardValues = [...ANIMAL_IMAGES, ...ANIMAL_IMAGES].sort(() => 0.5 - Math.random());

    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    const movesCounter = document.getElementById('moves-counter');
    if(movesCounter) movesCounter.textContent = `Ruchy: 0`;
    
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


// --- GAME LOGIC (CHECKERS) ---
function createCheckersView() {
    const container = document.createElement('div');
    container.className = 'game-container checkers-container';
    const gameArea = document.createElement('div');

    const startGame = (difficulty) => {
        gameArea.innerHTML = '';
        
        const statusDisplay = document.createElement('p');
        statusDisplay.className = 'game-status';
        
        const board = document.createElement('div');
        board.className = 'checkers-board';
        
        const newGameButton = createButton('Nowa Gra (zmień poziom)', () => {
            const newView = createCheckersView();
            container.innerHTML = '';
            container.appendChild(newView);
        });
        newGameButton.style.marginTop = '1rem';

        gameArea.append(statusDisplay, board, newGameButton);

        let boardState = [];
        let currentPlayer = 'white';
        let selectedPiece = null;
        let isGameOver = false;
        let mustCapture = false;

        const initializeBoard = () => {
            board.innerHTML = '';
            boardState = [];
            for (let row = 0; row < 8; row++) {
                boardState[row] = [];
                for (let col = 0; col < 8; col++) {
                    const square = document.createElement('div');
                    square.className = `checkers-square ${((row + col) % 2 === 0) ? 'light' : 'dark'}`;
                    square.dataset.row = row;
                    square.dataset.col = col;
                    
                    let piece = null;
                    if ((row + col) % 2 !== 0) {
                        if (row < 3) piece = { player: 'black', isKing: false };
                        else if (row > 4) piece = { player: 'white', isKing: false };
                    }
                    boardState[row][col] = piece;
                    board.appendChild(square);
                }
            }
        };

        const renderBoard = () => {
            board.querySelectorAll('.checkers-square').forEach(square => {
                square.innerHTML = '';
                square.onclick = null;
                square.classList.remove('selected', 'valid-move');

                const row = parseInt(square.dataset.row);
                const col = parseInt(square.dataset.col);
                const piece = boardState[row][col];
                
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.player}-piece`;
                    if (piece.isKing) pieceElement.classList.add('king');
                    square.appendChild(pieceElement);

                    if (piece.player === currentPlayer && !isGameOver) {
                        square.onclick = () => onPieceClick(row, col);
                    }
                } else if(selectedPiece && !isGameOver){
                     square.onclick = () => onSquareClick(row, col);
                }
            });
            updateStatus();
        };
        
        const onPieceClick = (row, col) => {
            if (isGameOver || currentPlayer === 'black') return;
            
            const piece = boardState[row][col];
            if (piece && piece.player === currentPlayer) {
                 const allCaptureMoves = getAllPlayerMoves(currentPlayer, true);
                if (allCaptureMoves.length > 0) {
                    const pieceCaptureMoves = getPossibleMoves(row, col, true);
                    if (pieceCaptureMoves.length === 0) {
                        statusDisplay.textContent = 'Bicie jest obowiązkowe!';
                        return;
                    }
                }
                
                selectedPiece = { row, col };
                renderBoard(); // Re-render to clear previous highlights
                board.querySelector(`[data-row='${row}'][data-col='${col}']`).classList.add('selected');
                
                const movesToHighlight = (allCaptureMoves.length > 0) 
                    ? getPossibleMoves(row, col, true)
                    : getPossibleMoves(row, col, false);

                movesToHighlight.forEach(move => {
                    const targetSquare = board.querySelector(`[data-row='${move.toRow}'][data-col='${move.toCol}']`);
                    if (targetSquare) targetSquare.classList.add('valid-move');
                });
            }
        };

        const onSquareClick = (row, col) => {
            if (!selectedPiece || isGameOver) return;
            
            const allCaptureMoves = getAllPlayerMoves(currentPlayer, true);
            const moves = (allCaptureMoves.length > 0) 
                ? getPossibleMoves(selectedPiece.row, selectedPiece.col, true)
                : getPossibleMoves(selectedPiece.row, selectedPiece.col, false);

            const move = moves.find(m => m.toRow === row && m.toCol === col);

            if (move) {
                movePiece(selectedPiece.row, selectedPiece.col, row, col);
                const captured = move.capture;
                promoteToKing(row, col);
                
                const hasMoreCaptures = captured && getPossibleMoves(row, col, true).length > 0;
                if (hasMoreCaptures) {
                    selectedPiece = { row, col };
                    renderBoard();
                    onPieceClick(row, col);
                    return;
                }
                
                selectedPiece = null;
                currentPlayer = 'black';
                renderBoard();
                setTimeout(computerMove, 500);
            } else {
                selectedPiece = null;
                renderBoard();
            }
        };

        const movePiece = (fromRow, fromCol, toRow, toCol) => {
            const piece = boardState[fromRow][fromCol];
            boardState[toRow][toCol] = piece;
            boardState[fromRow][fromCol] = null;
            
            if (Math.abs(fromRow - toRow) === 2) {
                const capturedRow = (fromRow + toRow) / 2;
                const capturedCol = (fromCol + toCol) / 2;
                boardState[capturedRow][capturedCol] = null;
            }
        };
        
        const promoteToKing = (row, col) => {
            const piece = boardState[row][col];
            if(piece){
                if(piece.player === 'white' && row === 0) piece.isKing = true;
                if(piece.player === 'black' && row === 7) piece.isKing = true;
            }
        };

        const getPossibleMoves = (row, col, captureOnly) => {
            const moves = [];
            const piece = boardState[row][col];
            if (!piece) return moves;

            const dirs = piece.isKing ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : (piece.player === 'white' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);

            for (const [dr, dc] of dirs) {
                const newRow = row + dr;
                const newCol = col + dc;

                if (isValidSquare(newRow, newCol)) {
                    if (!boardState[newRow][newCol] && !captureOnly) {
                        moves.push({ toRow: newRow, toCol: newCol, capture: false });
                    } else if (boardState[newRow][newCol] && boardState[newRow][newCol].player !== piece.player) {
                        const jumpRow = newRow + dr;
                        const jumpCol = newCol + dc;
                        if (isValidSquare(jumpRow, jumpCol) && !boardState[jumpRow][jumpCol]) {
                            moves.push({ toRow: jumpRow, toCol: jumpCol, capture: true });
                        }
                    }
                }
            }
            return moves;
        };
        
        const getAllPlayerMoves = (player, captureOnly) => {
            let allMoves = [];
            for(let r=0; r<8; r++){
                for(let c=0; c<8; c++){
                    const piece = boardState[r][c];
                    if(piece && piece.player === player){
                        allMoves.push(...getPossibleMoves(r,c, captureOnly).map(move => ({...move, fromRow: r, fromCol: c})));
                    }
                }
            }
            return allMoves;
        };

        const isValidSquare = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

        const computerMove = () => {
            if(isGameOver) return;
            
            let allCaptureMoves = getAllPlayerMoves('black', true);
            let validMoves = allCaptureMoves.length > 0 ? allCaptureMoves : getAllPlayerMoves('black', false);

            if(validMoves.length === 0){
                isGameOver = true;
                statusDisplay.textContent = "Gratulacje, wygrałeś!";
                renderBoard();
                return;
            }

            let bestMove;
            if (difficulty === 'Łatwy') {
                bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            } else { // Średni i Trudny (priorytet bicia jest już w `validMoves`)
                // Prosta heurystyka dla Trudnego: unikanie głupich ruchów, dążenie do bycia damką
                 if (difficulty === 'Trudny') {
                    const goodMoves = validMoves.filter(m => {
                        // Unikaj ruchu na krawędź jeśli nie jest to konieczne
                        if(m.toCol === 0 || m.toCol === 7) return false;
                        // Dąż do przodu
                        if(m.toRow > m.fromRow) return true;
                        return false;
                    });
                     bestMove = goodMoves.length > 0 ? goodMoves[Math.floor(Math.random() * goodMoves.length)] : validMoves[Math.floor(Math.random() * validMoves.length)];
                } else {
                    bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                }
            }
            
            movePiece(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);
            promoteToKing(bestMove.toRow, bestMove.toCol);
            
            const hasMoreCaptures = bestMove.capture && getPossibleMoves(bestMove.toRow, bestMove.toCol, true).length > 0;
            
            if(hasMoreCaptures) {
                 renderBoard();
                 setTimeout(() => computerMove(), 500);
                 return;
            }
            
            currentPlayer = 'white';
            if(getAllPlayerMoves('white', false).length === 0 && getAllPlayerMoves('white', true).length === 0){
                isGameOver = true;
                statusDisplay.textContent = "Niestety, komputer wygrał.";
            }
            renderBoard();
        };
        
        const updateStatus = () => {
            if(isGameOver) return;
            statusDisplay.textContent = currentPlayer === 'white' ? 'Twoja kolej (białe)' : 'Kolej komputera (czarne)';
        };

        initializeBoard();
        renderBoard();
    };

    const difficultySelector = document.createElement('div');
    difficultySelector.className = 'difficulty-selector';
    const easyBtn = createButton('Łatwy', () => startGame('Łatwy'));
    const mediumBtn = createButton('Średni', () => startGame('Średni'));
    const hardBtn = createButton('Trudny', () => startGame('Trudny'));
    difficultySelector.append(easyBtn, mediumBtn, hardBtn);
    
    gameArea.appendChild(difficultySelector);
    container.appendChild(gameArea);

    return container;
}


function createEnglishLearningView() {
    const container = document.createElement('div');
    container.className = 'game-container english-container';

    const gameArea = document.createElement('div');

    const startQuiz = (mode) => {
        const words = [
            { pl: 'Kot', en: 'Cat', options: ['Dog', 'Mouse', 'Bird'] }, { pl: 'Pies', en: 'Dog', options: ['Cat', 'Fish', 'Lion'] }, { pl: 'Dom', en: 'House', options: ['Home', 'Car', 'Tree'] }, { pl: 'Woda', en: 'Water', options: ['Fire', 'Milk', 'Wine'] }, { pl: 'Chleb', en: 'Bread', options: ['Butter', 'Cheese', 'Ham'] }, { pl: 'Słońce', en: 'Sun', options: ['Moon', 'Star', 'Sky'] }, { pl: 'Książka', en: 'Book', options: ['Paper', 'Pen', 'Desk'] }, { pl: 'Jabłko', en: 'Apple', options: ['Orange', 'Banana', 'Pear'] }, { pl: 'Samochód', en: 'Car', options: ['Bus', 'Bike', 'Train'] }, { pl: 'Drzewo', en: 'Tree', options: ['Flower', 'Grass', 'Leaf'] }
        ];
        const sentences = [
            { pl: 'Jak się masz?', en: 'How are you?', options: ['What is your name?', 'Where are you from?', 'How old are you?'] }, { pl: 'Dziękuję', en: 'Thank you', options: ['Please', 'Sorry', 'Excuse me'] }, { pl: 'Nazywam się...', en: 'My name is...', options: ['I am...', 'I have...', 'I like...'] }, { pl: 'Która jest godzina?', en: 'What time is it?', options: ['How much is it?', 'Where is the toilet?', 'Can you help me?'] }, { pl: 'Do zobaczenia wkrótce', en: 'See you soon', options: ['Good morning', 'Good night', 'Goodbye'] }
        ];

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
        
        function newQuestion() {
            currentItem = data[Math.floor(Math.random() * data.length)];
            questionDisplay.textContent = `Przetłumacz: "${currentItem.pl}"`;
            statusDisplay.textContent = '';
            
            const options = [currentItem.en, ...currentItem.options].sort(() => Math.random() - 0.5);
            
            optionsContainer.innerHTML = '';
            options.forEach(optionText => {
                const button = createButton(optionText, () => handleAnswerClick(optionText, button));
                button.classList.add('option-button');
                optionsContainer.appendChild(button);
            });
        }
        
        function handleAnswerClick(selectedOption, button) {
            const isCorrect = selectedOption === currentItem.en;
            Array.from(optionsContainer.children).forEach(child => {
                const btn = child;
                btn.disabled = true;
                if (btn.textContent === currentItem.en) btn.classList.add('correct-answer');
                else if (btn === button) btn.classList.add('incorrect-answer');
            });

            if (isCorrect) statusDisplay.textContent = 'Świetnie!';
            else statusDisplay.textContent = `Prawidłowa odpowiedź to "${currentItem.en}".`;
        }

        gameArea.append(questionDisplay, optionsContainer, statusDisplay, newButton);
        newQuestion();
    };
    
    const modeSelector = document.createElement('div');
    modeSelector.className = 'difficulty-selector';
    const wordsBtn = createButton('Podstawowe Słówka', () => startQuiz('words'));
    const sentencesBtn = createButton('Podstawowe Zdania', () => startQuiz('sentences'));
    modeSelector.append(wordsBtn, sentencesBtn);

    container.append(modeSelector, gameArea);
    return container;
}


function createProverbGameView() {
    const container = document.createElement('div');
    container.className = 'game-container proverb-container';

    const proverbs = [
        { start: 'Gdzie kucharek sześć,', correct: 'tam nie ma co jeść', incorrect: ['tam jest pyszne ciasto', 'tam każdy się naje', 'tam jest wielki bal'] }, { start: 'Gdy się człowiek spieszy,', correct: 'to się diabeł cieszy', incorrect: ['to zawsze zdąży', 'to na pociąg nie zdąży', 'to anioł się smuci'] }, { start: 'Lepszy wróbel w garści,', correct: 'niż gołąb na dachu', incorrect: ['niż orzeł na niebie', 'niż kura w zupie', 'niż nic nie mieć'] }, { start: 'Kto rano wstaje,', correct: 'temu Pan Bóg daje', incorrect: ['ten jest niewyspany', 'ten chodzi zły cały dzień', 'ten idzie spać wcześnie'] }, { start: 'Niedaleko pada jabłko', correct: 'od jabłoni', incorrect: ['od gruszy', 'od śliwki', 'w trawę'] }, { start: 'Apetyt rośnie', correct: 'w miarę jedzenia', incorrect: ['przed obiadem', 'na deser', 'gdy się jest głodnym'] }, { start: 'Bez pracy', correct: 'nie ma kołaczy', incorrect: ['nie ma pieniędzy', 'nie ma odpoczynku', 'nie ma zabawy'] }, { start: 'Darowanemu koniowi', correct: 'w zęby się nie zagląda', incorrect: ['grzywy się nie czesze', 'siodła się nie kupuje', 'dziękuje się grzecznie'] }, { start: 'Fortuna kołem się toczy,', correct: 'raz na górze, raz na dole', incorrect: ['i nigdy nie zatrzymuje', 'i toczy się szybko', 'i bywa zdradliwa'] }, { start: 'Jaka praca,', correct: 'taka płaca', incorrect: ['taki odpoczynek', 'taki człowiek', 'taka nuda'] }, { start: 'Kto pod kim dołki kopie,', correct: 'ten sam w nie wpada', incorrect: ['ten jest górnikiem', 'ten się zmęczy', 'ten nie ma czasu na nic innego'] }, { start: 'Nie chwal dnia', correct: 'przed zachodem słońca', incorrect: ['dopóki nie wstaniesz', 'zanim się nie skończy', 'przed południem'] }, { start: 'Prawdziwych przyjaciół', correct: 'poznaje się w biedzie', incorrect: ['na imprezie', 'w szkole', 'na wakacjach'] }, { start: 'W zdrowym ciele,', correct: 'zdrowy duch', incorrect: ['dużo siły', 'mało chorób', 'dobre samopoczucie'] }, { start: 'Cisza jak', correct: 'makiem zasiał', incorrect: ['w kościele', 'w bibliotece', 'w nocy'] }, { start: 'Co dwie głowy,', correct: 'to nie jedna', incorrect: ['to za dużo', 'to kłótnia', 'to tłok'] }, { start: 'Grosz do grosza,', correct: 'a będzie kokosza', incorrect: ['a będzie fortuna', 'a będzie skarb', 'a będzie bogactwo'] }, { start: 'Kowal zawinił,', correct: 'a Cygana powiesili', incorrect: ['a kowala ukarali', 'a koń uciekł', 'a podkowa zardzewiała'] }, { start: 'Kto pyta,', correct: 'nie błądzi', incorrect: ['jest ciekawy', 'dużo wie', 'nie zna odpowiedzi'] }, { start: 'Lepsza jest prawda,', correct: 'choćby najgorsza', incorrect: ['niż słodkie kłamstwo', 'niż miłe słowa', 'niż cisza'] }, { start: 'Nie ma tego złego,', correct: 'co by na dobre nie wyszło', incorrect: ['co by się nie dało naprawić', 'co by się nie skończyło', 'co by się nie powtórzyło'] }, { start: 'Strach ma', correct: 'wielkie oczy', incorrect: ['krótkie nogi', 'długie ręce', 'ostre zęby'] }, { start: 'Wilk syty', correct: 'i owca cała', incorrect: ['i baran zadowolony', 'i pasterz spokojny', 'i las cichy'] }, { start: 'Gdzie drwa rąbią,', correct: 'tam wióry lecą', incorrect: ['tam jest głośno', 'tam jest las', 'tam jest praca'] }, { start: 'Jak sobie pościelesz,', correct: 'tak się wyśpisz', incorrect: ['tak ci będzie', 'tak będziesz miał', 'takie będziesz miał sny'] }, { start: 'Kropla drąży', correct: 'skałę', incorrect: ['kamień', 'ziemię', 'drewno'] }, { start: 'Mądry Polak', correct: 'po szkodzie', incorrect: ['przed szkodą', 'zawsze', 'nigdy'] }, { start: 'Nie wszystko złoto,', correct: 'co się świeci', incorrect: ['co jest drogie', 'co jest w skarbcu', 'co jest piękne'] }, { start: 'Od przybytku', correct: 'głowa nie boli', incorrect: ['jest radość', 'jest bogactwo', 'jest szczęście'] }, { start: 'Ziarnko do ziarnka,', correct: 'aż zbierze się miarka', incorrect: ['aż będzie góra', 'aż będzie dużo', 'aż będzie skarb'] },
    ];
    let currentProverb;
    let recentlyUsed = [];

    const newProverb = () => {
        let availableProverbs = proverbs.filter(p => !recentlyUsed.includes(p.start));
        if (availableProverbs.length === 0) {
            recentlyUsed = [currentProverb ? currentProverb.start : ''];
            availableProverbs = proverbs.filter(p => !recentlyUsed.includes(p.start));
        }
        
        currentProverb = availableProverbs[Math.floor(Math.random() * availableProverbs.length)];
        recentlyUsed.push(currentProverb.start);
        
        if (recentlyUsed.length > proverbs.length / 2) {
            recentlyUsed.shift();
        }

        const proverbDisplay = container.querySelector('.proverb-display');
        const optionsContainer = container.querySelector('.proverb-options');
        const statusDisplay = container.querySelector('.game-status');

        proverbDisplay.textContent = currentProverb.start + ' ...';
        statusDisplay.textContent = '';
        
        const options = [currentProverb.correct, ...currentProverb.incorrect].sort(() => Math.random() - 0.5);
        
        optionsContainer.innerHTML = '';
        options.forEach(optionText => {
            const button = createButton(optionText, () => handleAnswerClick(optionText, button));
            button.classList.add('option-button');
            optionsContainer.appendChild(button);
        });
    };

    const handleAnswerClick = (selectedOption, button) => {
        const isCorrect = selectedOption === currentProverb.correct;
        const optionsContainer = container.querySelector('.proverb-options');
        const statusDisplay = container.querySelector('.game-status');
        
        Array.from(optionsContainer.children).forEach(child => {
            const btn = child;
            btn.disabled = true;
            if (btn.textContent === currentProverb.correct) btn.classList.add('correct-answer');
            else if (btn === button) btn.classList.add('incorrect-answer');
        });

        if (isCorrect) statusDisplay.textContent = 'Doskonale! Prawidłowa odpowiedź.';
        else statusDisplay.textContent = `Niestety, to nie to.`;
    };
    
    container.innerHTML = `
        <p class="proverb-display"></p>
        <div class="proverb-options"></div>
        <p class="game-status"></p>
    `;
    const newButton = createButton('Nowe przysłowie', newProverb);
    newButton.style.marginTop = '1rem';
    container.appendChild(newButton);

    setTimeout(newProverb, 0);
    return container;
}


function createMathGameView() {
    const container = document.createElement('div');
    container.className = 'game-container math-container';

    const gameArea = document.createElement('div');
    
    const startGame = (difficulty) => {
        let score = 0;
        let currentAnswer;
        gameArea.innerHTML = '';

        const scoreDisplay = document.createElement('p');
        scoreDisplay.className = 'game-score';
        const updateScore = () => { scoreDisplay.textContent = `Punkty: ${score}`; };
        updateScore();

        const problemDisplay = document.createElement('p');
        problemDisplay.className = 'math-problem';

        const input = document.createElement('input');
        input.type = 'number';
        input.placeholder = '?';
        
        const statusDisplay = document.createElement('p');
        statusDisplay.className = 'game-status';

        const controls = document.createElement('div');
        controls.className = 'math-controls';
        
        const generateProblem = () => {
            input.value = '';
            input.disabled = false;
            statusDisplay.textContent = '';
            input.classList.remove('correct', 'incorrect');
            
            const rand = (max, min = 1) => Math.floor(Math.random() * (max - min + 1)) + min;
            let num1, num2, operator;

            if (difficulty === 'easy') {
                num1 = rand(20); num2 = rand(20);
                if (Math.random() > 0.5) { operator = '+'; currentAnswer = num1 + num2; } 
                else { operator = '-'; if (num1 < num2) [num1, num2] = [num2, num1]; currentAnswer = num1 - num2; }
            } else if (difficulty === 'medium') {
                 const opType = rand(3);
                 if (opType === 1) { num1 = rand(100); num2 = rand(100); operator = '+'; currentAnswer = num1 + num2; } 
                 else if (opType === 2) { num1 = rand(100); num2 = rand(100); if(num1<num2) [num1, num2] = [num2, num1]; operator = '-'; currentAnswer = num1 - num2; } 
                 else { num1 = rand(12); num2 = rand(12); operator = '*'; currentAnswer = num1 * num2; }
            } else {
                const opType = rand(4);
                 if (opType === 1) { num1 = rand(200, 50); num2 = rand(200, 50); operator = '+'; currentAnswer = num1 + num2; } 
                 else if (opType === 2) { num1 = rand(300, 20); num2 = rand(200, 20); if(num1<num2) [num1, num2] = [num2, num1]; operator = '-'; currentAnswer = num1 - num2; } 
                 else if (opType === 3) { num1 = rand(20, 5); num2 = rand(20, 5); operator = '*'; currentAnswer = num1 * num2; } 
                 else { num2 = rand(15, 2); num1 = num2 * rand(15, 2); operator = '/'; currentAnswer = num1 / num2; }
            }
            problemDisplay.textContent = `${num1} ${operator.replace('*', '×').replace('/', '÷')} ${num2} = ?`;
        };

        const checkAnswer = () => {
            const userAnswer = parseInt(input.value, 10);
            if (isNaN(userAnswer)) { statusDisplay.textContent = 'Proszę wpisać liczbę.'; return; }
            if (userAnswer === currentAnswer) {
                statusDisplay.textContent = 'Dobrze!';
                input.classList.add('correct');
                score++;
                updateScore();
                input.disabled = true;
                setTimeout(generateProblem, 1500);
            } else {
                statusDisplay.textContent = `Źle. Prawidłowa odpowiedź to ${currentAnswer}.`;
                input.classList.add('incorrect');
                input.disabled = true;
            }
        };
        
        const checkButton = createButton('Sprawdź', checkAnswer);
        const newProblemButton = createButton('Nowe zadanie', generateProblem);
        controls.append(checkButton, newProblemButton);
        gameArea.append(scoreDisplay, problemDisplay, input, statusDisplay, controls);
        generateProblem();
    };
    
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
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            const isVisible = (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100);
            backToTopBtn.classList.toggle('visible', isVisible);
        };
    }
}

initializeApp();