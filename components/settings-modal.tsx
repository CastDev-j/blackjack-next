"use client"

import { useState, useEffect } from "react"
import { i18n, t } from "@/utils/i18n"
import { soundManager } from "@/utils/sound-manager"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Settings } from "lucide-react"

export function SettingsModal() {
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState(i18n.getLanguage())
  const [soundEnabled, setSoundEnabled] = useState(!soundManager.isMuted())
  const [soundsAvailable, setSoundsAvailable] = useState(false)

  // Verificar si los sonidos están disponibles al cargar el componente
  useEffect(() => {
    setSoundsAvailable(soundManager.areSoundsEnabled())
  }, [])

  const handleSave = () => {
    i18n.setLanguage(language)

    // Solo cambiar el estado de sonido si está disponible
    if (soundsAvailable && soundManager.isMuted() === soundEnabled) {
      soundManager.toggleMute()
    }

    setOpen(false)
    // Forzar actualización de la UI
    window.dispatchEvent(new Event("languageChanged"))
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="absolute top-4 right-4">
        <Settings className="h-5 w-5" />
        <span className="sr-only">{t("settings")}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("settings")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="language" className="col-span-2">
                {t("language")}
              </Label>
              <RadioGroup
                id="language"
                value={language}
                onValueChange={(val) => setLanguage(val as "es" | "en")}
                className="col-span-2 flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="es" id="es" />
                  <Label htmlFor="es">{t("spanish")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="en" />
                  <Label htmlFor="en">{t("english")}</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sound" className="col-span-2">
                {t("sound")}
              </Label>
              <Switch id="sound" checked={soundEnabled} onCheckedChange={setSoundEnabled} disabled={!soundsAvailable} />
              <span>
                {soundEnabled ? t("on") : t("off")}
                {!soundsAvailable && <span className="text-xs text-red-500 block">{t("sound-unavailable")}</span>}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

