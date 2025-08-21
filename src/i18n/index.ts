import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

const resources = {
  en: { common: { title:"VOMS", signInDev:"Sign in (Dev)", patLabel:"Personal Access Token", continue:"Continue", logout:"Logout", tokenTail:"Token tail" } },
  hi: { common: { title:"VOMS", signInDev:"साइन इन (डेव)", patLabel:"पर्सनल एक्सेस टोकन", continue:"जारी रखें", logout:"लॉगआउट", tokenTail:"टोकन टेल" } },
  "hi-Latn": { common: { title:"VOMS", signInDev:"Sign in (Dev)", patLabel:"Personal Access Token", continue:"Jaari rakhen", logout:"Logout", tokenTail:"Token tail" } },
  or: { common: { title:"VOMS", signInDev:"ସାଇନ୍ ଇନ୍ (ଡେଭ୍)", patLabel:"ପର୍ସନାଲ୍ ଆକ୍ସେସ୍ ଟୋକେନ୍", continue:"ଜାରି ରଖନ୍ତୁ", logout:"ଲଗଆଉଟ୍", tokenTail:"ଟୋକେନ୍ ଟେଲ୍" } },
  "or-Latn": { common: { title:"VOMS", signInDev:"Sign in (Dev)", patLabel:"Personal Access Token", continue:"Jaari rakhantu", logout:"Logout", tokenTail:"Token tail" } },
}

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources, fallbackLng: "en", ns:["common"], defaultNS:"common",
  interpolation: { escapeValue:false },
  detection: { order:["querystring","localStorage","navigator"], lookupQuerystring:"lng", lookupLocalStorage:"voms_lng" }
})

export default i18n
