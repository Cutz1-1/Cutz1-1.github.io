// Shared customer sign-in for barber.html, mybookings.html and reset-password.html.
//
// Customers never pick a password on the website: they enter their email and
// type the 6-digit code we send. New accounts get Supabase's "Confirm signup"
// email and returning customers the "Magic Link" email; both templates carry
// {{ .Token }} (supabase/email-template*.html in the app repo). Setting
// RETURNING_GETS_CODE to false falls back to password sign-in for returning
// customers, e.g. if the Magic Link template ever loses the code again.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://ukoovhgmbqfocalykhyx.supabase.co';
// Public anon key, same as the app (src/config.js). Access control is RLS.
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrb292aGdtYnFmb2NhbHlraHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTIxMzksImV4cCI6MjA5NzM4ODEzOX0.sgPaplaU840VLD89UgV1fIlQcfDXMOVonhMXdvjlzl4';
export const RETURNING_GETS_CODE = true;
export const SITE = 'https://cutzapp.one';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const validEmail = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

function randomPassword() {
  const a = new Uint8Array(24); crypto.getRandomValues(a);
  return 'Cz!' + Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}

// Starts sign-in for an email. Resolves to:
//   { mode: 'code', isNew: true }    a code was emailed (new account)
//   { mode: 'code', isNew: false }   a code was emailed (returning, template updated)
//   { mode: 'password' }             returning customer, use password (no email sent)
export async function startEmailSignIn(email) {
  // signUp on an existing address sends nothing and returns a user with no
  // identities, so it tells new and returning customers apart without
  // emailing a dead link. Unconfirmed accounts get their code re-sent.
  const { data, error } = await sb.auth.signUp({ email, password: randomPassword(), options: { data: { userType: 'customer' } } });
  if (error) throw friendlyAuthError(error);
  const existing = data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;
  if (!existing) return { mode: 'code', isNew: true };
  if (!RETURNING_GETS_CODE) return { mode: 'password' };
  const { error: e2 } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (e2) throw friendlyAuthError(e2);
  return { mode: 'code', isNew: false };
}

export async function verifyEmailCode(email, code, isNew) {
  const { data, error } = await sb.auth.verifyOtp({ email, token: code, type: isNew ? 'signup' : 'email' });
  if (error) throw new Error('That code is incorrect or has expired.');
  try { await sb.rpc('mark_customer_email_verified'); } catch (_) {}
  return data.user;
}

export async function resendCode(email, isNew) {
  const { error } = isNew
    ? await sb.auth.resend({ type: 'signup', email })
    : await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (error) throw friendlyAuthError(error);
}

export async function signInWithPassword(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(/not confirmed/i.test(error.message) ? 'Please confirm your email first. We just sent you a new code.' : "That email and password don't match a Cutz account.");
  return data.user;
}

export async function sendPasswordReset(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${SITE}/reset-password.html` });
  if (error) throw friendlyAuthError(error);
}

export function friendlyAuthError(e) {
  const m = e?.message || '';
  if (/rate|security purposes|too many/i.test(m)) return new Error('Please wait a minute before asking for another email.');
  if (/invalid.*email|email.*invalid/i.test(m)) return new Error('Please enter a valid email address.');
  return new Error(m || 'Something went wrong. Please try again.');
}

export async function currentUser() {
  const { data } = await sb.auth.getSession();
  return data.session?.user || null;
}

export const userType = u => u?.user_metadata?.userType || 'customer';

export async function loadCustomer(user) {
  const { data } = await sb.from('customers').select('name, phone, email, cooldown_until').eq('id', user.id).maybeSingle();
  return data;
}

// Creates or updates the customers row the app expects. Phone numbers are
// unique per account, which surfaces as 23505.
export async function saveCustomer(user, existing, { name, phone }) {
  if (!existing) {
    const { error } = await sb.from('customers').insert({ id: user.id, name, email: user.email, phone, gdpr_accepted_at: new Date().toISOString() });
    if (error) throw new Error(phoneError(error));
    return { name, phone, email: user.email, cooldown_until: null };
  }
  if (name !== existing.name || phone !== existing.phone) {
    const { error } = await sb.from('customers').update({ name, phone }).eq('id', user.id);
    if (error) throw new Error(phoneError(error));
  }
  return { ...existing, name, phone };
}
function phoneError(e) {
  return e && (e.code === '23505' || /phone/i.test(e.message || '')) ? 'That phone number is already used by another Cutz account. Use the email you booked with before.' : (e?.message || 'Something went wrong. Please try again.');
}

// Phone field shared by every form: country code + national number.
export const COUNTRIES = [['45', '🇩🇰 +45'], ['46', '🇸🇪 +46'], ['47', '🇳🇴 +47'], ['49', '🇩🇪 +49'], ['44', '🇬🇧 +44'], ['31', '🇳🇱 +31'], ['358', '🇫🇮 +358'], ['354', '🇮🇸 +354'], ['48', '🇵🇱 +48'], ['1', '🇺🇸 +1']];
export function splitPhone(p) {
  const m = String(p || '').match(/^\+(\d+)\s+(.*)$/);
  return m ? { cc: m[1], num: m[2] } : { cc: '45', num: String(p || '').replace(/^\+/, '') };
}
export function phoneField(val, id = 'f-num') {
  const { cc, num } = splitPhone(val);
  const opts = COUNTRIES.some(c => c[0] === cc) ? COUNTRIES : [[cc, `+${cc}`], ...COUNTRIES];
  return `<div class="field"><label for="${id}">Phone</label><div class="phone"><select id="${id}-cc" aria-label="Country code">${opts.map(([c, l]) => `<option value="${c}" ${c === cc ? 'selected' : ''}>${l}</option>`).join('')}</select><input id="${id}" type="tel" inputmode="tel" autocomplete="tel-national" value="${esc(num)}" placeholder="12 34 56 78"></div></div>`;
}
export function readPhone(root, id = 'f-num') {
  const num = root.querySelector('#' + id).value.replace(/[^\d]/g, '');
  return num.length >= 6 ? `+${root.querySelector('#' + id + '-cc').value} ${num}` : null;
}

// Six single-digit boxes with paste support. Calls onComplete(code) at 6 digits.
export function otpBoxes() {
  return `<div class="otp">${[0, 1, 2, 3, 4, 5].map(i => `<input inputmode="numeric" pattern="[0-9]*" autocomplete="${i ? 'off' : 'one-time-code'}" maxlength="6" aria-label="Digit ${i + 1}">`).join('')}</div>`;
}
export function wireOtp(root, onComplete) {
  const ins = [...root.querySelectorAll('.otp input')];
  ins[0]?.focus();
  ins.forEach((inp, i) => {
    inp.oninput = () => {
      const v = inp.value.replace(/\D/g, '');
      if (v.length > 1) {
        v.slice(0, 6).split('').forEach((c, j) => { if (ins[j]) ins[j].value = c; });
        ins[Math.min(v.length, 6) - 1].focus();
      } else { inp.value = v; if (v && ins[i + 1]) ins[i + 1].focus(); }
      const code = ins.map(x => x.value).join('');
      if (code.length === 6) onComplete(code);
    };
    inp.onkeydown = e => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); };
  });
  return () => ins.map(x => x.value).join('');
}
