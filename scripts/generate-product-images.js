#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads', 'productos');
const BASE_URL = '/api/v1/uploads/productos';

// ── Color themes per category prefix ─────────────────────────────────────────
const THEMES = {
  MED: { bg1: '#1a56db', bg2: '#3b82f6', badge: '#1e3a8a', text: '#dbeafe', deco: '#93c5fd' },
  ALI: { bg1: '#c2410c', bg2: '#f97316', badge: '#7c2d12', text: '#ffedd5', deco: '#fdba74' },
  ANT: { bg1: '#6d28d9', bg2: '#a855f7', badge: '#4c1d95', text: '#ede9fe', deco: '#c4b5fd' },
  VAC: { bg1: '#065f46', bg2: '#10b981', badge: '#064e3b', text: '#d1fae5', deco: '#6ee7b7' },
  HIG: { bg1: '#0369a1', bg2: '#22d3ee', badge: '#0c4a6e', text: '#e0f2fe', deco: '#7dd3fc' },
  SUP: { bg1: '#92400e', bg2: '#f59e0b', badge: '#78350f', text: '#fef3c7', deco: '#fcd34d' },
  ACC: { bg1: '#9d174d', bg2: '#ec4899', badge: '#831843', text: '#fce7f3', deco: '#f9a8d4' },
  EQP: { bg1: '#1e293b', bg2: '#64748b', badge: '#0f172a', text: '#e2e8f0', deco: '#94a3b8' },
};

// ── Category labels ───────────────────────────────────────────────────────────
const LABELS = {
  MED: 'MEDICAMENTOS',
  ALI: 'ALIMENTOS',
  ANT: 'ANTIPARASITARIOS',
  VAC: 'VACUNAS',
  HIG: 'HIGIENE Y GROOMING',
  SUP: 'SUPLEMENTOS',
  ACC: 'ACCESORIOS',
  EQP: 'EQUIPAMIENTO CLÍNICO',
};

// ── Icon generators (return SVG fragments; c = theme) ─────────────────────────
const ICONS = {

  // ── Medicamentos ─────────────────────────────────────────────────────────────

  pill: (c) => `
    <g opacity="0.95">
      <rect x="148" y="178" width="104" height="44" rx="22" fill="white"/>
      <rect x="148" y="178" width="52" height="44" rx="22" fill="${c.deco}" opacity="0.7"/>
      <line x1="200" y1="176" x2="200" y2="224" stroke="${c.bg1}" stroke-width="3"/>
    </g>`,

  capsule: (c) => `
    <g opacity="0.95">
      <rect x="152" y="175" width="96" height="50" rx="25" fill="white"/>
      <rect x="152" y="175" width="48" height="50" rx="25" fill="${c.deco}" opacity="0.8"/>
      <line x1="200" y1="174" x2="200" y2="226" stroke="${c.bg1}" stroke-width="2.5"/>
    </g>`,

  bottle: (c) => `
    <g opacity="0.95">
      <rect x="184" y="175" width="32" height="68" rx="7" fill="white"/>
      <rect x="191" y="160" width="18" height="18" rx="4" fill="white" opacity="0.85"/>
      <rect x="196" y="151" width="8" height="12" rx="3" fill="white" opacity="0.75"/>
      <rect x="189" y="198" width="22" height="5" rx="2" fill="${c.bg1}" opacity="0.25"/>
      <rect x="189" y="209" width="15" height="3" rx="1" fill="${c.bg1}" opacity="0.18"/>
    </g>`,

  dropper: (c) => `
    <g opacity="0.95">
      <rect x="184" y="180" width="32" height="68" rx="8" fill="white"/>
      <rect x="190" y="164" width="20" height="19" rx="5" fill="white" opacity="0.85"/>
      <path d="M200 145 Q207 158 207 164 L193 164 Q193 158 200 145Z" fill="white" opacity="0.75"/>
      <rect x="189" y="205" width="22" height="5" rx="2" fill="${c.bg1}" opacity="0.22"/>
    </g>`,

  syringe: (c) => `
    <g opacity="0.95" transform="translate(200,200) rotate(-40) translate(-200,-200)">
      <rect x="183" y="152" width="34" height="88" rx="4" fill="white"/>
      <rect x="191" y="240" width="18" height="14" rx="2" fill="white" opacity="0.85"/>
      <line x1="200" y1="254" x2="200" y2="278" stroke="white" stroke-width="5" stroke-linecap="round"/>
      <rect x="173" y="159" width="10" height="7" rx="1" fill="white" opacity="0.8"/>
      <rect x="217" y="159" width="10" height="7" rx="1" fill="white" opacity="0.8"/>
      <rect x="189" y="178" width="22" height="52" rx="2" fill="${c.bg1}" opacity="0.2"/>
    </g>`,

  // ── Alimentos ─────────────────────────────────────────────────────────────────

  foodbag: (c) => `
    <g opacity="0.95">
      <path d="M163 155 L237 155 L244 265 L156 265 Z" fill="white"/>
      <rect x="174" y="140" width="52" height="19" rx="4" fill="white" opacity="0.85"/>
      <circle cx="200" cy="214" r="16" fill="${c.bg1}" opacity="0.22"/>
      <circle cx="185" cy="200" r="7" fill="${c.bg1}" opacity="0.18"/>
      <circle cx="215" cy="200" r="7" fill="${c.bg1}" opacity="0.18"/>
      <circle cx="193" cy="195" r="6" fill="${c.bg1}" opacity="0.18"/>
      <circle cx="207" cy="195" r="6" fill="${c.bg1}" opacity="0.18"/>
    </g>`,

  can: (c) => `
    <g opacity="0.95">
      <rect x="162" y="178" width="76" height="76" rx="6" fill="white"/>
      <ellipse cx="200" cy="178" rx="38" ry="12" fill="white" opacity="0.9"/>
      <ellipse cx="200" cy="254" rx="38" ry="12" fill="white" opacity="0.8"/>
      <rect x="162" y="204" width="76" height="24" fill="${c.deco}" opacity="0.28"/>
    </g>`,

  pouch: (c) => `
    <g opacity="0.95">
      <path d="M170 162 Q168 151 179 149 L221 149 Q232 151 230 162 L236 248 Q236 259 225 259 L175 259 Q164 259 164 248 Z" fill="white"/>
      <rect x="175" y="190" width="50" height="6" rx="3" fill="${c.bg1}" opacity="0.22"/>
      <rect x="175" y="203" width="38" height="4" rx="2" fill="${c.bg1}" opacity="0.18"/>
    </g>`,

  tray: (c) => `
    <g opacity="0.95">
      <rect x="154" y="200" width="92" height="66" rx="9" fill="white"/>
      <ellipse cx="200" cy="200" rx="46" ry="14" fill="white" opacity="0.9"/>
      <circle cx="183" cy="225" r="10" fill="${c.bg1}" opacity="0.2"/>
      <circle cx="200" cy="222" r="10" fill="${c.bg1}" opacity="0.2"/>
      <circle cx="217" cy="225" r="10" fill="${c.bg1}" opacity="0.2"/>
    </g>`,

  dentalstick: (c) => `
    <g opacity="0.95">
      <rect x="167" y="147" width="18" height="106" rx="9" fill="white"/>
      <rect x="193" y="157" width="15" height="96" rx="7" fill="white" opacity="0.85"/>
      <rect x="216" y="167" width="14" height="86" rx="7" fill="white" opacity="0.75"/>
    </g>`,

  // ── Antiparasitarios ──────────────────────────────────────────────────────────

  pipette: (c) => `
    <g opacity="0.95">
      <path d="M200 146 Q224 175 227 201 A27 27 0 0 1 173 201 Q176 175 200 146Z" fill="white"/>
      <rect x="196" y="124" width="8" height="26" rx="4" fill="white" opacity="0.85"/>
      <rect x="190" y="118" width="20" height="10" rx="4" fill="white" opacity="0.75"/>
    </g>`,

  // ── Vacunas ───────────────────────────────────────────────────────────────────

  vial: (c) => `
    <g opacity="0.95">
      <rect x="182" y="175" width="36" height="70" rx="7" fill="white"/>
      <rect x="188" y="160" width="24" height="18" rx="5" fill="white" opacity="0.85"/>
      <rect x="193" y="151" width="14" height="12" rx="3" fill="white" opacity="0.75"/>
      <rect x="188" y="200" width="24" height="6" rx="3" fill="${c.bg1}" opacity="0.28"/>
      <rect x="188" y="212" width="17" height="4" rx="2" fill="${c.bg1}" opacity="0.22"/>
      <g transform="translate(228,172) rotate(18)">
        <rect x="-5" y="0" width="10" height="58" rx="3" fill="white" opacity="0.8"/>
        <line x1="0" y1="58" x2="0" y2="76" stroke="white" stroke-width="4" stroke-linecap="round"/>
        <rect x="-9" y="6" width="4" height="6" rx="1" fill="white" opacity="0.7"/>
        <rect x="5" y="6" width="4" height="6" rx="1" fill="white" opacity="0.7"/>
      </g>
    </g>`,

  // ── Higiene y Grooming ────────────────────────────────────────────────────────

  shampoo: (c) => `
    <g opacity="0.95">
      <path d="M177 178 L184 156 L216 156 L223 178 L223 268 Q223 278 213 278 L187 278 Q177 278 177 268 Z" fill="white"/>
      <rect x="193" y="146" width="14" height="13" rx="2" fill="white" opacity="0.8"/>
      <rect x="199" y="132" width="4" height="17" rx="2" fill="white" opacity="0.72"/>
      <rect x="193" y="129" width="14" height="6" rx="3" fill="white" opacity="0.72"/>
      <rect x="185" y="203" width="30" height="6" rx="3" fill="${c.bg1}" opacity="0.22"/>
      <rect x="185" y="215" width="22" height="4" rx="2" fill="${c.bg1}" opacity="0.18"/>
    </g>`,

  earcleaner: (c) => `
    <g opacity="0.95">
      <rect x="184" y="183" width="32" height="70" rx="9" fill="white"/>
      <rect x="190" y="167" width="20" height="19" rx="5" fill="white" opacity="0.85"/>
      <path d="M200 147 Q207 161 207 167 L193 167 Q193 161 200 147Z" fill="white" opacity="0.75"/>
      <rect x="189" y="210" width="22" height="5" rx="2" fill="${c.bg1}" opacity="0.22"/>
    </g>`,

  toothpaste: (c) => `
    <g opacity="0.95">
      <rect x="183" y="166" width="34" height="76" rx="4" fill="white"/>
      <path d="M183 242 Q183 270 200 270 Q217 270 217 242 Z" fill="white" opacity="0.85"/>
      <rect x="190" y="156" width="20" height="14" rx="5" fill="white" opacity="0.8"/>
      <rect x="187" y="185" width="26" height="6" rx="3" fill="${c.bg1}" opacity="0.28"/>
      <rect x="187" y="197" width="19" height="4" rx="2" fill="${c.bg1}" opacity="0.2"/>
    </g>`,

  wipes: (c) => `
    <g opacity="0.95">
      <rect x="158" y="167" width="84" height="66" rx="9" fill="white"/>
      <rect x="167" y="157" width="66" height="14" rx="5" fill="white" opacity="0.85"/>
      <rect x="168" y="192" width="64" height="5" rx="2" fill="${c.bg1}" opacity="0.22"/>
      <rect x="168" y="203" width="48" height="3" rx="1" fill="${c.bg1}" opacity="0.18"/>
      <ellipse cx="200" cy="164" rx="20" ry="7" fill="${c.deco}" opacity="0.55"/>
    </g>`,

  brush: (c) => {
    const bristles = Array.from({ length: 8 }, (_, i) =>
      `<line x1="${188 + i * 3}" y1="213" x2="${188 + i * 3}" y2="250" stroke="${c.bg1}" stroke-width="2.5" opacity="0.35" stroke-linecap="round"/>`
    ).join('');
    return `
    <g opacity="0.95" transform="translate(200,200) rotate(-28) translate(-200,-200)">
      <rect x="185" y="147" width="30" height="66" rx="6" fill="white"/>
      <rect x="186" y="213" width="28" height="44" rx="4" fill="white" opacity="0.8"/>
      ${bristles}
    </g>`;
  },

  // ── Suplementos ───────────────────────────────────────────────────────────────

  suppbottle: (c) => `
    <g opacity="0.95">
      <rect x="178" y="174" width="44" height="72" rx="8" fill="white"/>
      <rect x="184" y="159" width="32" height="18" rx="4" fill="white" opacity="0.85"/>
      <rect x="191" y="151" width="18" height="11" rx="3" fill="white" opacity="0.75"/>
      <rect x="183" y="198" width="34" height="7" rx="3" fill="${c.bg1}" opacity="0.25"/>
      <rect x="183" y="212" width="24" height="5" rx="2" fill="${c.bg1}" opacity="0.18"/>
      <rect x="189" y="225" width="22" height="10" rx="5" fill="${c.deco}" opacity="0.4"/>
    </g>`,

  pastetube: (c) => `
    <g opacity="0.95">
      <rect x="183" y="161" width="34" height="82" rx="4" fill="white"/>
      <path d="M183 243 Q183 270 200 270 Q217 270 217 243 Z" fill="white" opacity="0.85"/>
      <rect x="189" y="151" width="22" height="14" rx="4" fill="white" opacity="0.8"/>
      <rect x="186" y="185" width="28" height="7" rx="3" fill="${c.bg1}" opacity="0.28"/>
      <rect x="186" y="198" width="20" height="5" rx="2" fill="${c.bg1}" opacity="0.2"/>
    </g>`,

  sachet: (c) => `
    <g opacity="0.95">
      <rect x="157" y="174" width="86" height="54" rx="7" fill="white"/>
      <line x1="157" y1="191" x2="243" y2="191" stroke="${c.bg1}" stroke-width="2" opacity="0.28"/>
      <line x1="157" y1="212" x2="243" y2="212" stroke="${c.bg1}" stroke-width="2" opacity="0.28"/>
      <rect x="165" y="197" width="62" height="10" rx="3" fill="${c.bg1}" opacity="0.18"/>
      <path d="M157 174 L169 162 L181 174" fill="none" stroke="${c.bg1}" stroke-width="2" opacity="0.4"/>
    </g>`,

  // ── Accesorios ────────────────────────────────────────────────────────────────

  collar: (c) => `
    <g opacity="0.95">
      <circle cx="200" cy="196" r="60" fill="none" stroke="white" stroke-width="20"/>
      <circle cx="200" cy="256" r="12" fill="white" opacity="0.9"/>
      <rect x="196" y="250" width="8" height="16" rx="2" fill="white" opacity="0.75"/>
    </g>`,

  leash: (c) => `
    <g opacity="0.95">
      <rect x="172" y="158" width="56" height="38" rx="10" fill="white"/>
      <circle cx="200" cy="177" r="12" fill="${c.bg1}" opacity="0.25"/>
      <circle cx="200" cy="177" r="5" fill="${c.bg1}" opacity="0.4"/>
      <path d="M200 196 Q180 222 174 263" stroke="white" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="171" cy="266" r="10" fill="white" opacity="0.9"/>
    </g>`,

  harness: (c) => `
    <g opacity="0.95">
      <ellipse cx="200" cy="190" rx="52" ry="24" fill="none" stroke="white" stroke-width="10"/>
      <line x1="200" y1="166" x2="200" y2="252" stroke="white" stroke-width="10" stroke-linecap="round"/>
      <ellipse cx="200" cy="244" rx="36" ry="18" fill="none" stroke="white" stroke-width="10"/>
    </g>`,

  bed: (c) => `
    <g opacity="0.95">
      <ellipse cx="200" cy="232" rx="72" ry="34" fill="white"/>
      <path d="M146 218 Q146 180 174 174 L226 174 Q254 180 254 218 Z" fill="white" opacity="0.9"/>
      <ellipse cx="200" cy="190" rx="30" ry="13" fill="${c.deco}" opacity="0.45"/>
    </g>`,

  fountain: (c) => `
    <g opacity="0.95">
      <path d="M177 270 L223 270 L232 196 Q200 159 168 196 Z" fill="white"/>
      <path d="M200 146 Q217 168 217 185 A17 17 0 0 1 183 185 Q183 168 200 146Z" fill="white" opacity="0.9"/>
      <ellipse cx="200" cy="270" rx="28" ry="9" fill="white" opacity="0.8"/>
    </g>`,

  carrier: (c) => `
    <g opacity="0.95">
      <rect x="152" y="191" width="96" height="74" rx="9" fill="white"/>
      <rect x="163" y="169" width="74" height="26" rx="6" fill="white" opacity="0.85"/>
      <line x1="181" y1="197" x2="181" y2="258" stroke="${c.bg1}" stroke-width="4.5" opacity="0.28" stroke-linecap="round"/>
      <line x1="200" y1="197" x2="200" y2="258" stroke="${c.bg1}" stroke-width="4.5" opacity="0.28" stroke-linecap="round"/>
      <line x1="219" y1="197" x2="219" y2="258" stroke="${c.bg1}" stroke-width="4.5" opacity="0.28" stroke-linecap="round"/>
      <ellipse cx="200" cy="186" rx="15" ry="7" fill="${c.bg1}" opacity="0.22"/>
    </g>`,

  kong: (c) => `
    <g opacity="0.95">
      <path d="M200 143 L184 164 L162 164 L175 182 L167 203 L200 191 L233 203 L225 182 L238 164 L216 164 Z" fill="white"/>
      <circle cx="200" cy="218" r="20" fill="white" opacity="0.9"/>
    </g>`,

  // ── Equipamiento Clínico ──────────────────────────────────────────────────────

  medsyringe: (c) => `
    <g opacity="0.95">
      <rect x="180" y="153" width="40" height="92" rx="4" fill="white"/>
      <rect x="188" y="245" width="24" height="14" rx="2" fill="white" opacity="0.85"/>
      <line x1="200" y1="259" x2="200" y2="281" stroke="white" stroke-width="5" stroke-linecap="round"/>
      <rect x="168" y="160" width="12" height="7" rx="1" fill="white" opacity="0.8"/>
      <rect x="220" y="160" width="12" height="7" rx="1" fill="white" opacity="0.8"/>
      <rect x="188" y="178" width="24" height="52" rx="2" fill="${c.bg1}" opacity="0.2"/>
      <line x1="190" y1="190" x2="197" y2="190" stroke="${c.bg1}" stroke-width="2" opacity="0.35"/>
      <line x1="190" y1="205" x2="197" y2="205" stroke="${c.bg1}" stroke-width="2" opacity="0.35"/>
      <line x1="190" y1="220" x2="197" y2="220" stroke="${c.bg1}" stroke-width="2" opacity="0.35"/>
    </g>`,

  glove: (c) => `
    <g opacity="0.95">
      <path d="M175 198 L165 187 L165 161 Q165 149 175 149 L175 187 L185 187
               L185 149 Q185 137 193 137 Q201 137 201 149 L201 187
               L209 187 L209 149 Q209 137 217 137 Q225 137 225 149 L225 187
               L233 187 L233 164 Q233 154 225 154 L225 198
               Q225 263 200 263 Q175 263 175 198Z" fill="white"/>
    </g>`,

  thermometer: (c) => `
    <g opacity="0.95">
      <rect x="194" y="138" width="12" height="94" rx="6" fill="white"/>
      <circle cx="200" cy="240" r="19" fill="white"/>
      <rect x="197" y="185" width="6" height="58" rx="3" fill="#fca5a5" opacity="0.8"/>
      <circle cx="200" cy="240" r="12" fill="#ef4444" opacity="0.85"/>
      <line x1="208" y1="165" x2="214" y2="165" stroke="${c.deco}" stroke-width="2" opacity="0.5"/>
      <line x1="208" y1="180" x2="214" y2="180" stroke="${c.deco}" stroke-width="2" opacity="0.5"/>
      <line x1="208" y1="195" x2="214" y2="195" stroke="${c.deco}" stroke-width="2" opacity="0.5"/>
    </g>`,
};

// ── Product definitions (57 total) ────────────────────────────────────────────
const PRODUCTS = [
  // MEDICAMENTOS
  { code: 'MED-001', name: 'Amoxicilina 500mg x20', brand: 'Vetoquinol', icon: 'pill', prefix: 'MED' },
  { code: 'MED-002', name: 'Metronidazol 250mg x30', brand: 'Bayer', icon: 'pill', prefix: 'MED' },
  { code: 'MED-003', name: 'Ivermectina 1% Iny. 50ml', brand: 'Virbac', icon: 'bottle', prefix: 'MED' },
  { code: 'MED-004', name: 'Prednisolona 5mg x20', brand: 'Medi-Vet', icon: 'pill', prefix: 'MED' },
  { code: 'MED-005', name: 'Tramadol 50mg Gotas 10ml', brand: 'Holliday-Scott', icon: 'dropper', prefix: 'MED' },
  { code: 'MED-006', name: 'Enrofloxacina 50mg/ml 50ml', brand: 'Bayer', icon: 'bottle', prefix: 'MED' },
  { code: 'MED-007', name: 'Furosemida 40mg x20', brand: 'Holliday-Scott', icon: 'pill', prefix: 'MED' },
  { code: 'MED-008', name: 'Cefalexina 500mg x12', brand: 'Zoetis', icon: 'capsule', prefix: 'MED' },
  { code: 'MED-009', name: 'AAS Vet 100mg x30', brand: 'Medi-Vet', icon: 'pill', prefix: 'MED' },
  { code: 'MED-010', name: 'Omeprazol Vet 20mg x14', brand: 'Virbac', icon: 'capsule', prefix: 'MED' },
  // ALIMENTOS
  { code: 'ALI-001', name: 'Royal Canin Medium Adult 3kg', brand: 'Royal Canin', icon: 'foodbag', prefix: 'ALI' },
  { code: 'ALI-002', name: 'Pro Plan Puppy 1.5kg', brand: 'Purina', icon: 'foodbag', prefix: 'ALI' },
  { code: 'ALI-003', name: "Hill's Feline Adult 2kg", brand: "Hill's", icon: 'foodbag', prefix: 'ALI' },
  { code: 'ALI-004', name: 'Whiskas Atun en Salsa x24', brand: 'Whiskas', icon: 'pouch', prefix: 'ALI' },
  { code: 'ALI-005', name: 'Pedigree Razas Pequeñas 4kg', brand: 'Pedigree', icon: 'foodbag', prefix: 'ALI' },
  { code: 'ALI-006', name: 'RC Sterilised Gatos 2kg', brand: 'Royal Canin', icon: 'foodbag', prefix: 'ALI' },
  { code: 'ALI-007', name: 'Cesar Pollo 100g x7', brand: 'Cesar', icon: 'tray', prefix: 'ALI' },
  { code: 'ALI-008', name: 'Eukanuba Puppy Gr. 3kg', brand: 'Eukanuba', icon: 'foodbag', prefix: 'ALI' },
  { code: 'ALI-009', name: 'Frolic Pollo+Zanahoria 1kg', brand: 'Frolic', icon: 'pouch', prefix: 'ALI' },
  { code: 'ALI-010', name: 'Brit Gatos Sterilised 2kg', brand: 'Brit', icon: 'foodbag', prefix: 'ALI' },
  { code: 'ALI-011', name: 'Dentastix Medianos x7', brand: 'Pedigree', icon: 'dentalstick', prefix: 'ALI' },
  { code: 'ALI-012', name: 'Fancy Feast Salmon x12', brand: 'Fancy Feast', icon: 'can', prefix: 'ALI' },
  // ANTIPARASITARIOS
  { code: 'ANT-001', name: 'Frontline Plus 10-20kg x3', brand: 'Frontline', icon: 'pipette', prefix: 'ANT' },
  { code: 'ANT-002', name: 'Bravecto Masticable 10-20kg', brand: 'Bravecto', icon: 'pill', prefix: 'ANT' },
  { code: 'ANT-003', name: 'NexGard 4-10kg x3', brand: 'NexGard', icon: 'pill', prefix: 'ANT' },
  { code: 'ANT-004', name: 'Advantage Gatos x4', brand: 'Advantage', icon: 'pipette', prefix: 'ANT' },
  { code: 'ANT-005', name: 'Drontal Plus hasta 35kg x2', brand: 'Drontal', icon: 'pill', prefix: 'ANT' },
  { code: 'ANT-006', name: 'Milbemax Gatos x2', brand: 'Milbemax', icon: 'pill', prefix: 'ANT' },
  { code: 'ANT-007', name: 'Revolution 10-20kg x3', brand: 'Revolution', icon: 'pipette', prefix: 'ANT' },
  { code: 'ANT-008', name: 'Stronghold Gatos x3', brand: 'Stronghold', icon: 'pipette', prefix: 'ANT' },
  // VACUNAS
  { code: 'VAC-001', name: 'Vacuna Antirrabica Canina', brand: 'Nobivac', icon: 'vial', prefix: 'VAC' },
  { code: 'VAC-002', name: 'Vacuna Sextuple DHPPI+L', brand: 'Nobivac', icon: 'vial', prefix: 'VAC' },
  { code: 'VAC-003', name: 'Vacuna Triple Felina HCP', brand: 'Felocell', icon: 'vial', prefix: 'VAC' },
  { code: 'VAC-004', name: 'Vacuna Bordetella Intra.', brand: 'Bronchi-Shield', icon: 'vial', prefix: 'VAC' },
  { code: 'VAC-005', name: 'Vacuna Leucemia FeLV', brand: 'Purevax', icon: 'vial', prefix: 'VAC' },
  { code: 'VAC-006', name: 'Vacuna Parvovirus CPV-2', brand: 'Neopar', icon: 'vial', prefix: 'VAC' },
  // HIGIENE
  { code: 'HIG-001', name: 'Shampoo Antipulgas 500ml', brand: 'Virbac', icon: 'shampoo', prefix: 'HIG' },
  { code: 'HIG-002', name: 'Shampoo Medicado 300ml', brand: 'Douxo', icon: 'shampoo', prefix: 'HIG' },
  { code: 'HIG-003', name: 'Limpiador Otico 125ml', brand: 'Otoclean', icon: 'earcleaner', prefix: 'HIG' },
  { code: 'HIG-004', name: 'Pasta Dental Canina 70g', brand: 'Virbac', icon: 'toothpaste', prefix: 'HIG' },
  { code: 'HIG-005', name: 'Toallitas Mascotas x50', brand: 'Pet Clean', icon: 'wipes', prefix: 'HIG' },
  { code: 'HIG-006', name: 'Cepillo Deslizador Doble', brand: 'FurPet', icon: 'brush', prefix: 'HIG' },
  // SUPLEMENTOS
  { code: 'SUP-001', name: 'Omega 3 Perros 90 caps', brand: 'Vetri-Science', icon: 'suppbottle', prefix: 'SUP' },
  { code: 'SUP-002', name: 'Artri-Vet Condroitina x60', brand: 'Artri-Vet', icon: 'capsule', prefix: 'SUP' },
  { code: 'SUP-003', name: 'Nutri-Cal Pasta 120g', brand: 'Nutri-Cal', icon: 'pastetube', prefix: 'SUP' },
  { code: 'SUP-004', name: 'Calcio Vet Plus x60', brand: 'CalciVet', icon: 'pill', prefix: 'SUP' },
  { code: 'SUP-005', name: 'FortiFlora Gatos x30 sob.', brand: 'FortiFlora', icon: 'sachet', prefix: 'SUP' },
  // ACCESORIOS
  { code: 'ACC-001', name: 'Collar Seresto Perros Gr.', brand: 'Seresto', icon: 'collar', prefix: 'ACC' },
  { code: 'ACC-002', name: 'Correa Retractil 5m', brand: 'Flexi', icon: 'leash', prefix: 'ACC' },
  { code: 'ACC-003', name: 'Arnes Acolchado Talla M', brand: 'Ruffwear', icon: 'harness', prefix: 'ACC' },
  { code: 'ACC-004', name: 'Cama Ortopedica Grande', brand: 'MemoryPet', icon: 'bed', prefix: 'ACC' },
  { code: 'ACC-005', name: 'Bebedero Automatico 2L', brand: 'PetSafe', icon: 'fountain', prefix: 'ACC' },
  { code: 'ACC-006', name: 'Transportadora Gatos M', brand: 'Vari Kennel', icon: 'carrier', prefix: 'ACC' },
  { code: 'ACC-007', name: 'Kong Classic Talla M', brand: 'Kong', icon: 'kong', prefix: 'ACC' },
  // EQUIPAMIENTO
  { code: 'EQP-001', name: 'Jeringas 5ml x100', brand: 'BD', icon: 'medsyringe', prefix: 'EQP' },
  { code: 'EQP-002', name: 'Guantes Nitrilo M x100', brand: 'Kimberly-Clark', icon: 'glove', prefix: 'EQP' },
  { code: 'EQP-003', name: 'Termometro Digital Vet', brand: 'Geratherm', icon: 'thermometer', prefix: 'EQP' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapText(name, maxLen = 20) {
  const words = name.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxLen && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines.slice(0, 2);
}

// ── SVG template ──────────────────────────────────────────────────────────────

function generateSVG(product) {
  const c = THEMES[product.prefix];
  const iconFn = ICONS[product.icon];
  const iconSVG = iconFn ? iconFn(c) : '';
  const nameLines = wrapText(product.name);
  const nameStartY = nameLines.length > 1 ? 316 : 329;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c.bg1}"/>
      <stop offset="100%" stop-color="${c.bg2}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="white" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="400" height="400" rx="24" fill="url(#bg)"/>
  <rect width="400" height="400" rx="24" fill="url(#shine)"/>

  <!-- Decorative circles -->
  <circle cx="358" cy="42" r="88" fill="white" opacity="0.06"/>
  <circle cx="42" cy="358" r="66" fill="white" opacity="0.06"/>
  <circle cx="380" cy="380" r="110" fill="white" opacity="0.04"/>
  <circle cx="12" cy="12" r="50" fill="white" opacity="0.04"/>

  <!-- Icon glow halo -->
  <circle cx="200" cy="188" r="102" fill="white" opacity="0.08" filter="url(#glow)"/>
  <circle cx="200" cy="188" r="88" fill="white" opacity="0.08"/>

  <!-- Icon -->
  ${iconSVG}

  <!-- Bottom band -->
  <rect x="0" y="296" width="400" height="104" rx="0" fill="white" opacity="0.14"/>
  <rect x="0" y="376" width="400" height="24" fill="white" opacity="0.08"/>

  <!-- Divider -->
  <line x1="32" y1="304" x2="368" y2="304" stroke="white" stroke-width="1" opacity="0.2"/>

  <!-- Code badge -->
  <rect x="14" y="14" width="90" height="30" rx="8" fill="${c.badge}" opacity="0.88"/>
  <text x="59" y="34" font-family="'Segoe UI',Arial,sans-serif" font-size="13" font-weight="700"
        fill="${c.text}" text-anchor="middle" letter-spacing="0.8">${escapeXml(product.code)}</text>

  <!-- Brand -->
  <text x="386" y="33" font-family="'Segoe UI',Arial,sans-serif" font-size="11" font-style="italic"
        fill="white" text-anchor="end" opacity="0.7">${escapeXml(product.brand)}</text>

  <!-- Product name lines -->
  ${nameLines.map((line, i) =>
    `<text x="200" y="${nameStartY + i * 23}" font-family="'Segoe UI',Arial,sans-serif" font-size="17"
        font-weight="600" fill="white" text-anchor="middle">${escapeXml(line)}</text>`
  ).join('\n  ')}

  <!-- Category label -->
  <text x="200" y="392" font-family="'Segoe UI',Arial,sans-serif" font-size="9" font-weight="400"
        fill="white" text-anchor="middle" opacity="0.45" letter-spacing="2">${escapeXml(LABELS[product.prefix])}</text>
</svg>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Generador de imágenes de productos CliniCore ===\n');

  // 1. Create uploads directory
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`Directorio creado: ${UPLOADS_DIR}\n`);
  } else {
    console.log(`Directorio ya existe: ${UPLOADS_DIR}\n`);
  }

  // 2. Generate SVG files
  console.log('Generando imágenes SVG...');
  for (const product of PRODUCTS) {
    const svg = generateSVG(product);
    const filePath = path.join(UPLOADS_DIR, `${product.code}.svg`);
    fs.writeFileSync(filePath, svg, 'utf8');
    console.log(`  ✓  ${product.code}.svg  —  ${product.name}`);
  }

  // 3. Update database records
  console.log('\nActualizando base de datos...');
  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const product of PRODUCTS) {
    const imagenPath = `${BASE_URL}/${product.code}.svg`;
    const existing = await prisma.producto.findUnique({
      where: { codigoInterno: product.code },
      select: { id: true, imagen: true },
    });

    if (!existing) {
      console.log(`  ⚠  ${product.code} no encontrado en la base de datos`);
      notFound++;
      continue;
    }

    if (existing.imagen) {
      console.log(`  –  ${product.code} ya tiene imagen, se omite`);
      skipped++;
      continue;
    }

    await prisma.producto.update({
      where: { codigoInterno: product.code },
      data: { imagen: imagenPath },
    });
    console.log(`  ✓  ${product.code} → ${imagenPath}`);
    updated++;
  }

  console.log(`\n=== Resumen ===`);
  console.log(`  Imágenes generadas : ${PRODUCTS.length}`);
  console.log(`  BD actualizados    : ${updated}`);
  console.log(`  BD omitidos        : ${skipped}`);
  console.log(`  No encontrados     : ${notFound}`);
  console.log('\nListo.\n');
}

main()
  .catch((e) => { console.error('Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
