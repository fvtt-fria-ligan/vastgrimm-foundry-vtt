export const registerSystemSettings = () => {
  /**
   * Track the system version upon which point a migration was last applied.
   */
  game.settings.register("vastgrimm", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });

  /** UI Color scheme */
  game.settings.register("vastgrimm", "colorScheme", {
    name: "SETTINGS.VGColorScheme",
    hint: "SETTINGS.VGColorSchemeHint",
    scope: "client",
    config: true,
    default: "whiteOnBlackPink",
    type: String,
    choices: {
      "foundryDefault": "SETTINGS.VGFoundryDefault",
      "whiteOnBlackBlue": "SETTINGS.VGWhiteOnBlackBlue",
      "whiteOnBlackPink": "SETTINGS.VGWhiteOnBlackPink",
    }
  });  

  /** UI Font scheme */
  game.settings.register("vastgrimm", "fontScheme", {
    name: "SETTINGS.VGFontScheme",
    hint: "SETTINGS.VGFontSchemeHint",
    scope: "client",
    config: true,
    default: "sci-fi",
    type: String,
    choices: {
      "sci-fi": "SETTINGS.VGSciFi",
      "legible": "SETTINGS.VGLegible",
    }
  });  

};
