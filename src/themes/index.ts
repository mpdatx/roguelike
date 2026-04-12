export { type ThemeDefinition, getTheme, setTheme, registerTheme, getThemeList } from "./theme";
export { dungeonTheme } from "./dungeon";
export { spaceStationTheme } from "./spaceStation";

import { registerTheme, setTheme } from "./theme";
import { dungeonTheme } from "./dungeon";
import { spaceStationTheme } from "./spaceStation";

export function initThemes() {
  registerTheme(dungeonTheme);
  registerTheme(spaceStationTheme);
  setTheme("dungeon");
}
