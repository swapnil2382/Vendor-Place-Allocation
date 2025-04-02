// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          // Navbar
          app_name: "Vendor Marketplace",
          home: "Home",
          location: "Location",
          products: "Products",
          orders: "Orders",
          license: "License",
          place: "Places",
          cart: "Cart",
          logout: "Logout",
          login: "Login",
          language: "Language",
          english: "English",
          hindi: "Hindi",
          tamil: "Tamil",
          ind_govt: "IND GOVT.",

          // Register.jsx
          register_as: "Register as {role}",
          name: "Name",
          email: "Email",
          password: "Password",
          phone: "Phone Number",
          aadhaarID: "Aadhaar ID",
          category: "Business Category",
          location_shop: "Shop Location",
          businessName: "Business Name",
          panNumber: "PAN Number",
          shopPhoto: "Shop Photo URL",
          vendorPhoto: "Vendor Photo URL",
          user: "User",
          vendor: "Vendor",
          registering: "Registering...",
          register: "Register",
          error: "Error: {message}",
        },
      },
      hi: {
        translation: {
          // Navbar
          app_name: "विक्रेता बाजार",
          home: "होम",
          location: "स्थान",
          products: "उत्पाद",
          orders: "आदेश",
          license: "लाइसेंस",
          place: "स्थान",
          cart: "कार्ट",
          logout: "लॉगआउट",
          login: "लॉगिन",
          language: "भाषा",
          english: "अंग्रेजी",
          hindi: "हिन्दी",
          tamil: "तमिल",
          ind_govt: "भारत सरकार",

          // Register.jsx
          register_as: "{role} के रूप में पंजीकरण करें",
          name: "नाम",
          email: "ईमेल",
          password: "पासवर्ड",
          phone: "फोन नंबर",
          aadhaarID: "आधार आईडी",
          category: "व्यवसाय श्रेणी",
          location_shop: "दुकान का स्थान",
          businessName: "व्यवसाय का नाम",
          panNumber: "पैन नंबर",
          shopPhoto: "दुकान फोटो URL",
          vendorPhoto: "विक्रेता फोटो URL",
          user: "उपयोगकर्ता",
          vendor: "विक्रेता",
          registering: "पंजीकरण हो रहा है...",
          register: "पंजीकरण करें",
          error: "त्रुटि: {message}",
        },
      },
      ta: {
        translation: {
          // Navbar
          app_name: "விற்பனையாளர் சந்தை",
          home: "முகப்பு",
          location: "இடம்",
          products: "பொருட்கள்",
          orders: "ஆர்டர்கள்",
          license: "உரிமம்",
          place: "இடங்கள்",
          cart: "வண்டி",
          logout: "வெளியேறு",
          login: "உள்நுழை",
          language: "மொழி",
          english: "ஆங்கிலம்",
          hindi: "ஹிந்தி",
          tamil: "தமிழ்",
          ind_govt: "இந்திய அரசு",

          // Register.jsx
          register_as: "{role} ஆக பதிவு செய்யவும்",
          name: "பெயர்",
          email: "மின்னஞ்சல்",
          password: "கடவுச்சொல்",
          phone: "தொலைபேசி எண்",
          aadhaarID: "ஆதார் ஐடி",
          category: "வணிக வகை",
          location_shop: "கடை இடம்",
          businessName: "வணிக பெயர்",
          panNumber: "பான் எண்",
          shopPhoto: "கடை புகைப்பட URL",
          vendorPhoto: "விற்பனையாளர் புகைப்பட URL",
          user: "பயனர்",
          vendor: "விற்பனையாளர்",
          registering: "பதிவு செய்யப்படுகிறது...",
          register: "பதிவு",
          error: "பிழை: {message}",
        },
      },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
