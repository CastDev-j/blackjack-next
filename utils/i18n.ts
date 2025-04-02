type Language = "es" | "en"

type Translations = {
  [key in Language]: {
    [key: string]: string
  }
}

class I18nManager {
  private language: Language = "es"
  private translations: Translations = {
    es: {
      // Game UI
      title: "Blackjack",
      bet: "Apuesta",
      deal: "Repartir",
      hit: "Pedir",
      stand: "Plantarse",
      double: "Doblar",
      "new-game": "Nuevo Juego",
      player: "Jugador",
      dealer: "Crupier",
      balance: "Saldo",
      win: "¡Ganaste!",
      lose: "Perdiste",
      push: "Empate",
      blackjack: "¡Blackjack!",
      bust: "Te pasaste",
      "dealer-bust": "Crupier se pasó",

      // Settings
      settings: "Configuración",
      language: "Idioma",
      sound: "Sonido",
      on: "Activado",
      off: "Desactivado",
      spanish: "Español",
      english: "Inglés",
      save: "Guardar",
      cancel: "Cancelar",
      "sound-unavailable": "Sonidos no disponibles",
    },
    en: {
      // Game UI
      title: "Blackjack",
      bet: "Bet",
      deal: "Deal",
      hit: "Hit",
      stand: "Stand",
      double: "Double",
      "new-game": "New Game",
      player: "Player",
      dealer: "Dealer",
      balance: "Balance",
      win: "You Win!",
      lose: "You Lose",
      push: "Push",
      blackjack: "Blackjack!",
      bust: "Bust",
      "dealer-bust": "Dealer Bust",

      // Settings
      settings: "Settings",
      language: "Language",
      sound: "Sound",
      on: "On",
      off: "Off",
      spanish: "Spanish",
      english: "English",
      save: "Save",
      cancel: "Cancel",
      "sound-unavailable": "Sounds unavailable",
    },
  }

  getLanguage(): Language {
    return this.language
  }

  setLanguage(lang: Language) {
    this.language = lang
    // Guardar preferencia en localStorage solo si está disponible
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang)
    }
    return this.language
  }

  translate(key: string): string {
    return this.translations[this.language][key] || key
  }

  // Inicializar desde localStorage si existe
  init() {
    // Solo acceder a localStorage en el navegador
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("language") as Language
      if (savedLang && (savedLang === "es" || savedLang === "en")) {
        this.language = savedLang
      }
    }
  }
}

// Singleton instance
export const i18n = new I18nManager()

// Inicializar al importar, pero solo en el cliente
if (typeof window !== "undefined") {
  i18n.init()
}

// Helper function for easier usage in componentes
export function t(key: string): string {
  return i18n.translate(key)
}

