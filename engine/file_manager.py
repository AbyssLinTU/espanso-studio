import os
import shutil
import subprocess
from pathlib import Path
from ruamel.yaml import YAML

class EspansoManager:
    def __init__(self):
        self.appdata = os.getenv("APPDATA")
        if not self.appdata:
            raise EnvironmentError("Переменная окружения APPDATA не найдена.")
        self.espanso_dir = Path(self.appdata) / "espanso" / "match"
        self.base_yml = self.espanso_dir / "base.yml"
        self.backup_yml = self.espanso_dir / "base.yml.bak"
        self.yaml = YAML()
        self.yaml.preserve_quotes = True
        self.yaml.indent(mapping=2, sequence=4, offset=2)
        self._ensure_files()

    def _ensure_files(self):
        self.espanso_dir.mkdir(parents=True, exist_ok=True)
        if not self.base_yml.exists():
            self.base_yml.write_text("matches:\n", encoding="utf-8")

    def get_matches(self):
        try:
            data = self.yaml.load(self.base_yml.read_text(encoding="utf-8"))
            return list(data.get("matches", []) if data else [])
        except Exception:
            return []

    def save_matches(self, matches):
        if self.base_yml.exists() and self.base_yml.stat().st_size > 0:
            shutil.copy2(self.base_yml, self.backup_yml)
        try:
            raw = self.base_yml.read_text(encoding="utf-8") if self.base_yml.stat().st_size > 0 else ""
            data = self.yaml.load(raw) or {}
            data["matches"] = matches
            with open(self.base_yml, "w", encoding="utf-8") as f:
                self.yaml.dump(data, f)
        except Exception as e:
            if self.backup_yml.exists():
                shutil.copy2(self.backup_yml, self.base_yml)
            raise RuntimeError(f"Синтаксическая ошибка YAML! Восстановлен бэкап.\n{e}")

    def apply_and_restart(self):
        flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        subprocess.run("espanso restart", check=True, creationflags=flags, shell=True)
