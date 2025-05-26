// src/utils.js
export const afficherMessage = (texte, type) => {
  const messageElement = document.createElement("div")
  messageElement.className = `alerte-flottante alerte-${type}`
  messageElement.innerHTML = `
    <div class="icone-alerte">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    </div>
    <div class="texte-alerte">${texte}</div>
    <button class="fermer-alerte">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `

  document.body.appendChild(messageElement)

  setTimeout(() => {
    messageElement.classList.add("visible")
  }, 10)

  const boutonFermer = messageElement.querySelector(".fermer-alerte")
  if (boutonFermer) {
    boutonFermer.addEventListener("click", () => {
      messageElement.classList.remove("visible")
      messageElement.classList.add("disparition")
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.parentNode.removeChild(messageElement)
        }
      }, 300)
    })
  }

  setTimeout(() => {
    if (messageElement.parentNode) {
      messageElement.classList.remove("visible")
      messageElement.classList.add("disparition")
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.parentNode.removeChild(messageElement)
        }
      }, 300)
    }
  }, 5000)
}