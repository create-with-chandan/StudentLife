const STORAGE_KEY = "studentlife-dashboard-v1";
const toast = document.querySelector(".toast");
const dialog = document.querySelector(".app-dialog");
let toastTimer;
let breathingTimer;
let breathingSeconds = 300;

const starterTasks = [
    { id: "task-dsa", name: "Complete DSA practice (2 hrs)", time: "10:00 AM", done: true },
    { id: "task-assignment", name: "College assignment (Report)", time: "12:00 PM", done: true },
    { id: "task-react", name: "Watch React JS tutorial", time: "03:00 PM", done: false },
    { id: "task-reading", name: "Read 1 chapter (Book)", time: "07:00 PM", done: false },
    { id: "task-gym", name: "Gym / Workout", time: "08:00 PM", done: false },
    { id: "task-plan", name: "Plan tomorrow", time: "10:00 PM", done: false }
];

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3000);
}

function freshState() {
    return { tasks: starterTasks.map((task) => ({ ...task })), moods: {}, moodNotes: {}, sleep: [], journal: [], goals: [], profileName: "Chandan", glass: 58 };
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return freshState();
        const saved = JSON.parse(raw);
        const defaults = freshState();
        return {
            ...defaults,
            ...saved,
            tasks: Array.isArray(saved.tasks) ? saved.tasks : defaults.tasks,
            moods: saved.moods && typeof saved.moods === "object" ? saved.moods : {},
            moodNotes: saved.moodNotes && typeof saved.moodNotes === "object" ? saved.moodNotes : {},
            sleep: Array.isArray(saved.sleep) ? saved.sleep : [],
            journal: Array.isArray(saved.journal) ? saved.journal : [],
            goals: Array.isArray(saved.goals) ? saved.goals : [],
            profileName: typeof saved.profileName === "string" ? saved.profileName : "Chandan",
            glass: Number.isFinite(saved.glass) ? Math.min(82, Math.max(32, saved.glass)) : 58
        };
    } catch (error) {
        console.error("Unable to read StudentLife browser data.", error);
        showToast("Saved information could not be read. Fresh demo data is shown.");
        return freshState();
    }
}

const state = loadState();

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        document.documentElement.style.setProperty("--glass-opacity", String(state.glass / 100));
    } catch (error) {
        console.error("Unable to save StudentLife browser data.", error);
        showToast("Browser storage is unavailable. Changes may not last after you leave.");
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function localDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function readableDate(value, options = { month: "short", day: "numeric" }) {
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat(undefined, options).format(date);
}

function updateHeader() {
    const now = new Date();
    document.querySelector("[data-current-date]").textContent = new Intl.DateTimeFormat(undefined, {
        day: "2-digit", month: "short", year: "numeric"
    }).format(now);
    document.querySelector("[data-current-time]").textContent = new Intl.DateTimeFormat(undefined, {
        weekday: "short", hour: "2-digit", minute: "2-digit"
    }).format(now);
    const profile = document.querySelector(".profile-avatar");
    profile.textContent = state.profileName.trim().charAt(0).toUpperCase() || "C";
    document.documentElement.style.setProperty("--glass-opacity", String(state.glass / 100));
}

function closeDialog() {
    dialog?.close();
}

function showTopic(topic) {
    const topics = {
        academic: ["Academic load", "Try choosing one assignment and naming its very next action. Work in a short block, then pause. If the workload feels unmanageable, ask a teacher or someone you trust for help prioritising."],
        sleep: ["Rest and recovery", "Low energy can make pressure feel heavier. A steady wind-down, fewer late screens, and short breaks may help. If sleep difficulties persist, consider talking with a health professional."],
        future: ["Future and connection", "You do not need every answer today. Focus on one part you can control, and reach out to someone supportive if comparison or uncertainty is weighing on you."]
    };
    if (!dialog) {
        showToast(topics[topic]?.[0] || "Take a moment to notice how you feel.");
        return;
    }
    const [title, copy] = topics[topic] || topics.academic;
    dialog.querySelector("#dialog-title").textContent = title;
    dialog.querySelector(".dialog-content").innerHTML = `<div class="report-content"><p>${copy}</p><div class="dialog-actions"><button class="button button-primary" type="button" data-close-dialog>Close</button></div></div>`;
    dialog.showModal();
    dialog.querySelector("[data-close-dialog]").addEventListener("click", closeDialog);
}

function renderPlanner() {
    const list = document.querySelector("#planner-task-list");
    const empty = document.querySelector("#planner-empty");
    list.replaceChildren();
    const done = state.tasks.filter((task) => task.done).length;
    document.querySelector("#planner-count").textContent = `${done}/${state.tasks.length} complete`;
    empty.hidden = state.tasks.length > 0;

    state.tasks.forEach((task) => {
        const item = document.createElement("li");
        item.className = `task-item planner-task${task.done ? " is-done" : ""}`;
        item.dataset.taskId = task.id;
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.setAttribute("aria-label", `${task.done ? "Mark incomplete" : "Complete"}: ${task.name}`);
        const custom = document.createElement("span");
        custom.className = "custom-checkbox";
        const name = document.createElement("span");
        name.className = "task-name";
        name.textContent = task.name;
        label.append(checkbox, custom, name);
        const time = document.createElement("time");
        time.textContent = task.time || "Anytime";
        const remove = document.createElement("button");
        remove.className = "delete-entry";
        remove.type = "button";
        remove.setAttribute("aria-label", `Remove ${task.name}`);
        remove.textContent = "×";
        item.append(label, time, remove);
        list.append(item);
    });
}

function openTaskDialog() {
    dialog.querySelector("#dialog-title").textContent = "Add a task";
    dialog.querySelector(".dialog-content").innerHTML = `<form class="dialog-form" id="dialog-task-form"><label for="dialog-task-name">What would you like to work on?</label><input id="dialog-task-name" name="name" maxlength="90" required placeholder="e.g. Review lecture notes"><label for="dialog-task-time">When will you do it? (optional)</label><input id="dialog-task-time" name="time" type="time"><div class="dialog-actions"><button class="button button-primary" type="submit">Add task</button></div></form>`;
    dialog.showModal();
    dialog.querySelector("#dialog-task-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const name = String(form.get("name") || "").trim();
        if (!name) return;
        const timeInput = String(form.get("time") || "");
        const time = timeInput ? new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(`2000-01-01T${timeInput}`)) : "Anytime";
        state.tasks.push({ id: `task-${Date.now()}`, name, time, done: false });
        saveState();
        renderPlanner();
        closeDialog();
        showToast("Task added to your planner.");
    });
}

function setupPlanner() {
    renderPlanner();
    document.querySelector("[data-open-task]").addEventListener("click", openTaskDialog);
    document.querySelector("#planner-task-list").addEventListener("change", (event) => {
        if (!(event.target instanceof HTMLInputElement) || event.target.type !== "checkbox") return;
        const task = state.tasks.find((item) => item.id === event.target.closest(".planner-task")?.dataset.taskId);
        if (!task) return;
        task.done = event.target.checked;
        saveState();
        renderPlanner();
    });
    document.querySelector("#planner-task-list").addEventListener("click", (event) => {
        const button = event.target.closest(".delete-entry");
        if (!button) return;
        const taskId = button.closest(".planner-task").dataset.taskId;
        state.tasks = state.tasks.filter((task) => task.id !== taskId);
        saveState();
        renderPlanner();
        showToast("Task removed.");
    });
}

function setupAcademics() {
    const series = {
        "7D": [6.3, 5.8, 6.9, 6.2, 7.6, 6.7, 7.5],
        "14D": [5.3, 6.1, 5.7, 7.1, 6.4, 6.9, 7.5],
        "30D": [4.8, 5.5, 6.4, 5.9, 7.2, 6.6, 7.5]
    };
    const offsets = { "7D": 6, "14D": 13, "30D": 29 };
    document.querySelectorAll("[data-academic-range]").forEach((button) => {
        button.addEventListener("click", () => {
            document.querySelector(".segmented-control .is-selected")?.classList.remove("is-selected");
            button.classList.add("is-selected");
            const range = button.dataset.academicRange;
            const points = series[range].map((value, index) => ({ x: index * 100, y: 250 - value * 25 }));
            const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
            document.querySelector(".academic-chart .chart-line").setAttribute("d", path);
            document.querySelector(".academic-chart .chart-area-fill").setAttribute("d", `${path} V250 H0Z`);
            const circles = points.map((point) => {
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", String(point.x));
                circle.setAttribute("cy", String(point.y));
                circle.setAttribute("r", "5");
                return circle;
            });
            document.querySelector(".academic-chart .chart-points").replaceChildren(...circles);
            document.querySelector(".academic-chart .chart-tooltip").innerHTML = `${series[range][6].toFixed(1)}<small>Today</small>`;
            const labels = document.querySelectorAll(".academic-trend .chart-x-labels span");
            labels.forEach((label, index) => {
                const date = new Date();
                date.setDate(date.getDate() - offsets[range] + Math.round((offsets[range] / 6) * index));
                label.textContent = new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short" }).format(date);
            });
            const firstLabel = labels[0].textContent;
            const lastLabel = labels[6].textContent;
            document.querySelector(".academic-chart svg").setAttribute(
                "aria-label",
                `Illustrative study pressure levels from ${firstLabel} to ${lastLabel}, ending at ${series[range][6].toFixed(1)} out of 10.`
            );
            showToast(`Showing the ${range} illustrative study trend.`);
        });
    });
}

function setupWellbeing() {
    const form = document.querySelector("#wellbeing-mood-form");
    const savedCheckin = document.querySelector("#saved-checkin");
    const today = localDate(new Date());
    const names = ["Very low", "Low", "Okay", "Good", "Great"];
    const render = () => {
        const rating = state.moods[today];
        savedCheckin.textContent = rating ? `Today's check-in: ${names[rating - 1]}${state.moodNotes[today] ? ` — “${state.moodNotes[today]}”` : ""}` : "No mood check-in saved for today yet.";
    };
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const rating = Number(data.get("rating"));
        if (rating < 1 || rating > 5) return;
        state.moods[today] = rating;
        const note = String(data.get("note") || "").trim();
        if (note) state.moodNotes[today] = note;
        else delete state.moodNotes[today];
        saveState();
        render();
        form.reset();
        showToast("Your mood check-in was saved on this device.");
    });
    render();
}

function renderSleep() {
    const list = document.querySelector("#sleep-history");
    const empty = document.querySelector("#sleep-empty");
    list.replaceChildren();
    empty.hidden = state.sleep.length > 0;
    state.sleep.slice(0, 14).forEach((entry, index) => {
        const card = document.createElement("article");
        card.className = "entry-card sleep-entry";
        const heading = document.createElement("div");
        heading.className = "entry-heading";
        const date = document.createElement("strong");
        date.textContent = index === 0 ? "Most recent" : readableDate(entry.date);
        const amount = document.createElement("span");
        amount.textContent = `${entry.hours} ${entry.hours === 1 ? "hour" : "hours"}`;
        heading.append(date, amount);
        const detail = document.createElement("p");
        detail.textContent = entry.note || readableDate(entry.date, { weekday: "long", month: "short", day: "numeric" });
        card.append(heading, detail);
        list.append(card);
    });
}

function setupSleep() {
    renderSleep();
    document.querySelector("#sleep-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const hours = Number(form.get("hours"));
        if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
            showToast("Enter a sleep duration between 0 and 24 hours.");
            return;
        }
        state.sleep.unshift({ date: localDate(new Date()), hours, note: String(form.get("note") || "").trim() });
        state.sleep = state.sleep.slice(0, 30);
        saveState();
        renderSleep();
        event.currentTarget.reset();
        showToast("Sleep log saved on this device.");
    });
}

function renderGoals() {
    const list = document.querySelector("#goal-list");
    const empty = document.querySelector("#goal-empty");
    list.replaceChildren();
    empty.hidden = state.goals.length > 0;
    const done = state.goals.filter((goal) => goal.done).length;
    document.querySelector("#goal-count").textContent = `${state.goals.length} goals · ${done} complete`;
    state.goals.forEach((goal) => {
        const item = document.createElement("li");
        item.className = `goal-item${goal.done ? " is-done" : ""}`;
        item.dataset.goalId = goal.id;
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = goal.done;
        checkbox.setAttribute("aria-label", `${goal.done ? "Reopen" : "Complete"} goal: ${goal.text}`);
        const indicator = document.createElement("span");
        indicator.className = "goal-check";
        const name = document.createElement("span");
        name.className = "goal-name";
        name.textContent = goal.text;
        label.append(checkbox, indicator, name);
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "delete-entry";
        remove.textContent = "×";
        remove.setAttribute("aria-label", `Remove goal: ${goal.text}`);
        item.append(label, remove);
        list.append(item);
    });
}

function setupGoals() {
    const list = document.querySelector("#goal-list");
    renderGoals();
    document.querySelector("#goal-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const field = document.querySelector("#goal-input");
        const text = field.value.trim();
        if (!text) return;
        state.goals.unshift({ id: `goal-${Date.now()}`, text, done: false });
        saveState();
        renderGoals();
        field.value = "";
        showToast("Goal added. You can update it any time.");
    });
    list.addEventListener("change", (event) => {
        if (!(event.target instanceof HTMLInputElement)) return;
        const goal = state.goals.find((item) => item.id === event.target.closest(".goal-item")?.dataset.goalId);
        if (!goal) return;
        goal.done = event.target.checked;
        saveState();
        renderGoals();
    });
    list.addEventListener("click", (event) => {
        const remove = event.target.closest(".delete-entry");
        if (!remove) return;
        const id = remove.closest(".goal-item").dataset.goalId;
        state.goals = state.goals.filter((goal) => goal.id !== id);
        saveState();
        renderGoals();
        showToast("Goal removed.");
    });
}

function renderJournal() {
    const list = document.querySelector("#journal-list");
    const empty = document.querySelector("#journal-empty");
    list.replaceChildren();
    empty.hidden = state.journal.length > 0;
    state.journal.slice(0, 50).forEach((entry) => {
        const card = document.createElement("article");
        card.className = "entry-card journal-entry";
        card.dataset.entryId = entry.id;
        const heading = document.createElement("div");
        heading.className = "entry-heading";
        const title = document.createElement("strong");
        title.textContent = entry.title || readableDate(entry.date, { month: "long", day: "numeric", year: "numeric" });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "delete-entry";
        remove.textContent = "×";
        remove.setAttribute("aria-label", `Delete journal entry: ${title.textContent}`);
        heading.append(title, remove);
        const date = document.createElement("time");
        date.textContent = readableDate(entry.date, { weekday: "short", month: "short", day: "numeric" });
        const text = document.createElement("p");
        text.textContent = entry.text;
        card.append(heading, date, text);
        list.append(card);
    });
}

function setupJournal() {
    const list = document.querySelector("#journal-list");
    renderJournal();
    document.querySelector("#journal-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const text = String(form.get("text") || "").trim();
        if (!text) return;
        state.journal.unshift({
            id: `entry-${Date.now()}`,
            date: localDate(new Date()),
            title: String(form.get("title") || "").trim(),
            text
        });
        saveState();
        renderJournal();
        event.currentTarget.reset();
        showToast("Journal entry saved on this device.");
    });
    list.addEventListener("click", (event) => {
        const remove = event.target.closest(".delete-entry");
        if (!remove) return;
        const id = remove.closest(".journal-entry").dataset.entryId;
        state.journal = state.journal.filter((entry) => entry.id !== id);
        saveState();
        renderJournal();
        showToast("Journal entry deleted.");
    });
}

function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `studentlife-data-${localDate(new Date())}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Your data export is ready.");
}

function clearData() {
    if (!window.confirm("Delete all StudentLife information stored in this browser? This cannot be undone.")) return;
    try {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
    } catch (error) {
        console.error("Unable to clear StudentLife browser data.", error);
        showToast("Could not clear browser data. Check your browser storage settings.");
    }
}

function setupSettings() {
    const form = document.querySelector("#settings-form");
    const name = document.querySelector("#settings-name");
    const glass = document.querySelector("#settings-glass");
    const glassValue = document.querySelector("#settings-glass-value");
    name.value = state.profileName;
    glass.value = String(state.glass);
    glassValue.textContent = `${state.glass}%`;
    glass.addEventListener("input", () => {
        glassValue.textContent = `${glass.value}%`;
        document.documentElement.style.setProperty("--glass-opacity", String(Number(glass.value) / 100));
    });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        state.profileName = name.value.trim() || "Student";
        state.glass = Number(glass.value);
        saveState();
        showToast("Preferences saved on this device.");
    });
    document.querySelector('[data-settings-action="export"]').addEventListener("click", exportData);
    document.querySelector('[data-settings-action="clear"]').addEventListener("click", clearData);
}

function setupBreathing() {
    const button = document.querySelector("[data-action='breathing']");
    if (!button) return;
    button.addEventListener("click", () => {
        if (breathingTimer) {
            window.clearInterval(breathingTimer);
            breathingTimer = undefined;
            breathingSeconds = 300;
            button.textContent = "Start 5-minute reset";
            showToast("Reset paused. Return when you are ready.");
            return;
        }
        breathingSeconds = 300;
        button.textContent = "Stop reset · 5:00";
        showToast("Breathe in gently, then exhale slowly. Take it at your own pace.");
        breathingTimer = window.setInterval(() => {
            breathingSeconds -= 1;
            button.textContent = `Stop reset · ${Math.floor(breathingSeconds / 60)}:${String(breathingSeconds % 60).padStart(2, "0")}`;
            if (breathingSeconds <= 0) {
                window.clearInterval(breathingTimer);
                breathingTimer = undefined;
                button.textContent = "Start 5-minute reset";
                showToast("Your reset is complete. Notice how you feel.");
            }
        }, 1000);
    });
}

dialog?.querySelector(".dialog-close").addEventListener("click", closeDialog);
dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
});
document.querySelector(".notification-button").addEventListener("click", () => {
    if (!dialog) {
        showToast("Take a moment to pause and check in with yourself.");
        return;
    }
    dialog.querySelector("#dialog-title").textContent = "A gentle reminder";
    dialog.querySelector(".dialog-content").innerHTML = `<div class="report-content"><p>Your dashboard is a reflection tool, not a diagnosis.</p><ul><li>Take short breaks during long study sessions.</li><li>Ask someone you trust for support when pressure feels difficult to carry alone.</li><li>If you feel unsafe or overwhelmed, contact a trusted person or local professional support.</li></ul><div class="dialog-actions"><button class="button button-primary" type="button" data-close-dialog>Got it</button></div></div>`;
    dialog.showModal();
    dialog.querySelector("[data-close-dialog]").addEventListener("click", closeDialog);
});

updateHeader();
window.setInterval(updateHeader, 60_000);
setupBreathing();
document.querySelectorAll("[data-topic]").forEach((button) => button.addEventListener("click", () => showTopic(button.dataset.topic)));

const pageSetups = {
    academics: setupAcademics,
    planner: setupPlanner,
    wellbeing: setupWellbeing,
    sleep: setupSleep,
    goals: setupGoals,
    journal: setupJournal,
    settings: setupSettings
};
pageSetups[document.body.dataset.page]?.();
