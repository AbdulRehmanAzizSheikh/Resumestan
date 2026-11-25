// Regional themes for the app. Values are CSS variables applied via
// <html data-theme="...">. Styles are kept tasteful and "inspired by the region"
// rather than literal flag copies.

export const THEMES = [
  { id: "resumestan", name: "Resumestan — Universal", description: "Default clean professional look" },
  { id: "pakistan", name: "Pakistan", description: "Green & white flag inspire — clean, readable" },
  { id: "balochistan", name: "Balochistan", description: "Earthy terracotta & ochre — handcrafted feel" },
  { id: "afghanistan", name: "Afghanistan", description: "Red, green & black — bold and confident" },
  { id: "kazakhstan", name: "Kazakhstan", description: "Blue & gold steppe sky — open and calm" },
  { id: "seraikistan", name: "Seraikistan", description: "Desert sunrise palette — warm and hopeful" },
];

export const DEFAULT_THEME = "resumestan";

export const THEME_STORAGE_KEY = "resumestan-theme";
