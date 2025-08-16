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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3