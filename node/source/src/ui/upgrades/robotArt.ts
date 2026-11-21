import { itemColorCss } from '../../content/items';
import { CORE_RESEARCH } from '../../content/coreResearch';
import { STAGES } from '../../content/botUpgrades';

/** Distinct chassis contours; the shared visor keeps the same character recognizable. */
export function robotArtParts(tier: number) {
  const accent = tier ? itemColorCss(CORE_RESEARCH[tier - 1].item) : '#a0b3bf';
  const line = '#8c9da7';
  const stroke = (d: string, color = line, width = 2) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
  const plate = (d: string, fill = '#272e33', color = line) => `<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="2"/>`;
  const circle = (x: number, y: number, r: number, color = line, fill = '#1d2328') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${color}" stroke-width="2"/>`;
  const reflect = (art: string) => art + `<g transform="translate(320 0) scale(-1 1)">${art}</g>`;
  const claw = (x: number, y: number) => stroke(`M${x} ${y}l-8 9 2 10 M${x + 8} ${y}l4 11-5 9`);
  // Each tier changes the outside contour and proportions, not just the surface detail.
  const torsos = [
    'M139 147H181L187 158L182 222L173 232H147L138 222L133 158Z',
    'M128 145Q160 130 192 145L202 172V206Q196 237 160 242Q124 237 118 206V172Z',
    'M119 142H201L209 162L199 226L185 240H135L121 226L111 162Z',
    'M137 139H183L197 157L185 239H135L123 157Z',
    'M129 141Q160 132 191 141L207 168V209Q197 242 160 245Q123 242 113 209V168Z',
    'M160 135L208 153L199 207L178 244H142L121 207L112 153Z',
    'M130 136H190L210 157L197 223L181 244H139L123 223L110 157Z',
    'M160 131L209 146L219 176L202 224L180 249H140L118 224L101 176L111 146Z',
  ];
  const legs = [
    plate('M141 229H153L149 293H137Z') + plate('M167 229H179L183 293H171Z') + plate('M137 291H151V307L125 313H119V304Z') + plate('M169 291H183L201 304V313H195L169 307Z'),
    reflect(plate('M132 235L150 241L145 291H126Z') + circle(139, 271, 5) + plate('M126 290H147V310H112V303Z')),
    reflect(plate('M124 236H150L144 289H119Z') + plate('M117 286H146V312H101V301Z') + stroke('M127 251H144 M123 296H139', accent)),
    reflect(plate('M135 235H153L141 275L129 297H113L125 266Z') + circle(133, 272, 6) + plate('M112 294H132L137 307L131 315H98V307Z')),
    reflect(plate('M126 237H151L142 280L135 293H113L117 271Z') + circle(134, 271, 7, accent) + plate('M112 290H139L146 309L137 316H94V307Z') + stroke('M105 307H136', accent)),
    reflect(plate('M128 239L151 246L139 290L123 300L113 284Z', '#283633') + plate('M117 291L140 287L146 306L135 316H90L98 305Z') + stroke('M122 247L127 275L119 287', accent)),
    reflect(plate('M126 238H151L140 270L120 298H98L110 268Z') + circle(127, 271, 7, accent) + plate('M99 293H123L132 310L123 316H79V308Z') + stroke('M112 259L123 265', accent)),
    reflect(plate('M121 239H151L137 273L111 297H88L99 268Z') + plate('M88 292H116L127 310L117 318H67V308Z', '#333329', accent) + stroke('M84 307H111 M112 252L122 263', accent)),
  ];
  const arms = [
    reflect(circle(128, 161, 6) + stroke('M127 168L116 202L110 228', line, 4) + circle(116, 202, 5) + claw(104, 231)),
    reflect(circle(113, 163, 9) + plate('M107 171H119L109 209H97Z') + circle(103, 211, 6) + plate('M97 216H108V241H94Z') + claw(94, 242)),
    reflect(plate('M94 141H120L125 166L106 180L87 166Z') + plate('M93 180H108L98 211H80Z') + circle(89, 214, 7) + plate('M79 221H99V246H76Z') + claw(76, 249) + stroke('M87 230H92', accent, 3)),
    reflect(plate('M98 142L124 150L115 168L91 161Z') + stroke('M94 163L74 198L82 235', line, 5) + circle(74, 199, 7) + plate('M76 233H90L96 253L83 258L73 245Z') + claw(80, 256)),
    reflect(circle(103, 161, 10, accent) + plate('M91 174H111L97 213L79 211Z') + circle(85, 218, 8, accent) + plate('M72 223H94L99 248L80 258L67 245Z') + claw(75, 257)),
    reflect(plate('M113 139L82 127L59 141L85 178L111 167Z', '#283633', accent) + plate('M82 179L96 185L78 220L62 215Z') + plate('M60 219L79 223L78 255L58 263L48 249Z', '#283633', accent) + claw(56, 264) + stroke('M73 143L92 151L97 166 M57 232L67 248', accent, 1.3)),
    reflect(plate('M93 139L118 146L116 166L91 171L77 155Z', '#292c38', accent) + stroke('M87 172L57 205L70 247', line, 5) + circle(57, 205, 8, accent) + plate('M61 244L79 240L90 262L73 273L59 261Z') + claw(72, 273)),
    reflect(plate('M99 135L119 146L111 167L84 172L65 152Z', '#333329', accent) + stroke('M83 176L49 209L58 249', line, 5) + circle(49, 209, 9, accent) + plate('M48 247H68L77 272L57 284L43 268Z', '#333329', accent) + claw(54, 283)),
  ];
  const auxiliary = tier >= 3 ? reflect(
    stroke(tier === 3 ? 'M126 145L86 124L50 149L43 200' : tier < 6 ? 'M123 146L77 137L47 170L43 201' : 'M120 143L76 117L30 139L24 179', line, 3)
    + (tier < 6 ? circle(tier === 3 ? 50 : 47, tier === 3 ? 149 : 170, 5, accent) + claw(39, 200) : circle(30, 139, 6, accent) + claw(19, 180))
  ) : '';
  const back = [
    '',
    plate('M133 133V120H143V137 M177 137V120H187V133', '#20282d'),
    plate('M125 135V123H143V136 M177 136V123H195V135', '#20282d'),
    plate('M136 139V122H184V139', '#20282d') + stroke('M174 63V27H188V19') + circle(188, 16, 4, accent),
    reflect(plate('M80 149Q91 138 102 149V223Q91 234 80 223Z', '#1c2b30', accent) + stroke('M82 163H100 M82 211H100 M87 147V127Q106 114 128 137', accent, 2.5)),
    reflect(plate('M104 140L88 103L68 111L61 143L84 166Z', '#283633', accent) + stroke('M88 115L98 137L86 151', accent, 1.3)),
    reflect(plate('M122 137L104 106V42L118 34L127 74L137 130Z', '#292c38', accent) + stroke('M114 48V94 M111 105L124 123', accent, 1.3) + circle(105, 29, 4, accent)),
    stroke('M112 43L77 38L42 61L26 104V138 M208 43L243 38L278 61L294 104V138', accent, 2.5)
      + reflect(plate('M76 27L98 38L83 57L60 48Z', '#333329', accent) + plate('M16 97L33 89L47 107L31 124L15 113Z', '#333329', accent))
      + stroke('M142 62L128 39L143 18L160 29L177 18L192 39L178 62', accent, 2.5),
  ];
  const torso = plate(torsos[tier], tier >= 5 ? '#283236' : '#272e33')
    + stroke(tier === 0 ? 'M143 159H177 M147 217H173' : 'M132 159H188 M137 221H183', '#586974', 1.5);
  const core = tier ? plate('M146 173L160 164L174 173V192L160 202L146 192Z', '#202c32', accent)
    + stroke('M160 171L169 183L160 195L151 183Z', accent, 1.5) + circle(160, 183, 2, '#e6e3d8')
    : plate('M148 176H172V197H148Z', '#1b2227', '#586974') + stroke('M153 187H167');
  const details = (tier === 1 ? stroke('M137 209Q160 224 183 209', accent, 1.5) : '')
    + (tier >= 3 ? stroke('M150 212H170 M148 217H172', accent, 1.3) : '')
    + (tier === 4 ? reflect(stroke('M103 181Q132 183 127 211L119 232', accent, 3)) : '')
    + (tier >= 5 ? reflect(plate('M128 167L140 153L145 169L135 177Z', '#2b3b37', accent) + stroke('M133 202L145 216L139 228', accent, 1.3)) : '')
    + (tier === 7 ? CORE_RESEARCH.map((core, i) => circle(130 + i * 10, 216, 2, itemColorCss(core.item))).join('') : '');
  const face = plate('M147 126H173V145H147Z')
    + plate('M124 74L139 63H181L196 74V116L181 128H139L124 116Z')
    + plate('M133 81H187V107L179 114H141L133 107Z', '#151d22', '#607783')
    + stroke('M144 99H152 M168 99H176', accent, 3.5) + stroke('M149 120H171', '#b6c3c9', 1.5)
    + stroke('M145 64V48L136 40') + circle(135, 38, 3, accent)
    + circle(130, 77, 2) + circle(190, 77, 2);
  return { floor: stroke('M62 326H258 M78 332H242', '#46535c', 1), back: back[tier], auxiliary,
    legs: legs[tier], arms: arms[tier], torso, core, details, face };
}

export function robotSvg(tier: number): string {
  const parts = robotArtParts(tier);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 350" role="img" aria-labelledby="title"><title id="title">${STAGES[tier].role} (${STAGES[tier].label} AI bot)</title><g stroke-linejoin="round" stroke-linecap="round">${Object.values(parts).join('')}</g></svg>`;
}
