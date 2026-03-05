import customtkinter as ctk

class Theme:
    BG_ROOT = "#0B0B0D"
    BG_SIDEBAR = "#151517"
    BG_MAIN = "#0B0B0D"
    BG_BORDER = "#333338"
    BG_CARD = "#212124"
    BG_CARD_HOVER = "#2A2A2E"
    ACCENT = "#5865F2"
    ACCENT_HOVER = "#4752C4"
    TEXT_MAIN = "#E1E1E6"
    TEXT_MUTED = "#9CA3AF"
    RADIUS_LARGE = 12
    RADIUS_SMALL = 8
    FONT_FAMILY = "Segoe UI"

    @classmethod
    def font(cls, size=13, weight="normal"):
        return ctk.CTkFont(family=cls.FONT_FAMILY, size=size, weight=weight)
