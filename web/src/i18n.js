// Interface language: string tables + t(). Content translations live in content/i18n/<lang>/*.json (see content.js).
const STRINGS = {
  en: {
    // Dr. Buddy: small talk
    'chat.hello': ['Hello! Click any body part, or ask me about bones, muscles, organs, vessels or nerves.', 'Hi there! What would you like to explore today?'],
    'chat.thanks': ["You're welcome! Ask me anything else.", 'Happy to help! What next?'],
    'chat.who': "I'm Dr. Buddy, your anatomy guide. I can show you any part of this 3D body, explain what it does, and take you on guided tours. I'm for learning only, not medical advice.",
    'chat.howAreYou': "I'm great, thanks for asking! Ready to explore the human body?",
    'chat.bye': 'Bye for now! Come back any time to keep exploring.',
    // Dr. Buddy: view commands
    'cmd.everything': "Here's everything at once. I've made the skin see-through so you can look inside.",
    'cmd.hideAll': "All layers are hidden. Turn one back on from the panel, or ask me to show something!",
    'cmd.reset': 'Back to the starting view.',
    'cmd.zoomIn': 'Zooming in.',
    'cmd.zoomOut': 'Zooming out.',
    'cmd.spinOn': "Spinning the body for you. Say 'stop spinning' to stop.",
    'cmd.spinOff': 'Stopped spinning.',
    'cmd.liveOn': 'Live body animations are on: watch the blood flow, the heart beat and the nerves fire!',
    'cmd.liveOff': 'Live animations are off.',
    'cmd.hidden': "Okay, I've hidden the {layers}.",
    'cmd.shown': 'Here {verb} the {layers}!',
    // Dr. Buddy: scope
    'scope.health': "I'm an anatomy guide, so I can't explain illnesses or give medical advice. If you're worried about your health, please talk to a doctor. Here's the anatomy that's involved:",
    'scope.healthNoEntity': "I'm an anatomy guide, so I can't explain illnesses, symptoms or treatments. If you're worried about your health, please talk to a doctor. I can show you any part of the body, though. Try asking about an organ, bone or muscle!",
    'scope.ligaments': "Ligaments (like the ACL in the knee) aren't included in this 3D model yet, so I can't show them. I can show you the bones and muscles around a joint, though!",
    // Dr. Buddy: explanations
    'explain.intro': 'This is the {name}.',
    'explain.alsoCalled': '{medical}, also called the {common}',
    'explain.where': 'The {name}: {location}',
    'explain.does': 'The {name}. {fn}',
    'explain.didYouKnow': 'Did you know? {fact}',
    'explain.whereIs': 'Where is the {name}?',
    'group.intro': 'The {name}!',
    'group.parts': 'The parts in this model are: {parts}.',
    'group.partsShown': 'Parts shown: {parts}.',
    // interface
    'ui.search': 'Search body part… femur, heart, biceps', 'ui.medical': 'MEDICAL', 'ui.medicalHi': 'MEDICAL (HI)', 'ui.common': 'COMMON',
    'ui.askPh': 'Ask me anything about the body…', 'ui.micTip': 'Speak your question', 'ui.ask': 'ASK',
    'ui.voiceOn': '🔊 Voice on', 'ui.voiceOff': '🔈 Voice off', 'ui.clickBuddy': 'Click me to ask a question!',
    'ui.footer': 'Educational use only. Not medical advice.', 'ui.about': 'About & sources', 'ui.close': 'CLOSE',
    'ui.opacity': 'Opacity', 'ui.opacityOf': '{layer} opacity',
    'panel.layers': 'BODY LAYERS', 'panel.quick': 'QUICK VIEWS', 'panel.tours': 'GUIDED TOURS',
    'state.on': 'ON', 'state.off': 'OFF', 'state.loading': 'LOADING', 'state.retry': 'RETRY', 'state.streaming': 'STREAMING',
    'preset.bones': 'Bones only', 'preset.veins': 'Veins only', 'preset.veinsBones': 'Veins + bones', 'preset.vessels': 'Blood vessels',
    'preset.vesselsBones': 'Vessels + bones', 'preset.organs': 'Organs', 'preset.organsBones': 'Organs + bones', 'preset.muscles': 'Muscles only',
    'preset.musclesBones': 'Muscles + bones', 'preset.nervesBones': 'Nerves + bones', 'preset.full': 'Full body', 'preset.xray': 'X-ray skin',
    'dock.render': 'RENDER', 'dock.quality': 'QUALITY', 'dock.real': 'REAL', 'dock.holo': 'HOLO', 'dock.xray': 'X-RAY',
    'dock.ultra': 'ULTRA', 'dock.high': 'HIGH', 'dock.fast': 'FAST', 'dock.labels': 'LABELS', 'dock.live': 'LIVE', 'dock.scan': 'SCAN',
    'dock.spin': 'SPIN', 'dock.reset': 'RESET', 'dock.sfx': 'SFX', 'dock.labelsTip': 'Show labels',
    'dock.liveTip': 'Live body: blood flow, heartbeat, breathing, nerve signals', 'dock.scanTip': 'Body scanner',
    'dock.spinTip': 'Auto-rotate', 'dock.resetTip': 'Reset view', 'dock.sfxTip': 'Sound effects',
    'info.target': '◉ TARGET ACQUIRED', 'info.explain': '🩺 DOCTOR, EXPLAIN!', 'info.isolate': 'ISOLATE', 'info.showAll': 'SHOW ALL',
    'info.function': 'FUNCTION', 'info.location': 'LOCATION', 'info.facts': 'DID YOU KNOW?', 'info.sources': 'SOURCES',
    'info.commonName': 'Common name', 'info.medicalName': 'Medical name',
    'info.minor': "This is one of the smaller structures in the {layer} layer, so it doesn't have a detailed card yet. You can ask Dr. Buddy about it, or click one of the main labelled parts.",
    'info.minorSay': "That's the {name}. It's one of the smaller structures in the {layer} layer. Click one of the main labelled parts and I can tell you a lot more!",
    'about.title': 'ABOUT THIS ATLAS',
    'about.p1': "An interactive 3D atlas of the adult male human body with {n} researched and described structures across 7 layers. Research agents wrote every description from trusted medical sources. Reviewer agents then checked each section for accuracy, and their corrections were applied before publishing. The Hindi version was translated and reviewed the same way. Sources are listed on each structure's card.",
    'about.modelsTitle': '3D models:',
    'about.models': 'Z-Anatomy, the libre 3D atlas of anatomy (CC BY-SA 4.0), derived from BodyParts3D © The Database Center for Life Science (CC BY-SA 2.1 Japan). Parts adapted by Z-Anatomy include "Kidney" by Lissie Cowley (CC BY-NC 4.0) and "Anatomy of the Inner Ear" by University of Dundee (CC BY-NC-SA 4.0), which don\'t allow commercial use. The models were simplified for the web, and these derived models are shared under the same licence.',
    'about.disclaimerTitle': 'Disclaimer:', 'about.disclaimer': 'For education only. This is not medical advice. Always consult a qualified health professional.',
    'landing.head': 'See inside the<br><em>human body.</em>',
    'landing.lead': 'An interactive 3D atlas you can peel layer by layer, with a friendly guide who explains every part.',
    'landing.f1': 'Live heartbeat, blood flow & nerve signals', 'landing.f2': 'Guided tours narrated by Dr. Buddy',
    'landing.f3': 'Ask questions by typing or speaking', 'landing.f4': 'In English and हिंदी',
    'landing.sParts': '3D parts', 'landing.sEntries': 'researched structures', 'landing.sLayers': 'body layers', 'landing.sTours': 'guided tours',
    'landing.tour': '🧭 Take a tour', 'landing.note': 'For learning only, not medical advice.', 'landing.init': 'INITIALIZING…',
    'layer.skin': 'Skin','layer.muscles': 'Muscles', 'layer.organs': 'Organs', 'layer.arteries': 'Arteries',
    'layer.veins': 'Veins', 'layer.nerves': 'Nerves', 'layer.skeleton': 'Bones',
    'landing.scanning': 'SCANNING', 'landing.showing': 'NOW SHOWING',
    'landing.start': '▶ START EXPLORING',
    'landing.logKb': 'Knowledge base: {n} researched structures',
    'landing.logLoaded': 'Loaded {layer} · {n} parts',
    'landing.logFailed': 'Could not load {layer} ({err}). Turn the layer on later to retry.',
    'tour.menu':'I can take you on a guided tour! Pick one: {list}.',
    'tour.step': 'Stop {i} of {n}',
    'tour.pause': 'Pause',
    'tour.resume': 'Resume',
    'dontKnow':"Hmm, I'm not sure about that one. Try clicking a body part, or ask me about a bone, muscle or organ!",
    'emptyAsk': 'Ask me about any body part!',
    'suggest': ['How many bones are in the body?', 'What does the liver do?', 'Where is the femur?', 'What is the biggest organ?',
      'Show me the veins', 'What do arteries do?', 'Tell me about the heart', 'What is the strongest muscle?', 'Take me on a tour'],
  },
}

STRINGS.hi = {
  'chat.hello': ['नमस्ते! किसी भी अंग पर क्लिक करो, या मुझसे हड्डियों, मांसपेशियों, अंगों, नसों या तंत्रिकाओं के बारे में पूछो।', 'नमस्ते! आज क्या देखना चाहोगे?'],
  'chat.thanks': ['कोई बात नहीं! और कुछ पूछना हो तो पूछो।', 'मदद करके अच्छा लगा! आगे क्या?'],
  'chat.who': 'मैं डॉ. बडी हूँ, तुम्हारा शरीर-रचना गाइड। मैं इस 3D शरीर का कोई भी हिस्सा दिखा सकता हूँ, बता सकता हूँ कि वह क्या करता है, और तुम्हें गाइडेड टूर पर ले जा सकता हूँ। मैं सिर्फ़ सीखने के लिए हूँ, चिकित्सीय सलाह के लिए नहीं।',
  'chat.howAreYou': 'मैं बढ़िया हूँ, पूछने के लिए धन्यवाद! चलो मानव शरीर की सैर करें?',
  'chat.bye': 'फिर मिलेंगे! जब चाहो वापस आकर और सीखो।',
  'cmd.everything': 'ये रहा सब कुछ एक साथ। मैंने त्वचा को पारदर्शी कर दिया है ताकि तुम अंदर देख सको।',
  'cmd.hideAll': 'सारी परतें छिप गई हैं। पैनल से कोई परत चालू करो, या मुझसे कुछ दिखाने को कहो!',
  'cmd.reset': 'शुरुआती दृश्य पर वापस।', 'cmd.zoomIn': 'पास ले जा रहा हूँ।', 'cmd.zoomOut': 'दूर ले जा रहा हूँ।',
  'cmd.spinOn': "शरीर को घुमा रहा हूँ। रोकने के लिए 'घुमाना बंद' कहो।", 'cmd.spinOff': 'घुमाना बंद कर दिया।',
  'cmd.liveOn': 'जीवित शरीर एनिमेशन चालू: देखो रक्त बह रहा है, दिल धड़क रहा है और तंत्रिकाएँ संकेत भेज रही हैं!',
  'cmd.liveOff': 'एनिमेशन बंद हैं।',
  'cmd.hidden': 'ठीक है, मैंने {layers} छिपा दी हैं।', 'cmd.shown': 'ये रहीं {layers}!',
  'scope.health': 'मैं शरीर-रचना का गाइड हूँ, इसलिए बीमारियों के बारे में नहीं बता सकता और न ही चिकित्सीय सलाह दे सकता हूँ। अगर सेहत को लेकर चिंता है, तो कृपया डॉक्टर से बात करो। इससे जुड़ी शरीर-रचना यह है:',
  'scope.healthNoEntity': 'मैं शरीर-रचना का गाइड हूँ, इसलिए बीमारियों, लक्षणों या इलाज के बारे में नहीं बता सकता। अगर सेहत को लेकर चिंता है, तो कृपया डॉक्टर से बात करो। हाँ, मैं शरीर का कोई भी हिस्सा दिखा सकता हूँ। किसी अंग, हड्डी या मांसपेशी के बारे में पूछो!',
  'scope.ligaments': 'स्नायुबंधन (लिगामेंट, जैसे घुटने का ACL) अभी इस 3D मॉडल में नहीं हैं, इसलिए मैं उन्हें नहीं दिखा सकता। पर जोड़ के आस-पास की हड्डियाँ और मांसपेशियाँ ज़रूर दिखा सकता हूँ!',
  'explain.intro': 'यह है {name}।', 'explain.alsoCalled': '{medical}, जिसे {common} भी कहते हैं', 'explain.where': '{name}: {location}',
  'explain.does': '{name}। {fn}', 'explain.didYouKnow': 'क्या तुम जानते हो? {fact}', 'explain.whereIs': '{name} कहाँ है?',
  'group.intro': '{name}!', 'group.parts': 'इस मॉडल में इसके हिस्से हैं: {parts}।', 'group.partsShown': 'दिखाए गए हिस्से: {parts}।',
  'dontKnow': 'हम्म, इसके बारे में मुझे पक्का नहीं पता। किसी अंग पर क्लिक करो, या किसी हड्डी, मांसपेशी या अंग के बारे में पूछो!',
  'emptyAsk': 'शरीर के किसी भी हिस्से के बारे में पूछो!',
  'suggest': ['शरीर में कितनी हड्डियाँ होती हैं?', 'यकृत क्या करता है?', 'फीमर कहाँ है?', 'सबसे बड़ा अंग कौन सा है?', 'शिराएँ दिखाओ',
    'दिल के बारे में बताओ', 'मुझे टूर पर ले चलो'],
  'tour.menu': 'मैं तुम्हें गाइडेड टूर पर ले जा सकता हूँ! कोई एक चुनो: {list}।', 'tour.step': 'पड़ाव {i} / {n}', 'tour.pause': 'रोकें', 'tour.resume': 'जारी रखें',
  'layer.skin': 'त्वचा', 'layer.muscles': 'मांसपेशियाँ', 'layer.organs': 'अंग', 'layer.arteries': 'धमनियाँ', 'layer.veins': 'शिराएँ',
  'layer.nerves': 'तंत्रिकाएँ', 'layer.skeleton': 'हड्डियाँ',
  'ui.search': 'शरीर का हिस्सा खोजें… फीमर, दिल, बाइसेप्स', 'ui.medical': 'चिकित्सीय (EN)', 'ui.medicalHi': 'चिकित्सीय (हिंदी)', 'ui.common': 'आम नाम',
  'ui.askPh': 'शरीर के बारे में कुछ भी पूछो…', 'ui.micTip': 'बोलकर पूछो', 'ui.ask': 'पूछें',
  'ui.voiceOn': '🔊 आवाज़ चालू', 'ui.voiceOff': '🔈 आवाज़ बंद', 'ui.clickBuddy': 'सवाल पूछने के लिए मुझ पर क्लिक करो!',
  'ui.footer': 'केवल शिक्षा के लिए। चिकित्सीय सलाह नहीं।', 'ui.about': 'परिचय और स्रोत', 'ui.close': 'बंद करें',
  'ui.opacity': 'पारदर्शिता', 'ui.opacityOf': '{layer} की पारदर्शिता',
  'panel.layers': 'शरीर की परतें', 'panel.quick': 'झटपट दृश्य', 'panel.tours': 'गाइडेड टूर',
  'state.on': 'चालू', 'state.off': 'बंद', 'state.loading': 'लोड हो रहा है', 'state.retry': 'फिर कोशिश करें', 'state.streaming': 'लोड हो रहा है:',
  'preset.bones': 'सिर्फ़ हड्डियाँ', 'preset.veins': 'सिर्फ़ शिराएँ', 'preset.veinsBones': 'शिराएँ + हड्डियाँ', 'preset.vessels': 'रक्त वाहिकाएँ',
  'preset.vesselsBones': 'वाहिकाएँ + हड्डियाँ', 'preset.organs': 'अंग', 'preset.organsBones': 'अंग + हड्डियाँ', 'preset.muscles': 'सिर्फ़ मांसपेशियाँ',
  'preset.musclesBones': 'मांसपेशियाँ + हड्डियाँ', 'preset.nervesBones': 'तंत्रिकाएँ + हड्डियाँ', 'preset.full': 'पूरा शरीर', 'preset.xray': 'एक्स-रे त्वचा',
  'dock.render': 'दृश्य', 'dock.quality': 'गुणवत्ता', 'dock.real': 'असली', 'dock.holo': 'होलो', 'dock.xray': 'एक्स-रे',
  'dock.ultra': 'अल्ट्रा', 'dock.high': 'हाई', 'dock.fast': 'तेज़', 'dock.labels': 'नाम', 'dock.live': 'लाइव', 'dock.scan': 'स्कैन',
  'dock.spin': 'घुमाएँ', 'dock.reset': 'रीसेट', 'dock.sfx': 'ध्वनि', 'dock.labelsTip': 'नाम दिखाएँ',
  'dock.liveTip': 'जीवित शरीर: रक्त प्रवाह, धड़कन, साँस, तंत्रिका संकेत', 'dock.scanTip': 'बॉडी स्कैनर',
  'dock.spinTip': 'अपने-आप घुमाएँ', 'dock.resetTip': 'दृश्य रीसेट करें', 'dock.sfxTip': 'ध्वनि प्रभाव',
  'info.target': '◉ लक्ष्य मिला', 'info.explain': '🩺 डॉक्टर, समझाइए!', 'info.isolate': 'अलग करें', 'info.showAll': 'सब दिखाएँ',
  'info.function': 'काम', 'info.location': 'स्थान', 'info.facts': 'क्या तुम जानते हो?', 'info.sources': 'स्रोत (अंग्रेज़ी)',
  'info.commonName': 'आम नाम', 'info.medicalName': 'चिकित्सीय नाम',
  'info.minor': 'यह {layer} परत की छोटी संरचनाओं में से एक है, इसलिए इसका विस्तृत कार्ड अभी नहीं है। तुम डॉ. बडी से इसके बारे में पूछ सकते हो, या किसी मुख्य हिस्से पर क्लिक करो।',
  'info.minorSay': 'यह है {name}। यह {layer} परत की छोटी संरचनाओं में से एक है। किसी मुख्य हिस्से पर क्लिक करो, तो मैं और बहुत कुछ बता सकता हूँ!',
  'about.title': 'इस एटलस के बारे में',
  'about.p1': 'वयस्क पुरुष शरीर का एक इंटरैक्टिव 3D एटलस, जिसमें 7 परतों में {n} शोध की गई और समझाई गई संरचनाएँ हैं। हर विवरण रिसर्च एजेंटों ने भरोसेमंद चिकित्सा स्रोतों से लिखा। फिर समीक्षक एजेंटों ने हर हिस्से की सटीकता जाँची और उनके सुधार प्रकाशन से पहले लागू किए गए। हिंदी संस्करण का अनुवाद और समीक्षा भी इसी तरह की गई। हर संरचना के कार्ड पर उसके स्रोत दिए गए हैं।',
  'about.modelsTitle': '3D मॉडल:',
  'about.models': 'Z-Anatomy, शरीर-रचना का मुक्त 3D एटलस (CC BY-SA 4.0), जो BodyParts3D © The Database Center for Life Science (CC BY-SA 2.1 Japan) से बना है। Z-Anatomy द्वारा अपनाए गए हिस्सों में Lissie Cowley का "Kidney" (CC BY-NC 4.0) और University of Dundee का "Anatomy of the Inner Ear" (CC BY-NC-SA 4.0) शामिल हैं, जिनका व्यावसायिक उपयोग मना है। मॉडलों को वेब के लिए सरल बनाया गया है, और ये संशोधित मॉडल उसी लाइसेंस के तहत साझा किए गए हैं।',
  'about.disclaimerTitle': 'अस्वीकरण:', 'about.disclaimer': 'केवल शिक्षा के लिए। यह चिकित्सीय सलाह नहीं है। हमेशा किसी योग्य स्वास्थ्य विशेषज्ञ से सलाह लें।',
  'landing.head': 'देखो मानव शरीर<br><em>के अंदर।</em>',
  'landing.lead': 'एक इंटरैक्टिव 3D एटलस जिसे तुम परत दर परत खोल सकते हो, और एक दोस्ताना गाइड जो हर हिस्सा समझाता है।',
  'landing.f1': 'धड़कता दिल, बहता रक्त और तंत्रिका संकेत', 'landing.f2': 'डॉ. बडी के साथ गाइडेड टूर',
  'landing.f3': 'लिखकर या बोलकर सवाल पूछो', 'landing.f4': 'English और हिंदी में',
  'landing.sParts': '3D हिस्से', 'landing.sEntries': 'शोध की गई संरचनाएँ', 'landing.sLayers': 'शरीर की परतें', 'landing.sTours': 'गाइडेड टूर',
  'landing.tour': '🧭 टूर पर चलें', 'landing.note': 'केवल सीखने के लिए, चिकित्सीय सलाह नहीं।', 'landing.init': 'तैयार हो रहा है…',
  'landing.scanning': 'स्कैनिंग', 'landing.showing': 'अभी दिख रहा है', 'landing.start': '▶ खोज शुरू करें',
  'landing.logKb': 'ज्ञान भंडार: {n} शोध की गई संरचनाएँ', 'landing.logLoaded': '{layer} लोड हुईं · {n} हिस्से',
  'landing.logFailed': '{layer} लोड नहीं हो सकीं ({err})। बाद में परत चालू करके फिर कोशिश करें।',
}

let lang = 'en'
const listeners = new Set()

export function getLang() { return lang }
export function onLangChange(fn) { listeners.add(fn) }
export function addStrings(code, table) { STRINGS[code] = { ...(STRINGS[code] || {}), ...table } }
export async function setLang(code) {
  lang = STRINGS[code] ? code : 'en'
  for (const fn of listeners) await fn(lang)
}

/** Translate a key. Arrays return a random item. {vars} are substituted. Falls back to English, then the key. */
export function t(key, vars) {
  let s = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key
  if (Array.isArray(s)) s = s[Math.floor(Math.random() * s.length)]
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m))
  return s
}
/** The full list for a key (used for suggestion pools). */
export function tList(key) {
  const s = STRINGS[lang]?.[key] ?? STRINGS.en[key]
  return Array.isArray(s) ? s : s ? [s] : []
}
