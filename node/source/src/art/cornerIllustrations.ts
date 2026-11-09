import type { CornerType } from '../content/endgame';
import { DRAGON_ILLUSTRATION } from './dragonIllustration';

interface IllustrationLayer {
  path: string;
  filled: boolean;
  width: number;
  opacity: number;
}

export const CORNER_ARTBOARD = { width: DRAGON_ILLUSTRATION.width, height: DRAGON_ILLUSTRATION.height };

export const CORNER_ILLUSTRATIONS = {
  alpha: DRAGON_ILLUSTRATION.layers,
  foundry: [
    {
      path: 'M8 87V47L22 39H33V14H48V37H56V25H66V45H77V87Z M31 14V8H50V14Z M54 25V20H68V25Z M75 55V30H91V18H104V60H95V36H82V55Z',
      filled: true,
      width: 1.6,
      opacity: .66,
    },
    {
      path: 'M21 87V55L35 39H69L83 55V68H74V87Z M67 66H81L92 72H109V78H91L80 72H67Z M93 85H115L109 91H99Z',
      filled: true,
      width: 1.9,
      opacity: 1,
    },
    {
      path: 'M6 87H92 M35 22H46 M35 29H46 M58 32H64 M93 24H102 M93 30H102 M25 55H79 M30 86V72A19 19 0 0 1 68 72V86 M35 86V72A14 14 0 0 1 63 72V86 M38 48H45 M50 48H57 M62 48H69 M43 83C39 77 47 75 49 68C54 73 53 76 57 78Q59 81 56 83 M45 85H56 M102 78C102 81 100 81 101 84 M106 78V83 M100 88H108',
      filled: false,
      width: 1.08,
      opacity: .82,
    },
  ],
  reclamation: [
    {
      path: 'M10 88H111 M19 44V88 M55 49V88 M24 75L49 53 M25 53L49 75 M69 80V88 M96 72V88 M96 87L109 77',
      filled: false,
      width: 1.6,
      opacity: .66,
    },
    {
      path: 'M6 28H69V35H6Z M10 35H65L51 54V66H25V54Z M34 73H76L107 56Q112 54 115 59Q118 64 113 68L80 85H34A6 6 0 0 1 34 73Z',
      filled: true,
      width: 1.9,
      opacity: 1,
    },
    {
      path: 'M15 18L24 11L33 14L29 21H18Z M39 7L48 11L46 20L37 17Z M53 20L58 14L66 16L67 23H57Z M16 39L28 54 M60 39L48 54 M25 54H51 M29 60H47 M34 79H76L110 62 M40 76V82 M51 76V82 M62 76V82 M73 76V82 M83 73L86 79 M93 67L96 74 M103 62L106 69',
      filled: false,
      width: 1.08,
      opacity: .82,
    },
    {
      path: 'M78 34C81 21 96 18 104 28L108 33 M108 26V33L101 33 M78 43C82 55 97 58 104 48L108 42 M101 43L108 42V49 M85 41L89 33H98L102 41L98 45H88Z M85 41H102',
      filled: false,
      width: 1.6,
      opacity: .9,
    },
  ],
  grove: [
    {
      path: 'M19 25L31 41H25L36 54H30L43 69H23V82H16V69H4L14 54H9L16 41H11Z M98 23L110 39H104L115 54H109L117 69H103V81H96V69H79L91 54H85L94 39H89Z M7 87Q16 82 28 85 M91 86Q102 81 114 86',
      filled: false,
      width: 1.6,
      opacity: .66,
    },
    {
      path: 'M34 89L45 84C51 77 53 68 52 56L43 41L49 38L58 49L64 31L69 34L66 50L78 41L84 45L72 57C70 68 71 76 76 82L87 89H73L64 84L56 89Z',
      filled: true,
      width: 1.9,
      opacity: 1,
    },
    {
      path: 'M43 56C34 58 26 52 28 44C20 39 23 26 32 24C31 15 40 10 48 13C52 5 65 4 72 11C81 8 90 14 91 23C100 24 103 34 98 40C103 49 94 58 84 56C79 62 70 63 64 57C57 63 48 62 43 56Z',
      filled: true,
      width: 1.9,
      opacity: 1,
    },
    {
      path: 'M53 83Q59 76 58 64Q58 53 51 47L43 43 M58 63Q64 52 68 47L76 42 M65 79Q64 72 66 65 M62 55L61 46 M36 35Q41 29 47 33 M53 24Q58 19 65 23 M73 20Q81 18 84 25 M79 36Q85 33 90 37 M33 45Q37 49 43 47 M74 52Q79 54 84 49 M12 77L17 73 M109 77L104 73 M22 88L26 84L29 88 M92 89L95 84L98 88',
      filled: false,
      width: 1.08,
      opacity: .82,
    },
  ],
} satisfies Record<CornerType, readonly IllustrationLayer[]>;

export function cornerIllustrationFit(frameWidth: number, frameHeight: number) {
  const maxScaleX = frameWidth * .94 / CORNER_ARTBOARD.width;
  const scaleY = Math.min(maxScaleX, frameHeight * .75 / CORNER_ARTBOARD.height);
  return { scaleX: Math.min(maxScaleX, scaleY * 1.24), scaleY };
}
