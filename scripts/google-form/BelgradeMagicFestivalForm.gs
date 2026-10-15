/**
 * Google Form: Belgrade Magic Festival 2027 / Beogradski festival magije 2027 — registration.
 * Bilingual, English first then Serbian, modelled on the CMI congress form, with this festival's
 * packages, Hotel Prag and the close-up / stage competition.
 *
 * HOW TO USE (once):
 *  1. Sign in to Google as serbiamagicring@gmail.com and open https://script.google.com → New project.
 *  2. Paste this whole file, fill in the PAYMENT constants below, save.
 *  3. Choose the function `createForm` and click Run. Allow the permissions Google asks for.
 *  4. The Execution log shows the form link to share, the edit link and the answers sheet.
 *     Every answer emails the organiser and the person who registered.
 *
 * Prices are the same as on the website (content/*.json → packages); change them here if the site changes.
 */

// ---- Fill in before running ------------------------------------------------------------------
const ORGANISER_EMAIL = 'serbiamagicring@gmail.com';
const PAYMENT = {
  beneficiary: 'Pravni naziv organizatora', // TODO: legal name of the organiser
  rsdAccount: '000-0000000000000-00',        // TODO: dinar account
  iban: 'RS35 0000 0000 0000 0000 00',       // TODO
  swift: 'XXXXRSBG',                         // TODO
  bank: 'Naziv banke',                       // TODO
};
const EARLY_BIRD_UNTIL = new Date('2026-12-31T23:59:59+01:00');
const PRIVACY_URL = 'https://belgrademagicfestival.rs/privacy/';
// ------------------------------------------------------------------------------------------------

// Items that are counted into the total: [title, early price, regular price].
const PRICED = [
  ['Standard package / Standard paket — €99 (early bird / rana prijava), €129 after 31 Dec / posle 31. 12.', 99, 129],
  ['Dealer package / Dealer paket — €149 (early bird / rana prijava), €200 after 31 Dec / posle 31. 12.', 149, 200],
  ['Additional table (2 m) / Dodatni sto (2 m) — €50 (Dealer package only / samo uz Dealer paket)', 50, 50],
  ['Dealer assistant / Asistent dilera — €50 (Dealer package only / samo uz Dealer paket)', 50, 50],
];

const T = {
  name: 'Name and surname / Ime i prezime',
  email: 'E-mail address / E-mail adresa',
  phone: 'Mobile phone / Mobilni telefon',
  country: 'Country / Država',
  hotel: 'Would you like to stay at Hotel Prag? / Da li želite smeštaj u Hotelu Prag?',
  checkIn: 'Check-in / Dolazak',
  checkOut: 'Check-out / Odlazak',
  needs: 'Special needs or notes / Posebne potrebe ili napomena',
  competitor: 'Competitor’s name and surname / Ime i prezime takmičara',
  stageName: 'Stage name / Umetničko ime',
  category: 'Category / Kategorija',
  jury: 'I accept the jury’s decision as final / Prihvatam odluku žirija kao konačnu',
  payment: 'Payment method / Način plaćanja',
  consent: 'Consent / Saglasnost',
};
const ROOMS = [
  'Economy single room / Ekonomična jednokrevetna soba — from / od ~€57 (6,600 RSD)',
  'Single room / Jednokrevetna soba — from / od ~€62 (7,300 RSD)',
  'Double or twin room / Dvokrevetna soba — from / od ~€67 (7,900 RSD)',
  'Superior double room / Superior dvokrevetna soba — from / od ~€78 (9,200 RSD)',
  'Family room / Porodična soba — from / od ~€105 (12,300 RSD)',
];

function createForm() {
  const form = FormApp.create('Registration — Belgrade Magic Festival 2027 / Prijava — Beogradski festival magije 2027');
  form.setDescription(
    '27–28 February 2027, MTS Hall, Dečanska 14, Belgrade\n27–28. februar 2027, MTS dvorana, Dečanska 14, Beograd\n\n' +
      'Fields marked with an asterisk are required. / Polja označena zvezdicom su obavezna.',
  );
  form.setConfirmationMessage(
    'Thank you! Your registration has been received; payment details have been sent to your e-mail.\n' +
      'Hvala! Prijava je primljena; podatke za uplatu poslali smo vam mejlom.',
  );
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);

  const count = () =>
    FormApp.createTextValidation().setHelpText('Enter a number (0–20). / Upišite broj (0–20).').requireNumberBetween(0, 20).build();

  // 1. Personal details
  form.addTextItem().setTitle(T.name).setRequired(true);
  form
    .addTextItem()
    .setTitle(T.email)
    .setRequired(true)
    .setValidation(FormApp.createTextValidation().setHelpText('Enter a valid address. / Upišite ispravnu adresu.').requireTextIsEmail().build());
  form.addTextItem().setTitle(T.phone).setRequired(true);
  form.addTextItem().setTitle(T.country).setRequired(true);

  // 2. Fees
  form
    .addPageBreakItem()
    .setTitle('Registration fees / Kotizacije')
    .setHelpText(
      'For each option, enter the number of people. Early bird until 31 December 2026.\n' +
        'Standard package: the full congress programme, lectures, competitions, Magic Party, Gala Dinner and the Gala Show.\n' +
        'Dealer package: everything in the Standard package plus a 2 m dealer table.\n\n' +
        'Za svaku opciju upišite broj osoba. Rana prijava važi do 31. 12. 2026.\n' +
        'Standard paket: ceo kongresni program, predavanja, takmičenja, Magic Party, Gala večera i Gala šou „Magični Varijete“.\n' +
        'Dealer paket: sve iz Standard paketa i dilerski sto od 2 m.',
    );
  PRICED.forEach(([title]) => form.addTextItem().setTitle(title).setValidation(count()));

  // 3. Hotel
  form
    .addPageBreakItem()
    .setTitle('Accommodation — Hotel Prag / Smeštaj — Hotel Prag')
    .setHelpText(
      'Kraljice Natalije 27, Belgrade, a short walk from MTS Hall. The hotel is paid separately, directly to the hotel. ' +
        'Approximate prices per room per night with breakfast; city tax (about 160 RSD per night) is extra.\n\n' +
        'Kraljice Natalije 27, Beograd, nekoliko minuta hoda od MTS dvorane. Hotel se plaća posebno, direktno hotelu. ' +
        'Cene su okvirne, po sobi za jednu noć, sa doručkom; boravišna taksa (oko 160 RSD po noći) se plaća posebno.',
    );
  form.addMultipleChoiceItem().setTitle(T.hotel).setChoiceValues(['Yes / Da', 'No / Ne']);
  ROOMS.forEach((title) => form.addTextItem().setTitle(`${title} — number of rooms / broj soba`).setValidation(count()));
  form.addDateItem().setTitle(T.checkIn);
  form.addDateItem().setTitle(T.checkOut);
  form.addParagraphTextItem().setTitle(T.needs);

  // 4. Competition
  form
    .addPageBreakItem()
    .setTitle('Competition — close-up and stage magic / Takmičenje — close-up i scenska magija')
    .setHelpText(
      'Fill in only if you are entering the competition. Competitors perform in front of an international jury.\n' +
        'Popunite samo ako se prijavljujete za takmičenje. Takmičari nastupaju pred međunarodnim stručnim žirijem.',
    );
  form.addTextItem().setTitle(T.competitor);
  form.addTextItem().setTitle(T.stageName);
  form.addListItem().setTitle(T.category).setChoiceValues(['Close-up magic / Close-up magija', 'Stage magic / Scenska magija']);
  form.addCheckboxItem().setTitle(T.jury).setChoiceValues(['I ACCEPT / PRIHVATAM']);

  // 5. Payment and consent
  form
    .addPageBreakItem()
    .setTitle('Payment / Plaćanje')
    .setHelpText(
      'Pay the total (excluding accommodation) within 7 days; payment details will also be sent to your e-mail.\n' +
        `From Serbia (dinars): ${PAYMENT.beneficiary}, account ${PAYMENT.rsdAccount}, at the National Bank of Serbia middle rate on the day of payment.\n` +
        `From abroad (EUR): ${PAYMENT.beneficiary}, IBAN ${PAYMENT.iban}, SWIFT ${PAYMENT.swift}, ${PAYMENT.bank}. Sender's bank charges are paid by the sender.\n` +
        'Reference: your name and surname.\n\n' +
        'Ukupan iznos (bez smeštaja) uplatite u roku od 7 dana; podatke za uplatu dobićete i mejlom.\n' +
        `Iz Srbije (dinari): ${PAYMENT.beneficiary}, račun ${PAYMENT.rsdAccount}. Iznos u dinarima po srednjem kursu NBS na dan uplate.\n` +
        `Iz inostranstva (EUR): ${PAYMENT.beneficiary}, IBAN ${PAYMENT.iban}, SWIFT ${PAYMENT.swift}, ${PAYMENT.bank}. Troškove banke pošiljaoca snosi uplatilac.\n` +
        'Poziv na broj: ime i prezime.',
    );
  form
    .addMultipleChoiceItem()
    .setTitle(T.payment)
    .setChoiceValues(['From abroad (EUR) / Uplata iz inostranstva (EUR)', 'From Serbia (dinars) / Uplata iz Srbije (dinari)'])
    .setRequired(true);
  form
    .addCheckboxItem()
    .setTitle(T.consent)
    .setHelpText(`Privacy policy / Politika privatnosti: ${PRIVACY_URL}`)
    .setChoiceValues([
      'I agree that the organiser stores my data to process this registration. / Saglasan/na sam da organizator čuva moje podatke radi obrade prijave.',
    ])
    .setRequired(true);

  // Answers into a spreadsheet, and an email on every new answer.
  const sheet = SpreadsheetApp.create('Registrations — Belgrade Magic Festival 2027');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());
  ScriptApp.newTrigger('onSubmit').forForm(form).onFormSubmit().create();

  Logger.log('Share link / Link za deljenje: ' + form.getPublishedUrl());
  Logger.log('Edit / Uređivanje: ' + form.getEditUrl());
  Logger.log('Answers / Odgovori: ' + sheet.getUrl());
}

/** Runs on every new answer: works out the total and emails the organiser and the participant. */
function onSubmit(e) {
  const answers = {};
  e.response.getItemResponses().forEach((r) => (answers[r.getItem().getTitle()] = r.getResponse()));
  const when = e.response.getTimestamp();
  const early = when <= EARLY_BIRD_UNTIL;

  const lines = [];
  let total = 0;
  PRICED.forEach(([title, earlyPrice, regularPrice]) => {
    const n = Number(answers[title] || 0);
    if (!n) return;
    const price = early ? earlyPrice : regularPrice;
    total += n * price;
    lines.push(`${title.split(' — ')[0]}: ${n} × €${price} = €${n * price}`);
  });

  const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const all = Object.keys(answers)
    .map((k) => `<tr><td style="padding:3px 14px 3px 0;color:#666">${esc(k)}</td><td>${esc([].concat(answers[k]).join(', '))}</td></tr>`)
    .join('');
  const summary = lines.length ? lines.map(esc).join('<br>') + `<br><b>Total / Ukupno: €${total}</b>` : 'No fees selected / Bez kotizacije';
  const name = answers[T.name] || '';

  // The organiser's copy is in Serbian.
  MailApp.sendEmail({
    to: ORGANISER_EMAIL,
    replyTo: answers[T.email] || ORGANISER_EMAIL,
    subject: `Nova prijava: ${name} (${total} €)`,
    htmlBody: `<p><b>${esc(name)}</b>${early ? ' — rana prijava' : ''}</p><p>${summary}</p><table>${all}</table>`,
  });

  if (answers[T.email]) {
    MailApp.sendEmail({
      to: answers[T.email],
      replyTo: ORGANISER_EMAIL,
      subject: 'Belgrade Magic Festival 2027 — registration received / prijava primljena',
      htmlBody:
        `<p>Thank you, ${esc(name)}! Your registration has been received. / Hvala! Vaša prijava je primljena.</p>` +
        `<p>${summary}</p>` +
        `<p><b>Payment / Uplata</b> (reference / poziv na broj: ${esc(name)})<br>` +
        `From abroad (EUR) / Iz inostranstva: ${esc(PAYMENT.beneficiary)}, IBAN ${esc(PAYMENT.iban)}, SWIFT ${esc(PAYMENT.swift)}, ${esc(PAYMENT.bank)}<br>` +
        `From Serbia (dinars) / Iz Srbije: ${esc(PAYMENT.beneficiary)}, ${esc(PAYMENT.rsdAccount)}</p>` +
        `<p>We hold your place for 7 days. Questions: ${ORGANISER_EMAIL}<br>Mesto vam čuvamo 7 dana od prijave. Pitanja: ${ORGANISER_EMAIL}</p>`,
    });
  }
}
