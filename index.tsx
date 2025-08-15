/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';

// --- STATE MANAGEMENT ---
type Reminder = { id: number; text: string; date: string; time: string; };

interface AppState {
    dailyFact: string;
    factLoading: boolean;
    reminders: Reminder[];
}

const state: AppState = {
    dailyFact: '',
    factLoading: false,
    reminders: [],
};

// --- GEMINI API SETUP ---
let ai: GoogleGenAI | null = null;
try {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} catch (error)
{
    console.error("Failed to initialize GoogleGenAI:", error);
}

async function fetchDailyFact() {
    if (!ai) {
        state.dailyFact = "Nie można połączyć się z usługą ciekawostek.";
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
        console.error("Error fetching daily fact:", error);
        state.dailyFact = "Nie udało się dziś pobrać ciekawostki. Spróbuj ponownie później.";
    } finally {
        state.factLoading = false;
        render();
    }
}

// --- REMINDERS LOGIC ---
function loadReminders() {
    const savedReminders = localStorage.getItem('reminders');
    if (savedReminders) {
        state.reminders = JSON.parse(savedReminders);
        sortReminders();
    }
}

function saveReminders() {
    localStorage.setItem('reminders', JSON.stringify(state.reminders));
}

function sortReminders() {
    state.reminders.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
    });
}

function addReminder(text: string, date: string, time: string) {
    if (!text || !date || !time) {
        alert("Proszę wypełnić wszystkie pola przypomnienia.");
        return;
    }
    const newReminder: Reminder = { id: Date.now(), text, date, time };
    state.reminders.push(newReminder);
    sortReminders();
    saveReminders();
    render();

    const list = document.querySelector('.reminders-list');
    if (list && list.lastElementChild && !list.lastElementChild.classList.contains('empty-message')) {
        (list.lastElementChild as HTMLElement).classList.add('new-item-fade-in');
    }
}

function deleteReminder(id: number) {
    const reminderItem = document.querySelector(`[data-reminder-id='${id}']`);
    if (reminderItem) {
        reminderItem.classList.add('fade-out');
        setTimeout(() => {
            state.reminders = state.reminders.filter(r => r.id !== id);
            saveReminders();
            render();
        }, 500); // Duration must match CSS animation
    } else {
        // Fallback for safety
        state.reminders = state.reminders.filter(r => r.id !== id);
        saveReminders();
        render();
    }
}


// --- RENDER FUNCTIONS (UI COMPONENTS) ---
const root = document.getElementById('root') as HTMLElement;

function render() {
    // We only render the dynamic parts to avoid rebuilding the whole DOM
    const factContent = document.getElementById('fact-content');
    const factCard = document.querySelector('.fact-card');

    if (factCard) {
        if (state.factLoading) {
            factCard.classList.add('is-loading');
        } else {
            factCard.classList.remove('is-loading');
        }
    }
    if (factContent) {
        factContent.textContent = state.dailyFact || 'Kliknij przycisk, aby pobrać ciekawostkę!';
    }


    const remindersList = document.querySelector('.reminders-list');
    if (remindersList) {
        renderRemindersList(remindersList as HTMLElement);
    }
}

function createFullUI() {
    root.innerHTML = ''; // Clear previous content
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


function createHeader(): HTMLElement {
    const header = document.createElement('header');
    header.className = 'app-header';
    
    const icon = document.createElement('div');
    icon.className = 'header-icon';
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>`;

    const title = document.createElement('h1');
    title.textContent = "Kącik Seniora";
    
    const welcomeMessage = document.createElement('p');
    welcomeMessage.textContent = 'Proste, pomocne i przyjemne miejsce dla Ciebie.';
    welcomeMessage.className = 'welcome-message';

    header.append(icon, title, welcomeMessage);
    return header;
}


function createFactSection(): HTMLElement {
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


function createGamesSection(): HTMLElement {
    const section = document.createElement('section');
    section.id = 'games-section';
    section.className = 'page-section';

    const title = document.createElement('h2');
    title.textContent = 'Gry';

    const navGrid = document.createElement('div');
    navGrid.className = 'nav-grid';

    const memoryGameButton = createNavCard('Gra Pamięciowa', '🖼️', () => openGameModal('memory', 'Gra Pamięciowa'));
    const tictactoeButton = createNavCard('Kółko i Krzyżyk', '⭕', () => openGameModal('tictactoe', 'Kółko i Krzyżyk'));
    const proverbButton = createNavCard('Dokończ Przysłowia', '📜', () => openGameModal('proverb', 'Dokończ Przysłowia'));
    const mathButton = createNavCard('Ćwiczenia Matematyczne', '🔢', () => openGameModal('math', 'Ćwiczenia Matematyczne'));

    navGrid.append(memoryGameButton, tictactoeButton, proverbButton, mathButton);
    section.append(title, navGrid);
    return section;
}


function createRemindersSection(): HTMLElement {
    const section = document.createElement('section');
    section.id = 'reminders-section';
    section.className = 'page-section';

    const title = document.createElement('h2');
    title.textContent = 'Moje Przypomnienia';

    // Form for new reminder
    const formCard = document.createElement('div');
    formCard.className = 'card';
    const form = document.createElement('form');
    form.onsubmit = (e) => {
        e.preventDefault();
        const textInput = form.querySelector('#reminder-text') as HTMLInputElement;
        const dateInput = form.querySelector('#reminder-date') as HTMLInputElement;
        const timeInput = form.querySelector('#reminder-time') as HTMLInputElement;
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

    // List of existing reminders
    const list = document.createElement('ul');
    list.className = 'reminders-list';
    renderRemindersList(list);

    section.append(title, formCard, list);
    return section;
}

function renderRemindersList(listElement: HTMLElement) {
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
function openGameModal(gameType: 'memory' | 'tictactoe' | 'proverb' | 'math', title: string) {
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
        case 'tictactoe':
            gameView = createTicTacToeView();
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


function createMemoryGameView(): HTMLElement {
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

// --- GAME LOGIC (MEMORY) ---
function startMemoryGame() {
    const board = document.querySelector('.game-board');
    if (!board) return;

    const ANIMAL_IMAGES = [
        'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200',
        'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200',
        'https://images.pexels.com/photos/2295744/pexels-photo-2295744.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200',
        'https://images.pexels.com/photos/247502/pexels-photo-247502.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200',
        'https://images.pexels.com/photos/1665243/pexels-photo-1665243.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200',
        'https://images.pexels.com/photos/4001296/pexels-photo-4001296.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200',
        'https://images.pexels.com/photos/51187/squirrrel-animal-cute-rodents-51187.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200',
        'https://images.pexels.com/photos/145939/pexels-photo-145939.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200'
    ];
    const cardValues = [...ANIMAL_IMAGES, ...ANIMAL_IMAGES].sort(() => 0.5 - Math.random());

    let flippedCards: HTMLElement[] = [];
    let matchedPairs = 0;
    let moves = 0;
    const movesCounter = document.getElementById('moves-counter');
    if(movesCounter) movesCounter.textContent = `Ruchy: 0`;
    
    // Clear previous win message
    const existingWinMessage = board.querySelector('.game-win-message');
    if (existingWinMessage) {
        existingWinMessage.remove();
    }

    board.innerHTML = '';
    cardValues.forEach(value => {
        const card = document.createElement('div');
        card.className = 'card-game';
        card.dataset.value = value;
        card.innerHTML = `<span class="card-face card-front"></span><div class="card-face card-back"><img src="${value}" alt="Karta ze zwierzęciem"></div>`;
        card.addEventListener('click', () => onCardClick(card));
        board.appendChild(card);
    });

    function onCardClick(card: HTMLElement) {
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
            }, 1000);
        }
    }
}


function createTicTacToeView(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'game-container tictactoe-container';

    const statusDisplay = document.createElement('p');
    statusDisplay.className = 'game-status';

    const board = document.createElement('div');
    board.className = 'tictactoe-board';
    
    const newGameButton = createButton('Nowa Gra', startGame);

    container.append(statusDisplay, board, newGameButton);

    let boardState: (string | null)[];
    let currentPlayer: 'X' | 'O';
    let isGameActive: boolean;

    function startGame() {
        boardState = Array(9).fill(null);
        currentPlayer = 'X';
        isGameActive = true;
        statusDisplay.textContent = `Twoja kolej (X)`;
        renderBoard();
    }

    function renderBoard() {
        board.innerHTML = '';
        boardState.forEach((cell, index) => {
            const cellElement = document.createElement('button');
            cellElement.className = 'tictactoe-cell';
            cellElement.textContent = cell || '';
            cellElement.disabled = !!cell || !isGameActive;
            cellElement.addEventListener('click', () => handleCellClick(index));
            board.appendChild(cellElement);
        });
    }

    function handleCellClick(index: number) {
        if (boardState[index] || !isGameActive) return;

        boardState[index] = currentPlayer;
        
        const winningLine = checkWin();
        if (winningLine) {
            isGameActive = false;
            statusDisplay.textContent = `Wygrywa ${currentPlayer}!`;
            renderBoard();
            highlightWinner(winningLine);
            return;
        }

        if (boardState.every(cell => cell)) {
            statusDisplay.textContent = 'Remis!';
            isGameActive = false;
            return;
        }
        
        renderBoard();
        currentPlayer = 'O';
        statusDisplay.textContent = `Kolej komputera (O)`;
        
        setTimeout(computerMove, 500);
    }
    
    function highlightWinner(winningLine: number[]) {
        const cells = board.querySelectorAll('.tictactoe-cell');
        winningLine.forEach(index => {
            cells[index].classList.add('winner');
        });
    }

    function computerMove() {
        if (!isGameActive) return;
        let availableCells = boardState.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
        if (availableCells.length > 0) {
            const move = availableCells[Math.floor(Math.random() * availableCells.length)] as number;
            boardState[move] = 'O';

            const winningLine = checkWin();
            if (winningLine) {
                isGameActive = false;
                statusDisplay.textContent = `Wygrywa O!`;
                renderBoard();
                highlightWinner(winningLine);
                return;
            }

            if (boardState.every(cell => cell)) {
                statusDisplay.textContent = 'Remis!';
                isGameActive = false;
                return;
            }
        }
        renderBoard();
        currentPlayer = 'X';
        statusDisplay.textContent = `Twoja kolej (X)`;
    }

    function checkWin(): number[] | null {
        const winningConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]  // diagonals
        ];
        for (const condition of winningConditions) {
            if (condition.every(index => boardState[index] === currentPlayer)) {
                return condition;
            }
        }
        return null;
    }

    setTimeout(startGame, 0);

    return container;
}

function createProverbGameView(): HTMLElement {
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

    const proverbs: { start: string; correct: string; incorrect: string[] }[] = [
        { start: 'Gdzie kucharek sześć,', correct: 'tam nie ma co jeść', incorrect: ['tam jest pyszne ciasto', 'tam każdy się naje', 'tam jest wielki bal'] },
        { start: 'Gdy się człowiek spieszy,', correct: 'to się diabeł cieszy', incorrect: ['to zawsze zdąży', 'to na pociąg nie zdąży', 'to anioł się smuci'] },
        { start: 'Lepszy wróbel w garści,', correct: 'niż gołąb na dachu', incorrect: ['niż orzeł na niebie', 'niż kura w zupie', 'niż nic nie mieć'] },
        { start: 'Kto rano wstaje,', correct: 'temu Pan Bóg daje', incorrect: ['ten jest niewyspany', 'ten chodzi zły cały dzień', 'ten idzie spać wcześnie'] },
        { start: 'Niedaleko pada jabłko', correct: 'od jabłoni', incorrect: ['od gruszy', 'od śliwki', 'w trawę'] },
        { start: 'Apetyt rośnie', correct: 'w miarę jedzenia', incorrect: ['przed obiadem', 'na deser', 'gdy się jest głodnym'] },
        { start: 'Bez pracy', correct: 'nie ma kołaczy', incorrect: ['nie ma pieniędzy', 'nie ma odpoczynku', 'nie ma zabawy'] },
        { start: 'Darowanemu koniowi', correct: 'w zęby się nie zagląda', incorrect: ['grzywy się nie czesze', 'siodła się nie kupuje', 'dziękuje się grzecznie'] },
    ];
    let currentProverb: { start: string; correct: string; incorrect: string[] };

    function newProverb() {
        currentProverb = proverbs[Math.floor(Math.random() * proverbs.length)];
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

    function handleAnswerClick(selectedOption: string, button: HTMLButtonElement) {
        const isCorrect = selectedOption === currentProverb.correct;
        
        Array.from(optionsContainer.children).forEach(child => {
            const btn = child as HTMLButtonElement;
            btn.disabled = true;
            if (btn.textContent === currentProverb.correct) {
                btn.classList.add('correct-answer');
            } else if (btn.textContent === selectedOption) {
                btn.classList.add('incorrect-answer');
            }
        });

        if (isCorrect) {
            statusDisplay.textContent = 'Doskonale! Prawidłowa odpowiedź.';
        } else {
            statusDisplay.textContent = `Niestety, to nie to.`;
        }
    }

    container.append(proverbDisplay, optionsContainer, statusDisplay, newButton);

    setTimeout(newProverb, 0);
    return container;
}


function createMathGameView(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'game-container math-container';

    const scoreDisplay = document.createElement('p');
    scoreDisplay.className = 'game-score';
    let score = 0;

    const gameArea = document.createElement('div');
    let currentAnswer: number;

    function startGame(difficulty: 'easy' | 'medium' | 'hard') {
        gameArea.innerHTML = ''; // Clear difficulty selection
        score = 0;
        updateScore();
        gameArea.appendChild(scoreDisplay);

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
        
        gameArea.append(problemDisplay, input, statusDisplay, controls);

        function updateScore() {
            scoreDisplay.textContent = `Punkty: ${score}`;
        }
        
        function generateProblem() {
            input.value = '';
            input.disabled = false;
            statusDisplay.textContent = '';
            input.classList.remove('correct', 'incorrect');
            
            const rand = (max: number, min = 1) => Math.floor(Math.random() * (max - min + 1)) + min;
            let num1: number, num2: number, operator: string;

            if (difficulty === 'easy') { // +, - (wynik dodatni), liczby do 20
                num1 = rand(20);
                num2 = rand(20);
                if (Math.random() > 0.5) {
                    operator = '+';
                    currentAnswer = num1 + num2;
                } else {
                    operator = '-';
                    if (num1 < num2) [num1, num2] = [num2, num1]; // swap to avoid negative
                    currentAnswer = num1 - num2;
                }
            } else if (difficulty === 'medium') { // +, -, * | liczby do 100 dla +/- i do 12 dla *
                 const opType = rand(3);
                 if (opType === 1) { // +
                    num1 = rand(100); num2 = rand(100); operator = '+'; currentAnswer = num1 + num2;
                 } else if (opType === 2) { // -
                    num1 = rand(100); num2 = rand(100); if(num1<num2) [num1, num2] = [num2, num1]; operator = '-'; currentAnswer = num1 - num2;
                 } else { // *
                    num1 = rand(12); num2 = rand(12); operator = '*'; currentAnswer = num1 * num2;
                 }
            } else { // hard: +, -, *, / (bez reszty)
                const opType = rand(4);
                 if (opType === 1) { // +
                    num1 = rand(200, 50); num2 = rand(200, 50); operator = '+'; currentAnswer = num1 + num2;
                 } else if (opType === 2) { // -
                    num1 = rand(300, 20); num2 = rand(200, 20); if(num1<num2) [num1, num2] = [num2, num1]; operator = '-'; currentAnswer = num1 - num2;
                 } else if (opType === 3) { // *
                    num1 = rand(20, 5); num2 = rand(20, 5); operator = '*'; currentAnswer = num1 * num2;
                 } else { // /
                    num2 = rand(15, 2);
                    num1 = num2 * rand(15, 2);
                    operator = '/';
                    currentAnswer = num1 / num2;
                 }
            }
            problemDisplay.textContent = `${num1} ${operator.replace('*', '×').replace('/', '÷')} ${num2} = ?`;
        }

        function checkAnswer() {
            const userAnswer = parseInt(input.value, 10);
            if (isNaN(userAnswer)) {
                statusDisplay.textContent = 'Proszę wpisać liczbę.';
                return;
            }
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
        }
        
        generateProblem();
    }
    
    // Initial difficulty selection
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
function createButton(text: string, onClick?: (e: MouseEvent) => void, iconClass?: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'button';
    
    if (iconClass) {
        const icon = document.createElement('span');
        icon.className = `icon ${iconClass}`;
        button.appendChild(icon);
    }
    
    const buttonText = document.createElement('span');
    buttonText.textContent = text;
    button.appendChild(buttonText);

    if (onClick) {
        button.onclick = onClick;
    }
    return button;
}

function createNavCard(text: string, icon: string, onClick: () => void): HTMLElement {
    const card = document.createElement('button');
    card.className = 'card nav-card';
    card.onclick = onClick;
    card.setAttribute('aria-label', text);

    const cardIcon = document.createElement('div');
    cardIcon.className = 'nav-card-icon';
    cardIcon.textContent = icon;

    const cardText = document.createElement('p');
    cardText.textContent = text;

    card.append(cardIcon, cardText);
    return card;
}

function createFooterNav(): HTMLElement {
    const footer = document.createElement('footer');
    footer.className = 'app-footer';

    const scrollToSection = (sectionId: string) => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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

function createBackToTopButton(): HTMLElement {
    const button = document.createElement('button');
    button.textContent = '🔼';
    button.className = 'back-to-top-btn';
    button.setAttribute('aria-label', 'Wróć na górę');
    button.onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    return button;
}

// --- INITIALIZATION ---
function initializeApp() {
    createFullUI();
    fetchDailyFact();
    loadReminders();
    render(); // To initially render the loaded reminders

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