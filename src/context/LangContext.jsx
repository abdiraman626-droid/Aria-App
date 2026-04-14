import { createContext, useContext, useState, useEffect } from 'react';

const T = {
  en: {
    // Greetings
    greeting_morning: 'Good morning', greeting_afternoon: 'Good afternoon', greeting_evening: 'Good evening',
    // Navigation
    home: 'Home', calendar: 'Calendar', reminders: 'Reminders', voice: 'Voice', settings: 'Settings',
    team: 'Team', meetings: 'Meetings',
    // Dashboard
    upcoming_events: 'Upcoming Events', view_all: 'View all', no_upcoming: 'No upcoming events',
    add_event: 'Add Event', free_trial_banner: 'Free trial', days_remaining: 'days remaining',
    play_briefing: 'Play Briefing', stop: 'Stop',
    // Reminders
    add_reminder: 'Add Reminder', today: 'Today', upcoming: 'Upcoming', completed: 'Completed', all: 'All',
    no_reminders: "You're all clear!", search_reminders: 'Search reminders...',
    title: 'Title', description: 'Description', date_time: 'Date & Time', notify_via: 'Notify via',
    priority: 'Priority', high: 'High', medium: 'Medium', low: 'Low', save: 'Save', cancel: 'Cancel', delete: 'Delete',
    // Calendar
    new_event: 'New Event', edit_event: 'Edit Event', no_events_day: 'No events on this day',
    meeting: 'Meeting', task: 'Task', appointment: 'Appointment', notes: 'Notes', date: 'Date', time: 'Time',
    google_sync_upgrade: 'Google Calendar sync available on Corporate Mini and above',
    connect_google_cal: 'Connect Google in Settings to sync your calendar',
    // Voice
    tap_to_speak: 'Tap to speak', listening: 'Listening...', thinking: 'Thinking...', speaking: 'Speaking...',
    ask_aria: 'Ask ARIA anything...', voice_briefing: 'Voice Briefing',
    // Settings
    profile: 'Profile', full_name: 'Full Name', whatsapp_number: 'WhatsApp Number', language: 'Language',
    interface_language: 'Interface & Voice Language', save_profile: 'Save Profile', sign_out: 'Sign Out',
    connect_google: 'Connect Google', disconnect: 'Disconnect', connected_as: 'Connected as',
    google_session_expired: 'Google session expired', reconnect: 'Reconnect Google',
    // Gmail
    gmail: 'Gmail', no_emails: 'Inbox is empty — you\'re all caught up!', summarizing: 'Summarizing...',
    failed_load_emails: 'Failed to load emails. Try refreshing.',
    // Meetings
    record_meeting: 'Record Meeting', transcribe_summarize: 'Transcribe & Summarize',
    uploading: 'Uploading audio...', transcribing: 'Transcribing...', summarizing_meeting: 'Summarizing with Claude...',
    summary: 'Summary', action_items: 'Action Items', follow_ups: 'Follow-ups',
    // Common
    upgrade: 'Upgrade', loading: 'Loading...', error: 'Error', retry: 'Retry',
    free_trial: '7-Day Free Trial', no_card: 'No credit card required',
    go_to_settings: 'Go to Settings',
  },
  sw: {
    greeting_morning: 'Habari za asubuhi', greeting_afternoon: 'Habari za mchana', greeting_evening: 'Habari za jioni',
    home: 'Nyumbani', calendar: 'Kalenda', reminders: 'Vikumbusho', voice: 'Sauti', settings: 'Mipangilio',
    team: 'Timu', meetings: 'Mikutano',
    upcoming_events: 'Matukio Yanayokuja', view_all: 'Tazama yote', no_upcoming: 'Hakuna matukio yanayokuja',
    add_event: 'Ongeza Tukio', free_trial_banner: 'Majaribio', days_remaining: 'siku zilizobaki',
    play_briefing: 'Cheza Taarifa', stop: 'Simama',
    add_reminder: 'Ongeza Ukumbusho', today: 'Leo', upcoming: 'Yanayokuja', completed: 'Yamekamilika', all: 'Yote',
    no_reminders: 'Umekwisha!', search_reminders: 'Tafuta vikumbusho...',
    title: 'Kichwa', description: 'Maelezo', date_time: 'Tarehe na Wakati', notify_via: 'Arifu kupitia',
    priority: 'Kipaumbele', high: 'Juu', medium: 'Wastani', low: 'Chini', save: 'Hifadhi', cancel: 'Ghairi', delete: 'Futa',
    new_event: 'Tukio Jipya', edit_event: 'Hariri Tukio', no_events_day: 'Hakuna matukio siku hii',
    meeting: 'Mkutano', task: 'Kazi', appointment: 'Miadi', notes: 'Maelezo', date: 'Tarehe', time: 'Wakati',
    google_sync_upgrade: 'Kalenda ya Google inapatikana kwa Corporate Mini na zaidi',
    connect_google_cal: 'Unganisha Google kwenye Mipangilio kusawazisha kalenda yako',
    tap_to_speak: 'Gusa kusema', listening: 'Nasikiliza...', thinking: 'Nafikiri...', speaking: 'Nasema...',
    ask_aria: 'Uliza ARIA chochote...', voice_briefing: 'Taarifa ya Sauti',
    profile: 'Wasifu', full_name: 'Jina Kamili', whatsapp_number: 'Nambari ya WhatsApp', language: 'Lugha',
    interface_language: 'Lugha ya Mfumo na Sauti', save_profile: 'Hifadhi Wasifu', sign_out: 'Toka',
    connect_google: 'Unganisha Google', disconnect: 'Tenganisha', connected_as: 'Imeunganishwa kama',
    google_session_expired: 'Kipindi cha Google kimekwisha', reconnect: 'Unganisha tena Google',
    gmail: 'Gmail', no_emails: 'Sanduku tupu — umeshakamilisha!', summarizing: 'Inafanya muhtasari...',
    failed_load_emails: 'Imeshindwa kupakia barua pepe. Jaribu tena.',
    record_meeting: 'Rekodi Mkutano', transcribe_summarize: 'Andika na Fanya Muhtasari',
    uploading: 'Inapakia sauti...', transcribing: 'Inabadilisha kuwa maandishi...', summarizing_meeting: 'Inafanya muhtasari...',
    summary: 'Muhtasari', action_items: 'Hatua za Kuchukua', follow_ups: 'Ufuatiliaji',
    upgrade: 'Pandisha', loading: 'Inapakia...', error: 'Hitilafu', retry: 'Jaribu tena',
    free_trial: 'Majaribio ya Siku 7', no_card: 'Bila kadi ya mkopo',
    go_to_settings: 'Nenda Mipangilio',
  },
  so: {
    greeting_morning: 'Subax wanaagsan', greeting_afternoon: 'Galab wanaagsan', greeting_evening: 'Fiid wanaagsan',
    home: 'Guriga', calendar: 'Kalandar', reminders: 'Xusuusinno', voice: 'Cod', settings: 'Dejinta',
    team: 'Kooxda', meetings: 'Kulamo',
    upcoming_events: 'Dhacdooyinka Soo Socda', view_all: 'Arag dhammaan', no_upcoming: 'Dhacdooyin soo socda ma jiraan',
    add_event: 'Kudar Dhacdo', free_trial_banner: 'Tijaabo bilaash ah', days_remaining: 'maalmood oo haray',
    play_briefing: 'Ciyaar Warbixin', stop: 'Jooji',
    add_reminder: 'Kudar Xusuusin', today: 'Maanta', upcoming: 'Soo Socda', completed: 'La Dhammeeyay', all: 'Dhammaan',
    no_reminders: 'Wax walba waa dhammaatay!', search_reminders: 'Raadi xusuusinno...',
    title: 'Cinwaan', description: 'Sharaxaad', date_time: 'Taariikhda & Waqtiga', notify_via: 'Ugu ogeysii',
    priority: 'Mudnaanta', high: 'Sare', medium: 'Dhexe', low: 'Hoose', save: 'Keydi', cancel: 'Jooji', delete: 'Tirtir',
    new_event: 'Dhacdo Cusub', edit_event: 'Wax ka Beddel', no_events_day: 'Dhacdooyin maalintaan ma jiraan',
    meeting: 'Kulan', task: 'Hawl', appointment: 'Ballan', notes: 'Qoraallo', date: 'Taariikh', time: 'Waqti',
    google_sync_upgrade: 'Isku xidhka Google Calendar wuxuu u diyaar yahay Corporate Mini iyo ka sare',
    connect_google_cal: 'Ku xidh Google Dejinta si aad u isku xidhdo kalandarka',
    tap_to_speak: 'Taabo si aad u hadasho', listening: 'Dhagaysanayaa...', thinking: 'Fikirayaa...', speaking: 'Hadlayaa...',
    ask_aria: 'ARIA wax weydii...', voice_briefing: 'Warbixin Cod ah',
    profile: 'Xogta Shaqsiga', full_name: 'Magaca Buuxa', whatsapp_number: 'Lambarka WhatsApp', language: 'Luqadda',
    interface_language: 'Luqadda Nidaamka & Codka', save_profile: 'Keydi Xogta', sign_out: 'Ka bax',
    connect_google: 'Ku xidh Google', disconnect: 'Ka jar', connected_as: 'Waxaa lagu xidhay',
    google_session_expired: 'Fadhiga Google wuu dhacay', reconnect: 'Dib u xidh Google',
    gmail: 'Gmail', no_emails: 'Sanduuqa fariimaha waa madhan yahay!', summarizing: 'Soo koobayaa...',
    failed_load_emails: 'Way ku guuldareysatay inaad soo dejiso emailka. Isku day mar kale.',
    record_meeting: 'Duub Kulanka', transcribe_summarize: 'Qor & Soo Koob',
    uploading: 'Soo gelinayaa codka...', transcribing: 'Qorayaa...', summarizing_meeting: 'Soo koobayaa...',
    summary: 'Soo Koobid', action_items: 'Talaabooyinka', follow_ups: 'Dabagalka',
    upgrade: 'Kor u qaad', loading: 'Soo gelayaa...', error: 'Khalad', retry: 'Isku day mar kale',
    free_trial: 'Tijaabo 7 Maalmood', no_card: 'Kaarka looma baahna',
    go_to_settings: 'Aad Dejinta',
  },
  ar: {
    greeting_morning: 'صباح الخير', greeting_afternoon: 'مساء الخير', greeting_evening: 'مساء الخير',
    home: 'الرئيسية', calendar: 'التقويم', reminders: 'التذكيرات', voice: 'الصوت', settings: 'الإعدادات',
    team: 'الفريق', meetings: 'الاجتماعات',
    upcoming_events: 'الأحداث القادمة', view_all: 'عرض الكل', no_upcoming: 'لا توجد أحداث قادمة',
    add_event: 'إضافة حدث', free_trial_banner: 'تجربة مجانية', days_remaining: 'أيام متبقية',
    play_briefing: 'تشغيل الملخص', stop: 'إيقاف',
    add_reminder: 'إضافة تذكير', today: 'اليوم', upcoming: 'القادمة', completed: 'المكتملة', all: 'الكل',
    no_reminders: 'لا توجد تذكيرات!', search_reminders: 'بحث في التذكيرات...',
    title: 'العنوان', description: 'الوصف', date_time: 'التاريخ والوقت', notify_via: 'الإشعار عبر',
    priority: 'الأولوية', high: 'عالية', medium: 'متوسطة', low: 'منخفضة', save: 'حفظ', cancel: 'إلغاء', delete: 'حذف',
    new_event: 'حدث جديد', edit_event: 'تعديل الحدث', no_events_day: 'لا توجد أحداث في هذا اليوم',
    meeting: 'اجتماع', task: 'مهمة', appointment: 'موعد', notes: 'ملاحظات', date: 'التاريخ', time: 'الوقت',
    google_sync_upgrade: 'مزامنة تقويم Google متاحة لخطة Corporate Mini وما فوق',
    connect_google_cal: 'اربط Google في الإعدادات لمزامنة التقويم',
    tap_to_speak: 'انقر للتحدث', listening: 'جارٍ الاستماع...', thinking: 'جارٍ التفكير...', speaking: 'جارٍ التحدث...',
    ask_aria: 'اسأل ARIA أي شيء...', voice_briefing: 'ملخص صوتي',
    profile: 'الملف الشخصي', full_name: 'الاسم الكامل', whatsapp_number: 'رقم واتساب', language: 'اللغة',
    interface_language: 'لغة الواجهة والصوت', save_profile: 'حفظ الملف', sign_out: 'تسجيل الخروج',
    connect_google: 'ربط Google', disconnect: 'قطع الاتصال', connected_as: 'متصل كـ',
    google_session_expired: 'انتهت جلسة Google', reconnect: 'إعادة ربط Google',
    gmail: 'Gmail', no_emails: 'صندوق الوارد فارغ!', summarizing: 'جارٍ التلخيص...',
    failed_load_emails: 'فشل تحميل البريد. حاول مرة أخرى.',
    record_meeting: 'تسجيل اجتماع', transcribe_summarize: 'تفريغ وتلخيص',
    uploading: 'جارٍ رفع الصوت...', transcribing: 'جارٍ التفريغ...', summarizing_meeting: 'جارٍ التلخيص...',
    summary: 'الملخص', action_items: 'بنود العمل', follow_ups: 'المتابعات',
    upgrade: 'ترقية', loading: 'جارٍ التحميل...', error: 'خطأ', retry: 'إعادة المحاولة',
    free_trial: 'تجربة مجانية 7 أيام', no_card: 'لا حاجة لبطاقة ائتمان',
    go_to_settings: 'الذهاب للإعدادات',
  },
};

export const LANGUAGES = [
  { code: 'en', label: 'English',   flag: '🇬🇧', dir: 'ltr' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪', dir: 'ltr' },
  { code: 'so', label: 'Soomaali',  flag: '🇸🇴', dir: 'ltr' },
  { code: 'ar', label: 'العربية',   flag: '🇸🇦', dir: 'rtl' },
];

const Ctx = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('aria_lang') || 'en');

  const t = (k) => T[lang]?.[k] || T.en[k] || k;
  const dir = LANGUAGES.find(l => l.code === lang)?.dir || 'ltr';

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem('aria_lang', code);
  };

  // Apply dir attribute to html element for RTL support
  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  }, [lang, dir]);

  return <Ctx.Provider value={{ lang, t, setLang, dir }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
