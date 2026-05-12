const GITHUB_TOKEN = "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";
const REPO = "wilyanal-cell/casa-arrumada-pro";

let db = {
    users: [],
    tasks: []
};

let currentUser = null;

/* ===================== LOAD DB ===================== */

async function loadDB() {
    const res = await fetch("./dados.json");
    db = await res.json();
}

/* ===================== SAVE CONTROL (ANTI-SPAM) ===================== */

let saveTimeout = null;

function queueSave() {
    clearTimeout(saveTimeout);

    saveTimeout = setTimeout(() => {
        saveDB();
    }, 800);
}

/* ===================== SAVE DB (GITHUB API) ===================== */

async function saveDB() {

    try {

        const fileRes = await fetch(
            `https://api.github.com/repos/${REPO}/contents/dados.json`,
            {
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`
                }
            }
        );

        const fileData = await fileRes.json();

        const sha = fileData.sha;

        await fetch(
            `https://api.github.com/repos/${REPO}/contents/dados.json`,
            {
                method: "PUT",
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: "update db",
                    content: btoa(unescape(encodeURIComponent(JSON.stringify(db, null, 2)))),
                    sha: sha
                })
            }
        );

    } catch (err) {
        console.error("Erro ao salvar no GitHub:", err);
    }
}

/* ===================== LOGIN ===================== */

function login() {

    const u = document.getElementById("user").value;
    const p = document.getElementById("pass").value;

    const user = db.users.find(x =>
        x.username === u && x.password === p
    );

    if (!user) return alert("Erro login");

    currentUser = user;

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";

    document.getElementById("welcome").innerText =
        "Bem-vinda " + user.username + " 👋";

    if (user.role !== "user") {
        document.getElementById("adminPanel").style.display = "block";
    }

    render();
}

/* ===================== LOGOUT ===================== */

function logout() {
    location.reload();
}

/* ===================== CREATE USER ===================== */

function createUser() {

    db.users.push({
        username: newUser.value,
        password: newPass.value,
        role: newRole.value
    });

    queueSave();
    render();
}

/* ===================== DELETE USER ===================== */

function deleteUser(name) {

    db.users = db.users.filter(u => u.username !== name);

    queueSave();
    render();
}

/* ===================== CREATE TASK ===================== */

function createTask() {

    db.tasks.push({
        id: Date.now(),
        name: taskName.value,
        user: taskUser.value,
        status: "pendente",
        photo: null
    });

    queueSave();
    render();
}

/* ===================== RENDER ===================== */

function render() {

    tasks.innerHTML = "";

    const myTasks = currentUser.role === "user"
        ? db.tasks.filter(t => t.user === currentUser.username)
        : db.tasks;

    myTasks.forEach(t => {

        tasks.innerHTML += `
            <div class="card">
                <h3>${t.name} 🎯</h3>
                <p>👤 ${t.user}</p>
                <p>📌 ${t.status}</p>
            </div>
        `;
    });

    if (currentUser.role !== "user") {

        userList.innerHTML = db.users.map(u => `
            <div class="card">
                👤 ${u.username} (${u.role})
                <button onclick="deleteUser('${u.username}')">❌</button>
            </div>
        `).join("");

        taskUser.innerHTML = db.users
            .filter(u => u.role === "user")
            .map(u => `<option value="${u.username}">${u.username}</option>`)
            .join("");
    }
}

/* ===================== START ===================== */

(async () => {
    await loadDB();
})();