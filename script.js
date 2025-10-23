const API_URL = "https://threeb-final-lab1.onrender.com/api/students/";

let editingStudentId = null; 

document.addEventListener("DOMContentLoaded", () => {
    const addStudentBtn = document.getElementById("addStudentBtn");
    const formPopup = document.querySelector(".form-popup");
    const closeFormBtn = document.getElementById("closeForm");
    const submitStudentBtn = document.getElementById("submitStudentBtn");

    formPopup.style.display = "none";

   
    addStudentBtn.addEventListener("click", () => {
        editingStudentId = null; 
        clearForm();
        clearErrors();
        submitStudentBtn.textContent = "Add Student";
        formPopup.style.display = "block";
    });
    closeFormBtn.addEventListener("click", () => {
        formPopup.style.display = "none";
    });

    submitStudentBtn.addEventListener("click", async () => {
        if (editingStudentId) {
            await updateStudent(editingStudentId);
        } else {
            await addStudent();
        }
    });

    loadStudents();
});

async function loadStudents() {
    const res = await fetch(API_URL);
    const students = await res.json();
    const tbody = document.getElementById("studentBody");
    tbody.innerHTML = "";

    students.forEach(st => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${st.id}</td>
      <td>${st.first_name} ${st.middle_name || ""} ${st.last_name}</td>
      <td>${st.address}</td>
      <td>${st.gender}</td>
      <td>${st.height_cm}</td>
      <td>${st.weight_kg}</td>
      <td>${st.date_of_birth}</td>
      <td>
        <button onclick="editStudent(${st.id})">Edit</button>
        <button onclick="deleteStudent(${st.id})">Delete</button>
      </td>
    `;
        tbody.appendChild(tr);
    });
}

async function addStudent() {
    clearErrors();

    const student = getFormData();
    if (!validateStudent(student)) return;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(student)
        });

        if (res.ok) {
            alert("Student added successfully!");
            loadStudents();
            clearForm();
            document.querySelector(".form-popup").style.display = "none";
        } else {
            const errorData = await res.json();
            handleServerErrors(errorData);
        }
    } catch (err) {
        alert("Network error: " + err.message);
    }
}

async function editStudent(id) {
    const res = await fetch(API_URL + id + "/");
    if (!res.ok) {
        alert("Failed to load student data.");
        return;
    }

    const st = await res.json();
    editingStudentId = id;

    document.getElementById("first_name").value = st.first_name;
    document.getElementById("middle_name").value = st.middle_name || "";
    document.getElementById("last_name").value = st.last_name;
    document.getElementById("address").value = st.address;
    document.getElementById("gender").value = st.gender;
    document.getElementById("height_cm").value = st.height_cm;
    document.getElementById("weight_kg").value = st.weight_kg;
    document.getElementById("date_of_birth").value = st.date_of_birth;

    const formPopup = document.querySelector(".form-popup");
    const submitStudentBtn = document.getElementById("submitStudentBtn");
    submitStudentBtn.textContent = "Update Student";
    formPopup.style.display = "block";
}

async function updateStudent(id) {
    clearErrors();

    const updatedData = getFormData();
    if (!validateStudent(updatedData)) return;

    try {
        const res = await fetch(API_URL + id + "/", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData)
        });

        if (res.ok) {
            alert("Student updated successfully!");
            loadStudents();
            clearForm();
            document.querySelector(".form-popup").style.display = "none";
            editingStudentId = null;
            document.getElementById("submitStudentBtn").textContent = "Add Student";
        } else {
            const errorData = await res.json();
            handleServerErrors(errorData);
        }
    } catch (err) {
        alert("Network error: " + err.message);
    }
}

async function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student?")) return;

    const res = await fetch(API_URL + id + "/", { method: "DELETE" });
    if (res.status === 204) {
        alert("Student deleted successfully!");
        loadStudents();
    } else {
        alert("Failed to delete student.");
    }
}

function getFormData() {
    return {
        first_name: document.getElementById("first_name").value.trim(),
        middle_name: document.getElementById("middle_name").value.trim(),
        last_name: document.getElementById("last_name").value.trim(),
        address: document.getElementById("address").value.trim(),
        gender: document.getElementById("gender").value,
        height_cm: parseInt(document.getElementById("height_cm").value.trim()),
        weight_kg: parseFloat(document.getElementById("weight_kg").value.trim()),
        date_of_birth: document.getElementById("date_of_birth").value.trim()
    };
}

function validateStudent(st) {
    let hasError = false;
    if (!st.first_name) showError("first_name", "First name is required."), hasError = true;
    if (!st.last_name) showError("last_name", "Last name is required."), hasError = true;
    if (!st.address) showError("address", "Address is required."), hasError = true;
    if (!st.gender) showError("gender", "Please select gender."), hasError = true;
    if (isNaN(st.height_cm) || st.height_cm <= 0) showError("height_cm", "Height must be positive."), hasError = true;
    if (isNaN(st.weight_kg) || st.weight_kg <= 0) showError("weight_kg", "Weight must be positive."), hasError = true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(st.date_of_birth)) showError("date_of_birth", "Use YYYY-MM-DD format."), hasError = true;
    return !hasError;
}

function handleServerErrors(errorData) {
    for (const field in errorData) {
        showError(field, errorData[field][0]);
    }
}

function showError(field, message) {
    const el = document.querySelector(`.error[data-for="${field}"]`);
    if (el) el.textContent = message;
}

function clearErrors() {
    document.querySelectorAll(".error").forEach(el => (el.textContent = ""));
}

function clearForm() {
    document.querySelectorAll("#studentForm input, #studentForm select").forEach(input => {
        input.value = "";
    });
}


document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector(".search");
    if (searchInput) {
        searchInput.addEventListener("input", async (e) => {
            const query = e.target.value.trim().toLowerCase();
            await searchStudents(query);
        });
    }
});

async function searchStudents(query) {
    const tbody = document.getElementById("studentBody");
    tbody.innerHTML = "<tr><td colspan='8'>Searching...</td></tr>";

    try {
        const res = await fetch(API_URL);
        let students = await res.json();

        if (query) {
            students = students.filter(st => {
                const fullName = `${st.first_name} ${st.middle_name || ""} ${st.last_name}`.toLowerCase();
                return (
                    fullName.includes(query) ||
                    st.address.toLowerCase().includes(query)
                );
            });
        }

        tbody.innerHTML = "";
        if (students.length === 0) {
            tbody.innerHTML = "<tr><td colspan='8'>No students found.</td></tr>";
            return;
        }

        students.forEach(st => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td>${st.id}</td>
        <td>${st.first_name} ${st.middle_name || ""} ${st.last_name}</td>
        <td>${st.address}</td>
        <td>${st.gender}</td>
        <td>${st.height_cm}</td>
        <td>${st.weight_kg}</td>
        <td>${st.date_of_birth}</td>
        <td>
          <button onclick="editStudent(${st.id})">Edit</button>
          <button onclick="deleteStudent(${st.id})">Delete</button>
        </td>
      `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8">Error loading search results.</td></tr>`;
        console.error(err);
    }
}
