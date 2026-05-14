const printBtn = document.getElementById("printBtn");
const toggle = document.getElementById("themeToggle");
const modeIcon = document.querySelector(".mode-icon"); // changed from modeText
const body = document.body;

printBtn.addEventListener("click", () => window.print());

toggle.addEventListener("change", () => {
  if (toggle.checked) {
    body.classList.add("dark");
    modeIcon.textContent = "🦉"; // moon icon
  } else {
    body.classList.remove("dark");
    modeIcon.textContent = "🌼"; // sun icon
  }
});
