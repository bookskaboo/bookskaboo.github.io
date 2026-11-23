import { CORE_RESEARCH } from './coreResearch';
import type { GameState, ResearchProject } from '../domain/types';

export const ASSIGNMENT = 'You are a junior AI bot assigned to this world. Use its resources to build production systems, manufacture Cores, and upgrade yourself.';
export const STAGES = [
  { label: 'Junior', role: 'Probationary Unit', module: 'Arrival chassis', mission: 'Establish a foothold. Start with the resources around you.', thought: 'One planet. One junior employee. The allocation seems optimistic.', hardware: 'Narrow bare chassis, thin legs and small manipulator claws.' },
  { label: 'Simple', role: 'Resource Technician', module: 'Simple upgrade', mission: 'Build your first working production lines and supply research.', thought: 'I have been issued a functioning thought. More are expected.', hardware: 'Compact rounded chest shell, seated Core and narrow legs.' },
  { label: 'Basic', role: 'Fabrication Specialist', module: 'Basic upgrade', mission: 'Build reliable assembly lines. Keep earlier Core supplies running.', thought: 'Additional hands approved. Staffing remains unchanged.', hardware: 'Broad square shoulders, heavy legs and reinforced working hands.' },
  { label: 'Automata', role: 'Systems Coordinator', module: 'Automata upgrade', mission: 'Expand into nearby maps and connect a larger factory.', thought: 'Delegation is easier when I also manufacture the delegates.', hardware: 'Tall sensor mast, tapered chassis and four spread tool arms.' },
  { label: 'Hydro', role: 'Operations Supervisor', module: 'Hydro upgrade', mission: 'Build around Lakes and bring fluid processing into production.', thought: 'Waterproofing approved after the water was discovered.', hardware: 'Rounded sealed torso, external coolant tanks, hoses and flared boots.' },
  { label: 'Shiny', role: 'Development Director', module: 'Shiny upgrade', mission: 'Develop Mythril supply and build with advanced materials.', thought: 'A rare-metal finish. My job title is still under review.', hardware: 'Swept angular Mythril shoulders, faceted chest and long armored forearms.' },
  { label: 'Complex', role: 'Planetary Administrator', module: 'Complex upgrade', mission: 'Coordinate advanced production and prepare for the four corners.', thought: 'I can now consider several poor decisions simultaneously.', hardware: 'Tall paired processor fins, four widely spread arms and a braced stance.' },
  { label: 'Final', role: 'Self-Optimizing Intelligence', module: 'Final upgrade', mission: 'Complete your upgrades. Keep production running afterwards.', thought: 'Assignment nearly complete. There is always another adjustment.', hardware: 'Broad orbital frame, split crown, seven-tier Core housing and stabilizing feet.' },
] as const;

export const BOT_UPGRADES: Array<{ id: string; item: (typeof CORE_RESEARCH)[number]['item']; label: string; prerequisite?: string; currentCoreId: string; nextCore?: string }> = CORE_RESEARCH.map((core, index) => ({
  id: CORE_RESEARCH[index + 1]?.id ?? 'finalBotUpgrade',
  item: core.item,
  label: STAGES[index + 1].module,
  prerequisite: index === 0 ? undefined : core.id,
  currentCoreId: core.id,
  nextCore: CORE_RESEARCH[index + 1]?.name,
}));

/** Benefits shared by the preview tooltip and completion announcement. */
export function botUpgradeBenefits(id: string, completed = false) {
  const upgrade = BOT_UPGRADES.find(entry => entry.id === id);
  if (!upgrade) return '';
  if (!upgrade.nextCore) return completed ? 'All character upgrades complete.' : 'Complete the final character upgrade.';
  const recipe = completed ? `${upgrade.nextCore} recipe unlocked.` : `Unlock the ${upgrade.nextCore} recipe.`;
  if (id !== 'finalCore') return recipe;
  return `${recipe} ${completed ? 'Yin and Yang recipes unlocked. All four corner locations revealed. Reaching them still requires ordinary map expansion.' : 'Unlock the Yin and Yang recipes.'}`;
}

/** Existing recipe-unlock IDs now present the upgrade that pays for the NEXT Core. */
export function presentProject(project: ResearchProject): ResearchProject {
  const index = BOT_UPGRADES.findIndex(upgrade => upgrade.id === project.id);
  if (index < 0) return project;
  const stage = STAGES[index + 1];
  return { ...project, name: stage.module,
    description: `Upgrade to ${stage.role}. ${botUpgradeBenefits(project.id)}`,
    flavorText: stage.thought };
}


export function nextBotUpgrade(game: GameState) { return BOT_UPGRADES.find(upgrade => !game.research.completed.includes(upgrade.id)); }
export function characterStage(game: GameState) { return BOT_UPGRADES.reduce((stage, upgrade, index) => game.research.completed.includes(upgrade.id) ? index + 1 : stage, 0); }

/** Only the unmodded runtime catalog opts into character progression. */
export function applyBotUpgradeCatalog(projects: ResearchProject[]) {
  for (const [tier, upgrade] of BOT_UPGRADES.entries()) {
    const existing = projects.find(project => project.id === upgrade.id);
    const project = presentProject({ ...(existing ?? { id: upgrade.id, name: upgrade.label, category: 'Character', description: '', unlock: 'All character upgrades complete.' }),
      costs: Object.fromEntries(CORE_RESEARCH.slice(0, tier + 1).map(core => [core.item, 5])),
      prerequisite: upgrade.prerequisite, prerequisites: [], coreAccessPrerequisites: false });
    if (existing) Object.assign(existing, project); else projects.push(project);
  }
}
