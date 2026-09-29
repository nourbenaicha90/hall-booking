import { createContext, useContext, useEffect, useState } from 'react';

const ar = {
  brand_default: 'قاعة الحفلات',
  nav_home: 'الرئيسية', nav_services: 'الخدمات', nav_sections: 'الأركان', nav_gallery: 'المعرض', nav_contact: 'تواصل',
  book_now: 'احجز الآن', about_us: 'تعرّف علينا', login: 'تسجيل الدخول', register: 'حساب جديد', logout: 'خروج', my_account: 'حسابي',
  admin_panel: 'لوحة التحكم', lang_switch: 'English',
  hero_check: 'تحقق من توفّر تاريخك', hero_check_btn: 'تحقق من التوفّر', hero_pick_date: 'اختر تاريخ مناسبتك',
  services_title: 'خدماتنا', services_sub: 'كل ما تحتاجه مناسبتك في مكان واحد',
  sections_title: 'أركان القاعة', sections_sub: 'اختر الركن الأنسب لمناسبتك', per_hour: 'للساعة', up_to: 'حتى', guests_unit: 'ضيف',
  book_section: 'احجز هذا الركن',
  gallery_title: 'معرض الصور', gallery_empty: 'ستظهر هنا صور القاعة عندما تضيفها الإدارة.',
  reviews_title: 'آراء عملائنا',
  contact_title: 'تواصل معنا', address: 'العنوان', phone: 'الهاتف', email: 'البريد الإلكتروني',
  rights: 'جميع الحقوق محفوظة',
  // حسابات
  full_name: 'الاسم الكامل', password: 'كلمة المرور', new_password: 'كلمة المرور الجديدة', current_password: 'كلمة المرور الحالية',
  no_account: 'ليس لديك حساب؟', have_account: 'لديك حساب بالفعل؟', forgot_password: 'نسيت كلمة المرور؟',
  create_account: 'إنشاء الحساب', signing_in: 'جارٍ الدخول…', send_reset: 'أرسل رابط الاستعادة', reset_password: 'تغيير كلمة المرور',
  reset_title: 'استعادة كلمة المرور', reset_hint: 'أدخل بريدك وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.',
  save_changes: 'حفظ التغييرات', saved: 'تم الحفظ', password_changed: 'تم تغيير كلمة المرور',
  // حجز
  booking_title: 'احجز مناسبتك', occasion: 'نوع المناسبة', section: 'الركن', date: 'التاريخ', start_time: 'وقت البداية', hours: 'عدد الساعات',
  guests: 'عدد الضيوف', notes: 'ملاحظات إضافية', estimate: 'التكلفة التقديرية', deposit: 'العربون المطلوب',
  send_request: 'أرسل طلب الحجز', sending: 'جارٍ الإرسال…', pick_date_first: 'اختر يوماً من التقويم',
  booking_sent: 'وصلنا طلبك! سنراجعه ونخبرك بالنتيجة عبر الإشعارات والبريد.', view_bookings: 'عرض حجوزاتي',
  legend_free: 'متاح', legend_pending: 'بانتظار موافقة', legend_booked: 'محجوز', legend_blocked: 'غير متاح',
  day_details: 'تفاصيل اليوم', nothing_that_day: 'لا حجوزات في هذا اليوم', blocked_reason: 'محجوب',
  login_to_book: 'سجّل الدخول لإرسال الطلب', pending_warn: 'يوجد طلب آخر بانتظار الموافقة في هذا اليوم. يمكنك المتابعة وستحسم الإدارة.',
  // occasions
  occ_wedding: 'زفاف', occ_engagement: 'خطوبة', occ_birthday: 'عيد ميلاد', occ_conference: 'مؤتمر', occ_seminar: 'ندوة', occ_other: 'أخرى',
  // status
  st_pending: 'بانتظار التأكيد', st_confirmed: 'مؤكَّد', st_rejected: 'مرفوض', st_completed: 'منتهٍ', st_cancelled: 'ملغى',
  pay_unpaid: 'غير مدفوع', pay_deposit_paid: 'عربون مدفوع', pay_fully_paid: 'مدفوع بالكامل',
  // حساب الزبون
  account_title: 'حسابي', tab_bookings: 'حجوزاتي', tab_notifications: 'الإشعارات', tab_profile: 'بياناتي',
  no_bookings: 'لم تحجز بعد. اختر تاريخاً وابدأ.', invoice: 'الفاتورة', cancel_booking: 'إلغاء الحجز', confirm_cancel: 'هل تريد إلغاء هذا الحجز؟',
  no_notifications: 'لا إشعارات جديدة', mark_all_read: 'تعيين الكل كمقروء', booking_no: 'حجز رقم', total: 'الإجمالي', paid: 'المدفوع', remaining: 'المتبقي',
  cancel_locked: 'الإلغاء متاح قبل الموعد بمدة كافية فقط',
  // فاتورة
  print_pdf: 'طباعة / حفظ PDF', payments_log: 'الدفعات', method: 'الطريقة', amount: 'المبلغ',
  m_cash: 'نقداً', m_card: 'بطاقة', m_transfer: 'تحويل', m_online: 'إلكتروني',
  // إدارة
  a_dashboard: 'الإحصائيات', a_bookings: 'الحجوزات', a_calendar: 'التقويم', a_catalog: 'الأركان والخدمات', a_payments: 'المدفوعات', a_users: 'الزبائن',
  a_login_title: 'دخول الإدارة', a_stat_bookings: 'إجمالي الحجوزات', a_stat_pending: 'بانتظار الرد', a_stat_customers: 'الزبائن', a_stat_revenue: 'إجمالي الإيرادات', a_stat_month: 'إيرادات هذا الشهر',
  a_chart_bookings: 'الحجوزات الشهرية', a_chart_revenue: 'الإيرادات الشهرية', a_chart_top: 'الأركان الأكثر طلباً',
  filter_all: 'الكل', search: 'بحث بالاسم أو الهاتف', customer: 'الزبون', actions: 'إجراءات', status: 'الحالة', payment: 'الدفع',
  confirm: 'تأكيد', reject: 'رفض', edit: 'تعديل', delete: 'حذف', save: 'حفظ', cancel: 'إلغاء', add: 'إضافة', close: 'إغلاق', add_payment: 'تسجيل دفعة',
  admin_notes: 'ملاحظات داخلية', end_time: 'وقت النهاية', total_amount: 'المبلغ الإجمالي', deposit_amount: 'العربون',
  confirm_delete: 'هل أنت متأكد من الحذف؟', manual_booking: 'حجز يدوي', customer_name: 'اسم الزبون', customer_phone: 'هاتف الزبون',
  block_day: 'حجب هذا اليوم', unblock_day: 'إلغاء الحجب', reason: 'السبب', no_results: 'لا توجد نتائج',
  name: 'الاسم', description: 'الوصف', price: 'السعر', capacity: 'السعة', image: 'الصورة', icon: 'الأيقونة', active: 'مفعّل', upload: 'رفع صورة',
  hall_info: 'بيانات القاعة', tagline: 'الشعار النصي', map_url: 'رابط تضمين الخريطة (Google Maps Embed)', gallery_images: 'صور المعرض',
  tab_sections: 'الأركان', tab_services: 'الخدمات', tab_hall: 'القاعة', tab_reviews: 'آراء العملاء', rating: 'التقييم', text: 'النص',
  report: 'التقرير المالي', daily: 'يومي', monthly: 'شهري', yearly: 'سنوي', period: 'الفترة', operations: 'عدد العمليات',
  refund: 'استرجاع', refunded: 'مسترجعة', suspend: 'تعليق', unsuspend: 'إلغاء التعليق', suspended: 'معلّق', role: 'الدور', joined: 'تاريخ التسجيل',
  bookings_count: 'الحجوزات', new_admin: 'مسؤول جديد', loading: 'جارٍ التحميل…', error: 'خطأ', back_home: 'العودة للرئيسية',
};

const en = {
  brand_default: 'Event Hall',
  nav_home: 'Home', nav_services: 'Services', nav_sections: 'Sections', nav_gallery: 'Gallery', nav_contact: 'Contact',
  book_now: 'Book now', about_us: 'About us', login: 'Log in', register: 'Sign up', logout: 'Log out', my_account: 'My account',
  admin_panel: 'Admin panel', lang_switch: 'العربية',
  hero_check: 'Check your date', hero_check_btn: 'Check availability', hero_pick_date: 'Pick your event date',
  services_title: 'Our services', services_sub: 'Everything your event needs, under one roof',
  sections_title: 'Hall sections', sections_sub: 'Choose the space that fits your occasion', per_hour: 'per hour', up_to: 'Up to', guests_unit: 'guests',
  book_section: 'Book this section',
  gallery_title: 'Gallery', gallery_empty: 'Hall photos will appear here once the team adds them.',
  reviews_title: 'What our clients say',
  contact_title: 'Contact us', address: 'Address', phone: 'Phone', email: 'Email',
  rights: 'All rights reserved',
  full_name: 'Full name', password: 'Password', new_password: 'New password', current_password: 'Current password',
  no_account: "Don't have an account?", have_account: 'Already have an account?', forgot_password: 'Forgot your password?',
  create_account: 'Create account', signing_in: 'Signing in…', send_reset: 'Send reset link', reset_password: 'Change password',
  reset_title: 'Reset password', reset_hint: "Enter your email and we'll send you a link to set a new password.",
  save_changes: 'Save changes', saved: 'Saved', password_changed: 'Password changed',
  booking_title: 'Book your event', occasion: 'Occasion', section: 'Section', date: 'Date', start_time: 'Start time', hours: 'Hours',
  guests: 'Guests', notes: 'Additional notes', estimate: 'Estimated cost', deposit: 'Deposit due',
  send_request: 'Send booking request', sending: 'Sending…', pick_date_first: 'Pick a day on the calendar',
  booking_sent: "We received your request. We'll review it and let you know by notification and email.", view_bookings: 'View my bookings',
  legend_free: 'Available', legend_pending: 'Awaiting approval', legend_booked: 'Booked', legend_blocked: 'Unavailable',
  day_details: 'Day details', nothing_that_day: 'No bookings on this day', blocked_reason: 'Blocked',
  login_to_book: 'Log in to send your request', pending_warn: 'Another request is awaiting approval on this day. You can still continue; the team will decide.',
  occ_wedding: 'Wedding', occ_engagement: 'Engagement', occ_birthday: 'Birthday', occ_conference: 'Conference', occ_seminar: 'Seminar', occ_other: 'Other',
  st_pending: 'Awaiting confirmation', st_confirmed: 'Confirmed', st_rejected: 'Rejected', st_completed: 'Completed', st_cancelled: 'Cancelled',
  pay_unpaid: 'Unpaid', pay_deposit_paid: 'Deposit paid', pay_fully_paid: 'Fully paid',
  account_title: 'My account', tab_bookings: 'My bookings', tab_notifications: 'Notifications', tab_profile: 'Profile',
  no_bookings: "You haven't booked yet. Pick a date to start.", invoice: 'Invoice', cancel_booking: 'Cancel booking', confirm_cancel: 'Cancel this booking?',
  no_notifications: 'No notifications', mark_all_read: 'Mark all as read', booking_no: 'Booking #', total: 'Total', paid: 'Paid', remaining: 'Remaining',
  cancel_locked: 'Cancellation is only available well before the event',
  print_pdf: 'Print / Save as PDF', payments_log: 'Payments', method: 'Method', amount: 'Amount',
  m_cash: 'Cash', m_card: 'Card', m_transfer: 'Transfer', m_online: 'Online',
  a_dashboard: 'Statistics', a_bookings: 'Bookings', a_calendar: 'Calendar', a_catalog: 'Sections & services', a_payments: 'Payments', a_users: 'Customers',
  a_login_title: 'Admin sign-in', a_stat_bookings: 'Total bookings', a_stat_pending: 'Awaiting reply', a_stat_customers: 'Customers', a_stat_revenue: 'Total revenue', a_stat_month: 'Revenue this month',
  a_chart_bookings: 'Bookings per month', a_chart_revenue: 'Revenue per month', a_chart_top: 'Most requested sections',
  filter_all: 'All', search: 'Search by name or phone', customer: 'Customer', actions: 'Actions', status: 'Status', payment: 'Payment',
  confirm: 'Confirm', reject: 'Reject', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel', add: 'Add', close: 'Close', add_payment: 'Record payment',
  admin_notes: 'Internal notes', end_time: 'End time', total_amount: 'Total amount', deposit_amount: 'Deposit',
  confirm_delete: 'Are you sure you want to delete this?', manual_booking: 'Manual booking', customer_name: 'Customer name', customer_phone: 'Customer phone',
  block_day: 'Block this day', unblock_day: 'Unblock', reason: 'Reason', no_results: 'No results',
  name: 'Name', description: 'Description', price: 'Price', capacity: 'Capacity', image: 'Image', icon: 'Icon', active: 'Active', upload: 'Upload image',
  hall_info: 'Hall details', tagline: 'Tagline', map_url: 'Map embed URL (Google Maps Embed)', gallery_images: 'Gallery images',
  tab_sections: 'Sections', tab_services: 'Services', tab_hall: 'Hall', tab_reviews: 'Reviews', rating: 'Rating', text: 'Text',
  report: 'Financial report', daily: 'Daily', monthly: 'Monthly', yearly: 'Yearly', period: 'Period', operations: 'Transactions',
  refund: 'Refund', refunded: 'Refunded', suspend: 'Suspend', unsuspend: 'Unsuspend', suspended: 'Suspended', role: 'Role', joined: 'Joined',
  bookings_count: 'Bookings', new_admin: 'New admin', loading: 'Loading…', error: 'Error', back_home: 'Back to home',
};

const dict = { ar, en };
const Ctx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'ar');
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('lang', lang);
  }, [lang]);
  const t = (k) => dict[lang][k] ?? dict.ar[k] ?? k;
  return <Ctx.Provider value={{ lang, setLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr' }}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);
