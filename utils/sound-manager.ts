class SoundManager {
  private sounds: Record<string, HTMLAudioElement | null> = {}
  private muted = false
  private soundsEnabled = false

  constructor() {
    // Solo inicializar en el navegador
    if (typeof window !== "undefined") {
      this.loadSoundsIfAvailable()
      // Intentar cargar la preferencia de sonido desde localStorage
      const savedMuted = localStorage.getItem("soundMuted")
      if (savedMuted !== null) {
        this.muted = savedMuted === "true"
      }
    }
  }

  private loadSoundsIfAvailable() {
    // Definir los sonidos que queremos cargar
    const soundNames = ["bet", "card", "win", "lose", "shuffle", "doubleDown"]

    // Inicializar todos los sonidos como null primero
    soundNames.forEach((name) => {
      this.sounds[name] = null
    })

    // Solo intentar cargar sonidos si estamos en un entorno con soporte de Audio
    if (typeof Audio !== "undefined") {
      // Verificar si el navegador soporta la API de Audio
      try {
        const testAudio = new Audio()
        if (testAudio) {
          this.soundsEnabled = true
          this.preloadSounds()
        }
      } catch (e) {
        console.warn("Audio not supported in this environment")
        this.soundsEnabled = false
      }
    } else {
      this.soundsEnabled = false
    }
  }

  private preloadSounds() {
    if (!this.soundsEnabled) return

    // Crear objetos de audio con manejo de errores
    try {
      // Intentar cargar los sonidos con diferentes formatos
      const formats = [".mp3", ".wav", ".ogg"]
      const soundNames = ["bet", "card", "win", "lose", "shuffle", "doubleDown"]

      soundNames.forEach((name) => {
        // Intentar cada formato
        let loaded = false

        for (const format of formats) {
          if (loaded) continue

          const audio = new Audio()

          // Manejar el evento de error
          audio.onerror = () => {
            console.warn(`Could not load sound: ${name}${format}`)
            // Si este formato falla, el bucle intentará el siguiente
          }

          // Manejar el evento de carga exitosa
          audio.oncanplaythrough = () => {
            // Guardar el audio que se cargó correctamente
            this.sounds[name] = audio
            loaded = true
          }

          // Intentar cargar el archivo
          audio.src = `/sounds/${name}${format}`
          audio.load()
        }

        // Si ningún formato se cargó, usar un audio vacío como fallback
        if (!loaded) {
          this.sounds[name] = new Audio()
          console.warn(`Using empty audio for ${name} as fallback`)
        }
      })
    } catch (e) {
      console.error("Error preloading sounds:", e)
      this.soundsEnabled = false
    }
  }

  play(soundName: string) {
    // No reproducir si está silenciado o si los sonidos no están habilitados
    if (this.muted || !this.soundsEnabled) return

    const sound = this.sounds[soundName]

    // Verificar si el sonido existe y está listo para reproducirse
    if (sound && sound.readyState >= 2) {
      try {
        // Clonar el audio para permitir sonidos superpuestos
        const clone = sound.cloneNode() as HTMLAudioElement
        clone.volume = 0.5

        // Reproducir con manejo de errores
        const playPromise = clone.play()

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // Manejar el error de reproducción silenciosamente
            console.warn(`Error playing sound ${soundName}:`, error.message)
          })
        }
      } catch (err) {
        // Capturar cualquier otro error
        console.warn(`Error playing sound ${soundName}:`, err)
      }
    } else {
      // Usar un sonido de sistema como fallback si está disponible
      try {
        // Intentar reproducir un beep simple usando la API de AudioContext
        this.playBeep(soundName)
      } catch (e) {
        // Silenciar cualquier error del beep
      }
    }
  }

  // Método de fallback para reproducir un beep simple
  private playBeep(type: string) {
    try {
      if (typeof window === "undefined") return

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return

      const audioCtx = new AudioContext()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      // Configurar diferentes sonidos según el tipo
      switch (type) {
        case "win":
          oscillator.frequency.value = 880 // A5
          gainNode.gain.value = 0.3
          oscillator.connect(gainNode).connect(audioCtx.destination)
          oscillator.start()
          setTimeout(() => oscillator.stop(), 200)
          break
        case "lose":
          oscillator.frequency.value = 220 // A3
          gainNode.gain.value = 0.3
          oscillator.connect(gainNode).connect(audioCtx.destination)
          oscillator.start()
          setTimeout(() => oscillator.stop(), 300)
          break
        case "bet":
        case "doubleDown":
          oscillator.frequency.value = 440 // A4
          gainNode.gain.value = 0.2
          oscillator.connect(gainNode).connect(audioCtx.destination)
          oscillator.start()
          setTimeout(() => oscillator.stop(), 100)
          break
        case "card":
        case "shuffle":
        default:
          oscillator.frequency.value = 660 // E5
          gainNode.gain.value = 0.1
          oscillator.connect(gainNode).connect(audioCtx.destination)
          oscillator.start()
          setTimeout(() => oscillator.stop(), 50)
          break
      }
    } catch (e) {
      // Silenciar errores del AudioContext
    }
  }

  toggleMute() {
    this.muted = !this.muted
    // Guardar preferencia en localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("soundMuted", this.muted.toString())
    }
    return this.muted
  }

  isMuted() {
    return this.muted
  }

  // Método para verificar si los sonidos están habilitados en general
  areSoundsEnabled() {
    return this.soundsEnabled
  }
}

// Singleton instance
export const soundManager = new SoundManager()

