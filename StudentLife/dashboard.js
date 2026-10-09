const STORAGE_KEY = "studentlife-dashboard-v1";
const toast = document.querySelector(".toast");
const dialog = document.querySelector(".app-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogContent = document.querySelector(".dialog-content");
const taskList = document.querySelector(".task-list");
const taskCount = document.querySelector(".task-count");
const moodDays = document.querySelector(".mood-days");
let toastTimer;
let breathingTimer;
let breathingSeconds = 300;
let moodRange = 7;
let storageWarningShown = false;

const starterTasks = [
    { id: "task-dsa", name: "Complete DSA practice (2 hrs)", time: "10:00 AM", done: true },
    { id: "task-assignment", name: "College assignment (Report)", time: "12:00 PM", done: true },
    { id: "task-react", name: "Watch React JS tutorial", time: "03:00 PM", done: false },
    { id: "task-reading", name: "Read 1 chapter (Book)", time: "07:00 PM", done: false },
    { id: "task-gym", name: "Gym / Workout", time: "08:00 PM", done: false },
    { id: "task-plan", name: "Plan tomorrow", time: "10:00 PM", done: false }
];

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return { tasks: starterTasks.map((task) => ({ ...task })), moods: {}, moodNotes: {}, sleep: [], journal: [], goals: [], profileName: "Chandan", glass: 58 };
        const parsed = JSON.parse(saved);
        return {
            tasks: Array.isArray(parsed.tasks) ? parsed.tasks : starterTasks.map((task) => ({ ...task })),
            moods: parsed.moods && typeof parsed.moods === "object" ? parsed.moods : {},
            moodNotes: parsed.moodNotes && typeof parsed.moodNotes === "object" ? parsed.moodNotes : {},
            sleep: Array.isArray(parsed.sleep) ? parsed.sleep : [],
            journal: Array.isArray(parsed.journal) ? parsed.journal : [],
            goals: Array.isArray(parsed.goals) ? parsed.goals : [],
            profileName: typeof parsed.profileName === "string" ? parsed.profileName : "Chandan",
            glass: Number.isFinite(parsed.glass) ? Math.min(82, Math.max(32, parsed.glass)) : 58
        };
    } catch (error) {
        console.error("Unable to read StudentLife browser data.", error);
        showToast("Saved dashboard data could not be read. Your session is using fresh demo data.");
        return { tasks: starterTasks.map((task) => ({ ...task })), moods: {}, moodNotes: {}, sleep: [], journal: [], goals: [], profileName: "Chandan", glass: 58 };
    }
}

const state = loadState();

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        document.documentElement.style.setProperty("--glass-opacity", `${state.glass / 100}`);
    } catch (error) {
        console.error("Unable to save StudentLife browser data.", error);
        if (!storageWarningShown) {
            storageWarningShown = true;
            showToast("Browser storage is unavailable. Changes will last only for this visit.");
        }
    }
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3000);
}

function openDialog(title, content, onSubmit) {
    dialogTitle.textContent = title;
    dialogContent.innerHTML = content;
    dialogContent.querySelector("form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
    });
    dialog.showModal();
    dialog.querySelector("input, textarea, button")?.focus();
}

function closeDialog() {
    dialog.close();
}

dialog.querySelector(".dialog-close").addEventListener("click", closeDialog);
dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
});
dialog.addEventListener("cancel", () => {
    dialogContent.replaceChildren();
});
dialog.addEventListener("close", () => {
    dialogContent.replaceChildren();
    document.documentElement.style.setProperty("--glass-opacity", `${state.glass / 100}`);
});

function localDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDate(date, options) {
    return new Intl.DateTimeFormat(undefined, options).format(date);
}

function updateDateTime() {
    const now = new Date();
    document.querySelector("#today-date").textContent = formatDate(now, {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
    document.querySelector("#today-time").textContent = formatDate(now, {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
    const hour = now.getHours();
    document.querySelector("#greeting").textContent = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function updateTaskMetrics() {
    const total = state.tasks.length;
    const completed = state.tasks.filter((task) => task.done).length;
    taskCount.textContent = `${completed}/${total}`;
    const percentage = total ? Math.round((completed / total) * 100) : 0;
    document.querySelector(".metric-blue .metric-value").innerHTML = `${percentage}<span>%</span>`;
    document.querySelector(".progress-ring strong").textContent = `${percentage}%`;
    document.querySelector(".progress-ring").style.background = `conic-gradient(#18d9b6 0 ${percentage}%, #153960 ${percentage}% 100%)`;
    const taskInsight = document.querySelector(".insight-good");
    taskInsight.querySelector("strong").textContent = completed === total ? "All tasks are complete!" : "Keep your progress steady";
    taskInsight.querySelector("p").textContent = `${completed} of ${total} tasks completed. Small steps count.`;
}

function renderTasks() {
    taskList.replaceChildren();
    state.tasks.forEach((task) => {
        const item = document.createElement("li");
        item.className = `task-item${task.done ? " is-done" : ""}`;
        item.dataset.taskId = task.id;

        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.setAttribute("aria-label", `${task.done ? "Mark incomplete" : "Complete"}: ${task.name}`);
        const checkmark = document.createElement("span");
        checkmark.className = "custom-checkbox";
        const name = document.createElement("span");
        name.className = "task-name";
        name.textContent = task.name;
        label.append(checkbox, checkmark, name);

        const time = document.createElement("time");
        time.textContent = task.time || "Anytime";
        item.append(label, time);
        taskList.append(item);
    });
    updateTaskMetrics();
}

function taskForm() {
    openDialog("Add a task", `<form class="dialog-form">
        <label for="task-name-input">What would you like to work on?</label>
        <input id="task-name-input" name="name" maxlength="90" required placeholder="e.g. Review lecture notes">
        <label for="task-time-input">When will you do it?</label>
        <input id="task-time-input" name="time" type="time">
        <div class="dialog-actions"><button class="button button-primary" type="submit">Add task</button></div>
    </form>`, (formData) => {
        const name = String(formData.get("name") || "").trim();
        if (!name) return;
        const timeValue = String(formData.get("time") || "");
        const time = timeValue ? formatDate(new Date(`2000-01-01T${timeValue}`), { hour: "2-digit", minute: "2-digit" }) : "Anytime";
        state.tasks.push({ id: `task-${Date.now()}`, name, time, done: false });
        saveState();
        renderTasks();
        closeDialog();
        showToast("Task added to your list.");
    });
}

taskList.addEventListener("change", (event) => {
    const checkbox = event.target;
    if (!(checkbox instanceof HTMLInputElement) || checkbox.type !== "checkbox") return;
    const task = state.tasks.find((item) => item.id === checkbox.closest(".task-item")?.dataset.taskId);
    if (!task) return;
    task.done = checkbox.checked;
    saveState();
    renderTasks();
});

const moodFaces = ["☹", "🙁", "😐", "🙂", "☺"];
const moodNames = ["Very low", "Low", "Okay", "Good", "Great"];

function renderMoods() {
    moodDays.replaceChildren();
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7;
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - dayOfWeek);
    const dates = [];
    const start = new Date(firstDay);
    if (moodRange === 7) {
        for (let offset = 0; offset < 7; offset += 1) {
            const date = new Date(start);
            date.setDate(start.getDate() + offset);
            dates.push(date);
        }
    } else {
        for (let offset = 29; offset >= 0; offset -= 1) {
            const date = new Date(today);
            date.setDate(today.getDate() - offset);
            dates.push(date);
        }
    }

    dates.forEach((date) => {
        const key = localDate(date);
        const rating = state.moods[key];
        const button = document.createElement("button");
        button.type = "button";
        button.className = `mood-day${key === localDate(today) ? " is-current" : ""}${rating ? " has-mood" : ""}`;
        button.dataset.date = key;
        button.setAttribute("aria-label", `${formatDate(date, { weekday: "long", month: "short", day: "numeric" })}${rating ? ` mood: ${moodNames[rating - 1]}` : ", log mood"}`);

        const face = document.createElement("span");
        face.textContent = rating ? moodFaces[rating - 1] : "＋";
        const label = document.createElement("small");
        label.textContent = moodRange === 7 ? formatDate(date, { weekday: "short" }) : formatDate(date, { day: "numeric", month: "short" });
        const score = document.createElement("b");
        score.textContent = rating ? String(rating) : "–";
        button.append(face, label, score);
        moodDays.append(button);
    });
}

function moodForm(dateKey) {
    const selected = state.moods[dateKey] || 3;
    openDialog("Log your mood", `<form class="dialog-form">
        <p class="form-hint">A check-in is just information. There is no right or wrong answer.</p>
        <fieldset class="mood-options"><legend>How are you feeling?</legend>
            ${moodNames.map((name, index) => `<label class="mood-option"><input type="radio" name="rating" value="${index + 1}" ${selected === index + 1 ? "checked" : ""}><span>${moodFaces[index]}</span><small>${name}</small></label>`).join("")}
        </fieldset>
        <label for="mood-note">Optional note</label>
        <textarea id="mood-note" name="note" maxlength="240" rows="3" placeholder="What might be affecting your mood?"></textarea>
        <div class="dialog-actions"><button class="button button-primary" type="submit">Save check-in</button></div>
    </form>`, (formData) => {
        const rating = Number(formData.get("rating"));
        if (rating < 1 || rating > 5) return;
        state.moods[dateKey] = rating;
        const note = String(formData.get("note") || "").trim();
        if (note) state.moodNotes[dateKey] = note;
        else delete state.moodNotes[dateKey];
        saveState();
        renderMoods();
        closeDialog();
        showToast("Mood check-in saved on this device.");
    });
}

moodDays.addEventListener("click", (event) => {
    const day = event.target.closest(".mood-day");
    if (day) moodForm(day.dataset.date);
});

document.querySelector(".mood-range").addEventListener("click", (event) => {
    moodRange = moodRange === 7 ? 30 : 7;
    event.currentTarget.textContent = moodRange === 7 ? "This Week⌄" : "Last 30 days⌄";
    renderMoods();
});

const chartSeries = {
    "7D": { labels: [0, 1, 2, 3, 4, 5, 6], values: [6.3, 5.8, 6.9, 6.2, 7.6, 6.7, 7.5] },
    "14D": { labels: [0, 2, 4, 6, 8, 10, 13], values: [5.3, 6.1, 5.7, 7.1, 6.4, 6.9, 7.5] },
    "30D": { labels: [0, 5, 10, 15, 20, 25, 29], values: [4.8, 5.5, 6.4, 5.9, 7.2, 6.6, 7.5] }
};

function renderChart(range) {
    const series = chartSeries[range];
    const today = new Date();
    const span = range === "7D" ? 6 : range === "14D" ? 13 : 29;
    const labels = series.labels.map((dayOffset) => {
        const date = new Date(today);
        date.setDate(today.getDate() - span + dayOffset);
        return formatDate(date, { day: "2-digit", month: "short" });
    });
    document.querySelectorAll(".chart-x-labels span").forEach((label, index) => {
        label.textContent = labels[index];
    });

    const coordinates = series.values.map((value, index) => ({
        x: index * 100,
        y: 250 - value * 25
    }));
    const linePath = coordinates.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
    document.querySelector(".chart-line").setAttribute("d", linePath);
    document.querySelector(".chart-area-fill").setAttribute("d", `${linePath} V250 H0Z`);
    const points = document.querySelector(".chart-points");
    points.replaceChildren(...coordinates.map((point) => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", String(point.x));
        circle.setAttribute("cy", String(point.y));
        circle.setAttribute("r", "5");
        return circle;
    }));
    const latest = series.values[series.values.length - 1].toFixed(1);
    document.querySelector(".chart-tooltip").innerHTML = `${latest}<small>Today</small>`;
    document.querySelector(".chart-area svg").setAttribute("aria-label", `Stress levels from ${labels[0]} to ${labels[6]}, ending at ${latest} out of 10.`);
}

document.querySelector(".segmented-control").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-range]");
    if (!button) return;
    document.querySelector(".segmented-control .is-selected")?.classList.remove("is-selected");
    button.classList.add("is-selected");
    renderChart(button.dataset.range);
});

function logSleep() {
    openDialog("Track last night's sleep", `<form class="dialog-form">
        <label for="sleep-hours">How many hours did you sleep?</label>
        <input id="sleep-hours" name="hours" type="number" min="0" max="24" step="0.25" required value="${state.sleep[0]?.hours ?? ""}" placeholder="For example, 7.5">
        <p class="form-hint">Most adults do best with 7–9 hours. Your entry stays on this device.</p>
        <div class="dialog-actions"><button class="button button-primary" type="submit">Save sleep</button></div>
    </form>`, (formData) => {
        const hours = Number(formData.get("hours"));
        if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
            showToast("Enter a sleep duration from 0 to 24 hours.");
            return;
        }
        state.sleep.unshift({ date: localDate(new Date()), hours });
        state.sleep = state.sleep.slice(0, 30);
        saveState();
        updateSleepSummary();
        closeDialog();
        showToast("Sleep entry saved on this device.");
    });
}

function updateSleepSummary() {
    const latest = state.sleep[0];
    document.querySelector("#sleep-summary").textContent = latest ? `${latest.hours} hrs` : "Log sleep";
    if (!latest) return;
    const value = Math.min(10, Math.max(0, (latest.hours / 8) * 10));
    document.querySelector(".metric-teal .metric-value").innerHTML = `${value.toFixed(1)} <span>/ 10</span>`;
    const pressureScore = document.querySelector(".pressure-sleep > b");
    pressureScore.innerHTML = `${value.toFixed(1)}<small>/10</small>`;
    const sleepInsight = document.querySelector(".insight-sleep");
    sleepInsight.querySelector("strong").textContent = latest.hours < 7 ? "Your sleep could use more recovery" : "Nice work making room for rest";
    sleepInsight.querySelector("p").textContent = latest.hours < 7 ? `You logged ${latest.hours} hours. A steadier wind-down may help.` : `You logged ${latest.hours} hours. Keep protecting your rest.`;
}

function openJournal() {
    const entries = state.journal.slice(0, 5);
    openDialog("Write a journal entry", `<form class="dialog-form">
        <p class="form-hint">Your reflections are private to this browser and are not sent anywhere.</p>
        <label for="journal-entry">What's on your mind?</label>
        <textarea id="journal-entry" name="entry" rows="5" maxlength="1000" required placeholder="Write freely. You can keep it short."></textarea>
        ${entries.length ? `<section class="recent-entries"><h3>Recent entries</h3>${entries.map((entry) => `<p><time>${formatDate(new Date(`${entry.date}T12:00:00`), { month: "short", day: "numeric" })}</time> ${escapeHTML(entry.text.slice(0, 110))}${entry.text.length > 110 ? "…" : ""}</p>`).join("")}</section>` : ""}
        <div class="dialog-actions"><button class="button button-primary" type="submit">Save privately</button></div>
    </form>`, (formData) => {
        const text = String(formData.get("entry") || "").trim();
        if (!text) return;
        state.journal.unshift({ id: `entry-${Date.now()}`, date: localDate(new Date()), text });
        state.journal = state.journal.slice(0, 50);
        saveState();
        closeDialog();
        showToast("Journal entry saved on this device.");
    });
}

function escapeHTML(value) {
    return value.replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function openSettings() {
    openDialog("Dashboard preferences", `<form class="dialog-form">
        <label for="profile-name-input">Name shown on your dashboard</label>
        <input id="profile-name-input" name="profileName" maxlength="32" required value="${escapeHTML(state.profileName)}">
        <label for="glass-range">Dashboard transparency <span id="glass-value">${state.glass}%</span></label>
        <input id="glass-range" name="glass" type="range" min="32" max="82" value="${state.glass}">
        <p class="form-hint">Your tasks, mood check-ins, sleep log, and journal are stored only in this browser.</p>
        <div class="settings-tools"><button class="text-button" type="button" data-dialog-action="export">Export my data</button><button class="text-button danger-button" type="button" data-dialog-action="clear">Clear saved data</button></div>
        <div class="dialog-actions"><button class="button button-primary" type="submit">Save preferences</button></div>
    </form>`, (formData) => {
        state.profileName = String(formData.get("profileName") || "").trim() || "Student";
        state.glass = Number(formData.get("glass")) || 58;
        saveState();
        document.querySelector("#profile-name").textContent = state.profileName;
        closeDialog();
        showToast("Dashboard preferences saved.");
    });

    const glassRange = dialog.querySelector("#glass-range");
    glassRange.addEventListener("input", () => {
        dialog.querySelector("#glass-value").textContent = `${glassRange.value}%`;
        document.documentElement.style.setProperty("--glass-opacity", String(Number(glassRange.value) / 100));
    });
    dialog.querySelector('[data-dialog-action="export"]').addEventListener("click", exportData);
    dialog.querySelector('[data-dialog-action="clear"]').addEventListener("click", clearData);
}

function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `studentlife-data-${localDate(new Date())}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Your dashboard data has been exported.");
}

function clearData() {
    const confirmed = window.confirm("Clear all StudentLife data saved in this browser? This cannot be undone.");
    if (!confirmed) return;
    try {
        localStorage.removeItem(STORAGE_KEY);
        state.tasks = starterTasks.map((task) => ({ ...task }));
        state.moods = {};
        state.moodNotes = {};
        state.sleep = [];
        state.journal = [];
        state.goals = [];
        state.profileName = "Chandan";
        state.glass = 58;
        saveState();
        renderTasks();
        renderMoods();
        updateSleepSummary();
        document.querySelector("#profile-name").textContent = state.profileName;
        closeDialog();
        showToast("Saved dashboard data cleared.");
    } catch (error) {
        console.error("Unable to clear StudentLife browser data.", error);
        showToast("Could not clear saved data. Check your browser storage settings.");
    }
}

function openNotifications() {
    openDialog("Your wellbeing check-in", `<div class="report-content">
        <p><strong>A gentle reminder:</strong> your dashboard is a reflection tool, not a diagnosis.</p>
        <ul><li>Pause for a few minutes between long study sessions.</li><li>Ask someone you trust for support when pressure feels hard to manage alone.</li><li>If you feel unsafe or overwhelmed, reach out to a trusted person or local professional support.</li></ul>
        <div class="dialog-actions"><button class="button button-primary" type="button" data-dialog-action="done">Got it</button></div>
    </div>`);
    dialog.querySelector('[data-dialog-action="done"]').addEventListener("click", closeDialog);
}

function openReport() {
    const done = state.tasks.filter((task) => task.done).length;
    const moodEntries = Object.values(state.moods);
    const averageMood = moodEntries.length ? (moodEntries.reduce((sum, rating) => sum + rating, 0) / moodEntries.length).toFixed(1) : "Not logged yet";
    const averageSleep = state.sleep.length ? `${(state.sleep.reduce((sum, entry) => sum + entry.hours, 0) / state.sleep.length).toFixed(1)} hours` : "Not logged yet";
    openDialog("Your personal dashboard report", `<div class="report-content">
        <p>This summary uses only information saved in this browser. It is for reflection, not clinical assessment.</p>
        <ul><li><strong>Tasks:</strong> ${done} of ${state.tasks.length} complete.</li><li><strong>Mood check-ins:</strong> ${moodEntries.length ? `${moodEntries.length} logged, average ${averageMood}/5.` : averageMood}.</li><li><strong>Sleep:</strong> ${averageSleep} average across ${state.sleep.length} entr${state.sleep.length === 1 ? "y" : "ies"}.</li><li><strong>Journal:</strong> ${state.journal.length} private entr${state.journal.length === 1 ? "y" : "ies"}.</li></ul>
        <div class="dialog-actions"><button class="button button-primary" type="button" data-dialog-action="done">Close report</button><button class="text-button" type="button" data-dialog-action="export">Export data</button></div>
    </div>`);
    dialog.querySelector('[data-dialog-action="done"]').addEventListener("click", closeDialog);
    dialog.querySelector('[data-dialog-action="export"]').addEventListener("click", exportData);
}

const awarenessTopics = {
    academic: ["Academic load", "Break assignments into the next small action, then choose one task to do for 20–25 minutes. A realistic plan is more useful than trying to do everything at once."],
    sleep: ["Rest & recovery", "Low energy can make everyday work feel heavier. Try a consistent wind-down, a screen break before bed, and a short pause between study blocks."],
    future: ["Future uncertainty", "You do not need to solve your whole future today. Focus on one controllable next step, and limit comparisons that leave you feeling worse."]
};

document.querySelector(".content-grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-topic]");
    if (!button) return;
    const [title, description] = awarenessTopics[button.dataset.topic];
    openDialog(title, `<div class="report-content"><p>${description}</p><p>If this pressure is persistent or affecting your wellbeing, consider talking with someone you trust or a qualified professional.</p><div class="dialog-actions"><button class="button button-primary" type="button" data-dialog-action="done">Close</button></div></div>`);
    dialog.querySelector('[data-dialog-action="done"]').addEventListener("click", closeDialog);
});

function startBreathingReset(button) {
    if (breathingTimer) {
        window.clearInterval(breathingTimer);
        breathingTimer = undefined;
        breathingSeconds = 300;
        button.textContent = "Start 5-minute reset";
        showToast("Reset paused. Come back whenever you are ready.");
        return;
    }
    breathingSeconds = 300;
    button.textContent = "Stop reset · 5:00";
    showToast("Breathe in gently, then breathe out slowly. No need to force it.");
    breathingTimer = window.setInterval(() => {
        breathingSeconds -= 1;
        const minutes = Math.floor(breathingSeconds / 60);
        const seconds = String(breathingSeconds % 60).padStart(2, "0");
        button.textContent = `Stop reset · ${minutes}:${seconds}`;
        if (breathingSeconds <= 0) {
            window.clearInterval(breathingTimer);
            breathingTimer = undefined;
            button.textContent = "Start 5-minute reset";
            showToast("Your reset is complete. Notice how you feel.");
        }
    }, 1000);
}

document.querySelector(".quick-actions").addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    switch (button.dataset.action) {
        case "task": taskForm(); break;
        case "mood": moodForm(localDate(new Date())); break;
        case "sleep": logSleep(); break;
        case "journal": openJournal(); break;
        case "settings": openSettings(); break;
        default: showToast("That action is not available.");
    }
});

document.querySelector(".sleep-stat").addEventListener("click", logSleep);
document.querySelector(".breathing-button").addEventListener("click", (event) => startBreathingReset(event.currentTarget));
document.querySelector(".notification-button").addEventListener("click", openNotifications);
document.querySelector(".profile-avatar").addEventListener("click", openSettings);
document.querySelector(".report-button").addEventListener("click", (event) => {
    event.preventDefault();
    openReport();
});

document.querySelector(".navigation").addEventListener("click", (event) => {
    const link = event.target.closest(".nav-link");
    if (!link) return;
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.toggle("is-active", item === link));
    if (link.dataset.action === "settings") {
        event.preventDefault();
        openSettings();
    }
});

document.documentElement.style.setProperty("--glass-opacity", `${state.glass / 100}`);
document.querySelector("#profile-name").textContent = state.profileName;
updateDateTime();
window.setInterval(updateDateTime, 60_000);
renderTasks();
renderMoods();
renderChart("7D");
updateSleepSummary();
